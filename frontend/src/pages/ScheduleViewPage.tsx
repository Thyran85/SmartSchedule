import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { coursApi, classesApi, enseignantsApi, sallesApi, versionsApi } from '../services/api';
import { useActiveVersion } from '../hooks/useSchedule';
import type { Cours, Classe, Enseignant, Salle } from '../types';
import ScheduleGrid from '../components/ScheduleGrid';
import Modal from '../components/Modal';

export default function ScheduleViewPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { version } = useActiveVersion();
  const [courses, setCourses] = useState<Cours[]>([]);
  const [entity, setEntity] = useState<Classe | Enseignant | Salle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Cours | null>(null);

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
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const entityName = entity
    ? 'prenom' in entity
      ? `${(entity as Enseignant).prenom} ${(entity as Enseignant).nom}`
      : (entity as Classe | Salle).nom
    : '';

  const typeLabels: Record<string, string> = {
    classe: 'Classe',
    enseignant: 'Enseignant',
    salle: 'Salle',
  };

  const handleExport = (format: string) => {
    window.open(`/api/schedules/export/${format}/${type}/${id}/`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/edt" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{entityName || 'Chargement...'}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {typeLabels[type || ''] || type}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {version ? `Version: ${version.nom}` : 'Aucune version active'}
              {version?.score_qualite !== null && version?.score_qualite !== undefined && (
                <> · Score: <strong>{version.score_qualite}/100</strong></>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucun cours programmé</p>
          <p className="text-sm text-gray-400 mt-1">Générez d'abord un emploi du temps depuis la page Emplois du temps</p>
        </div>
      ) : (
        <ScheduleGrid
          courses={courses}
          onToggleLock={handleToggleLock}
          onCourseClick={setSelectedCourse}
          viewType={(type as 'classe' | 'enseignant' | 'salle') || 'classe'}
          entityName={entityName}
        />
      )}

      <Modal open={!!selectedCourse} onClose={() => setSelectedCourse(null)} title={selectedCourse?.matiere_nom || ''} size="sm">
        {selectedCourse && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Classe:</span>
                <p className="font-medium">{selectedCourse.classe_nom}</p>
              </div>
              <div>
                <span className="text-gray-500">Enseignant:</span>
                <p className="font-medium">{selectedCourse.enseignant_nom || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Salle:</span>
                <p className="font-medium">{selectedCourse.salle_nom || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Horaire:</span>
                <p className="font-medium">{selectedCourse.jour} {selectedCourse.heure_debut} - {selectedCourse.heure_fin}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedCourse.est_verrouille ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedCourse.est_verrouille ? 'Verrouillé' : 'Modifiable'}
              </span>
              {selectedCourse.est_demi_groupe && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Demi-groupe
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
