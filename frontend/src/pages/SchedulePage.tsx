import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Download, AlertTriangle, CalendarPlus,
  Clock, Sparkles, FileDown,
} from 'lucide-react';
import clsx from 'clsx';
import { versionsApi, classesApi, enseignantsApi, sallesApi } from '../services/api';
import type { ScheduleVersion, Classe, Enseignant, Salle } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card, { CardHeader } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

interface GenResult {
  cours_crees: number;
  conflits: string[];
  score: number;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-lg font-semibold text-muted">Non généré</span>;
  const tone = score >= 80 ? 'success' : score >= 50 ? 'gold' : 'danger';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Correct' : 'Faible';
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-3xl font-semibold leading-none text-ink">{score}</span>
      <span className="text-xs text-muted">/100</span>
      <Badge tone={tone}>{label}</Badge>
    </div>
  );
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const toast = useToast();

  const load = () => {
    Promise.all([
      versionsApi.list(),
      classesApi.list(),
      enseignantsApi.list(),
      sallesApi.list(),
    ]).then(([v, c, t, r]) => {
      setVersions(v.data.results);
      setClasses(c.data.results);
      setTeachers(t.data.results);
      setRooms(r.data.results);
    }).catch(() => {});
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!versionName.trim()) return;
    await versionsApi.create({ nom: versionName.trim() });
    toast.success('Version créée', `« ${versionName.trim()} » est prête à être générée.`);
    setCreateModal(false);
    setVersionName('');
    load();
  };

  const handleGenerate = async (id: number) => {
    setGeneratingId(id);
    setResult(null);
    try {
      const res = await versionsApi.generate(id);
      const r = res.data as GenResult;
      setResult(r);
      if (r.conflits.length > 0) {
        toast.warning('Génération avec conflits', `${r.cours_crees} cours créés · ${r.conflits.length} conflit(s).`);
      } else {
        toast.success('Génération réussie', `${r.cours_crees} cours créés · Score ${r.score}/100.`);
      }
      load();
    } catch (e) {
      console.error(e);
      toast.error('Échec de la génération', 'Une erreur est survenue pendant la génération.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleActivate = async (id: number) => {
    await versionsApi.activate(id);
    toast.success('Version activée', 'Cette version est désormais la version active.');
    load();
  };

  const handleExport = (format: string, type: string, id: number) => {
    window.open(`/api/schedules/export/${format}/${type}/${id}/`, '_blank');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Planification"
        title="Emplois du temps"
        subtitle="Création, génération et activation des versions"
        actions={
          <Button onClick={() => setCreateModal(true)} icon={<Plus />}>
            Nouvelle version
          </Button>
        }
      />

      {/* Résultat de génération */}
      {result && (
        <div
          className={clsx(
            'animate-pop-in rounded-[14px] border p-4 shadow-card',
            result.conflits.length > 0
              ? 'border-gold/40 bg-gold-soft/50'
              : 'border-success/40 bg-success-soft/50',
          )}
        >
          <div className="flex items-start gap-3">
            {result.conflits.length > 0
              ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-strong" />
              : <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-strong" />}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-ink">
                  Génération terminée — {result.cours_crees} cours créés
                </p>
                <Badge tone={result.score >= 80 ? 'success' : result.score >= 50 ? 'gold' : 'danger'}>
                  Score {result.score}/100
                </Badge>
              </div>
              {result.conflits.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-gold-strong">
                    {result.conflits.length} conflit(s) détecté(s) — afficher
                  </summary>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-body">
                    {result.conflits.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </details>
              )}
            </div>
            <button
              onClick={() => setResult(null)}
              className="shrink-0 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Versions */}
      {versions.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<CalendarPlus className="h-7 w-7" />}
            title="Aucune version"
            description="Créez une version d'emploi du temps pour commencer la génération."
            action={<Button onClick={() => setCreateModal(true)} icon={<Plus />}>Nouvelle version</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {versions.map((v, i) => (
            <Card
              key={v.id}
              padding="lg"
              className={clsx(
                'animate-fade-up',
                v.est_active && 'border-success/50 ring-2 ring-success/20',
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-ink">{v.nom}</h3>
                    {v.est_active && <Badge tone="success" dot>Active</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(v.date_creation).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0 text-muted" />
              </div>

              <div className="mt-4">
                <ScoreBadge score={v.score_qualite} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Play />}
                  disabled={generatingId !== null}
                  loading={generatingId === v.id}
                  onClick={() => handleGenerate(v.id)}
                >
                  {generatingId === v.id ? 'Génération…' : v.score_qualite === null ? 'Générer' : 'Régénérer'}
                </Button>
                {!v.est_active && (
                  <Button size="sm" variant="success" icon={<Check />} onClick={() => handleActivate(v.id)}>
                    Activer
                  </Button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" icon={<FileDown />}
                  onClick={() => handleExport('pdf', 'version', v.id)}>
                  PDF
                </Button>
                <Button size="sm" variant="outline" icon={<FileDown />}
                  onClick={() => handleExport('excel', 'version', v.id)}>
                  Excel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Consultation rapide */}
      <Card className="animate-fade-up" padding="lg">
        <CardHeader
          padding="lg"
          icon={<Clock className="h-5 w-5" />}
          title="Consulter un emploi du temps"
          subtitle="Naviguez vers la grille d'une classe, d'un enseignant ou d'une salle"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Par classe" htmlFor="view-classe">
            <Select id="view-classe"
              onChange={e => e.target.value && navigate(`/edt/classe/${e.target.value}`)}>
              <option value="">Sélectionner une classe…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </Field>
          <Field label="Par enseignant" htmlFor="view-enseignant">
            <Select id="view-enseignant"
              onChange={e => e.target.value && navigate(`/edt/enseignant/${e.target.value}`)}>
              <option value="">Sélectionner un enseignant…</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
            </Select>
          </Field>
          <Field label="Par salle" htmlFor="view-salle">
            <Select id="view-salle"
              onChange={e => e.target.value && navigate(`/edt/salle/${e.target.value}`)}>
              <option value="">Sélectionner une salle…</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Export info */}
      <Card className="animate-fade-up flex items-center gap-4 p-5" padding="md">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary-soft text-primary">
          <Download className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Exports PDF &amp; Excel</p>
          <p className="text-sm text-muted">
            Consultez d'abord un emploi du temps pour l'exporter au format souhaité.
          </p>
        </div>
      </Card>

      {/* Modal nouvelle version */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Nouvelle version"
        subtitle="Une version regroupe un emploi du temps généré"
        icon={<CalendarPlus className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer la version</Button>
          </>
        }
      >
        <Field label="Nom de la version" htmlFor="v-nom" required hint="Ex : Version S1 2026">
          <Input id="v-nom" type="text" value={versionName}
            onChange={e => setVersionName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Ex : Version S1 2026" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}