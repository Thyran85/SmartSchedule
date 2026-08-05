import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, CalendarX2, Clock, DoorOpen, GraduationCap, Lock, Unlock, Users } from 'lucide-react';
import { coursApi, classesApi, enseignantsApi, sallesApi } from '../services/api';
import { useActiveVersion } from '../hooks/useSchedule';
import type { Cours, Classe, Enseignant, Salle } from '../types';
import ScheduleGrid from '../components/ScheduleGrid';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const typeLabels: Record<string, string> = {
  classe: 'Classe',
  enseignant: 'Enseignant',
  salle: 'Salle',
};

export default function ScheduleViewPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { version } = useActiveVersion();
  const [courses, setCourses] = useState<Cours[]>([]);
  const [entity, setEntity] = useState<Classe | Enseignant | Salle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Cours | null>(null);
  const toast = useToast();

  const load = async () => {
    if (!id || !type) return;
    setLoading(true);
    try {
      const fetcher = type === 'classe' ? coursApi.byClass
        : type === 'enseignant' ? coursApi.byTeacher
        : coursApi.byRoom;
      const res = await fetcher(Number(id), version?.id);
      setCourses(res.data);

      const entityFetcher = type === 'classe' ? classesApi.list
        : type === 'enseignant' ? enseignantsApi.list
        : sallesApi.list;
      const entityRes = await entityFetcher();
      const found = entityRes.data.results.find((e: any) => e.id === Number(id));
      setEntity(found as Classe | Enseignant | Salle | null);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, type, version?.id]);

  const handleToggleLock = async (courseId: number) => {
    try {
      await coursApi.toggleLock(courseId);
      toast.info('Cours verrouillé', 'Il ne sera pas déplacé lors des prochaines générations.');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Action impossible', 'Impossible de verrouiller ce cours.');
    }
  };

  const entityName = entity
    ? 'prenom' in entity
      ? `${(entity as Enseignant).prenom} ${(entity as Enseignant).nom}`
      : (entity as Classe | Salle).nom
    : '';

  const handleExport = (format: string) => {
    window.open(`/api/schedules/export/${format}/${type}/${id}/`, '_blank');
  };

  const EntityIcon = type === 'classe' ? Users : type === 'enseignant' ? GraduationCap : DoorOpen;

  return (
    <div>
      <PageHeader
        kicker="Consultation"
        title={entityName || 'Emploi du temps'}
        subtitle={
          version
            ? `Version active : ${version.nom}${version.score_qualite !== null && version.score_qualite !== undefined ? ` · Score ${version.score_qualite}/100` : ''}`
            : 'Aucune version active — générez d’abord un emploi du temps'
        }
        crumbs={[
          { label: 'Emplois du temps', to: '/edt' },
          { label: entityName || typeLabels[type || ''] || 'Consultation' },
        ]}
        actions={
          <>
            <Button variant="outline" size="md" icon={<Download />} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
            <Button variant="success" size="md" icon={<Download />} onClick={() => handleExport('excel')}>
              Excel
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="card space-y-2 p-5">
          <Skeleton className="h-8 w-64" />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px]" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<CalendarX2 className="h-7 w-7" />}
            title="Aucun cours programmé"
            description={
              version
                ? 'Cette entité n’a aucun cours dans la version active. Régénérez l’emploi du temps si nécessaire.'
                : 'Générez d’abord un emploi du temps depuis la page Emplois du temps.'
            }
            action={
              <Link to="/edt">
                <Button variant="outline" icon={<Clock />}>Aller à la génération</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="primary" icon={<EntityIcon className="h-3.5 w-3.5" />}>
              {typeLabels[type || ''] || type}
            </Badge>
            <Badge tone="gold" icon={<Lock className="h-3.5 w-3.5" />}>
              Cliquez sur une case pour verrouiller
            </Badge>
            <span className="flex-1" />
            <Badge tone="neutral" icon={<Lock className="h-3.5 w-3.5" />}>
              {courses.filter(c => c.est_verrouille).length} verrouillé(s)
            </Badge>
          </div>

          <ScheduleGrid
            courses={courses}
            onToggleLock={handleToggleLock}
            onCourseClick={setSelectedCourse}
            viewType={(type as 'classe' | 'enseignant' | 'salle') || 'classe'}
            entityName={entityName}
          />
        </>
      )}

      <Modal
        open={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse?.matiere_nom || ''}
        subtitle="Détail du cours"
        icon={<Clock className="h-5 w-5" />}
        size="sm"
      >
        {selectedCourse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] bg-paper/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Users className="h-3.5 w-3.5" /> Classe
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{selectedCourse.classe_nom}</p>
              </div>
              <div className="rounded-[12px] bg-paper/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <GraduationCap className="h-3.5 w-3.5" /> Enseignant
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{selectedCourse.enseignant_nom || '—'}</p>
              </div>
              <div className="rounded-[12px] bg-paper/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <DoorOpen className="h-3.5 w-3.5" /> Salle
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{selectedCourse.salle_nom || '—'}</p>
              </div>
              <div className="rounded-[12px] bg-paper/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" /> Horaire
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {selectedCourse.jour} · {selectedCourse.heure_debut}–{selectedCourse.heure_fin}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={selectedCourse.est_verrouille ? 'gold' : 'neutral'} icon={selectedCourse.est_verrouille ? <Lock /> : <Unlock />}>
                {selectedCourse.est_verrouille ? 'Verrouillé' : 'Modifiable'}
              </Badge>
              {selectedCourse.est_demi_groupe && (
                <Badge tone="info">Demi-groupe</Badge>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}