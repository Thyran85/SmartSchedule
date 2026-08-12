import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, DoorOpen, BookOpen, Calendar,
  ArrowUpRight, Sparkles, Settings2, Wand2, CalendarDays,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  classesApi, enseignantsApi, sallesApi, matieresApi, versionsApi,
} from '../services/api';
import type { Classe, Enseignant, Salle, Matiere, ScheduleVersion } from '../types';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

interface Stat {
  icon: React.ElementType;
  label: string;
  value: string | number;
  to: string;
  tint: string;
  iconTint: string;
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  return (
    <Link
      to={stat.to}
      className="card card-hover group relative animate-fade-up overflow-hidden p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={clsx(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-125',
          stat.tint,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{stat.label}</p>
          <p className="mt-1.5 truncate font-display text-[24px] font-semibold leading-none text-ink sm:text-[28px]">
            {stat.value}
          </p>
        </div>
        <div
          className={clsx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-[13px] [&>svg]:h-5 [&>svg]:w-5',
            stat.iconTint,
          )}
        >
          <stat.icon />
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Voir
        <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <p className="text-sm text-muted">Non évalué</p>;
  const color = score >= 80 ? 'bg-success' : score >= 50 ? 'bg-gold' : 'bg-danger';
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-display text-3xl font-semibold text-ink">{score}/100</span>
        <Badge tone={score >= 80 ? 'success' : score >= 50 ? 'gold' : 'danger'}>
          {score >= 80 ? 'Excellent' : score >= 50 ? 'Correct' : 'Faible'}
        </Badge>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

const quickActions = [
  { to: '/edt', icon: CalendarDays, label: 'Générer un emploi du temps', desc: 'Créer, générer et activer une version', tint: 'bg-primary-soft text-primary' },
  { to: '/contraintes', icon: Settings2, label: 'Configurer les contraintes', desc: 'Ajouter des règles de génération', tint: 'bg-gold-soft text-gold-strong' },
  { to: '/classes', icon: Users, label: 'Gérer les classes', desc: 'Classes générales et techniques', tint: 'bg-success-soft text-success-strong' },
  { to: '/enseignants', icon: GraduationCap, label: 'Gérer les enseignants', desc: 'Profils et disponibilités', tint: 'bg-info-soft text-info' },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [subjects, setSubjects] = useState<Matiere[]>([]);
  const [version, setVersion] = useState<ScheduleVersion | null>(null);

  useEffect(() => {
    Promise.all([
      classesApi.list(),
      enseignantsApi.list(),
      sallesApi.list(),
      matieresApi.list(),
      versionsApi.getActive().catch(() => null),
    ]).then(([c, t, r, s, v]) => {
      setClasses(c.data.results);
      setTeachers(t.data.results);
      setRooms(r.data.results);
      setSubjects(s.data.results);
      if (v) setVersion(v as unknown as ScheduleVersion);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats: Stat[] = [
    { icon: Users, label: 'Classes', value: classes.length, to: '/classes', tint: 'bg-primary/10', iconTint: 'bg-primary-soft text-primary' },
    { icon: GraduationCap, label: 'Enseignants', value: teachers.length, to: '/enseignants', tint: 'bg-success/10', iconTint: 'bg-success-soft text-success-strong' },
    { icon: DoorOpen, label: 'Salles', value: rooms.length, to: '/salles', tint: 'bg-gold/10', iconTint: 'bg-gold-soft text-gold-strong' },
    { icon: BookOpen, label: 'Matières', value: subjects.length, to: '/matieres', tint: 'bg-info/10', iconTint: 'bg-info-soft text-info' },
    { icon: Calendar, label: 'Version active', value: version?.nom ?? '—', to: '/edt', tint: 'bg-primary/10', iconTint: 'bg-primary-soft text-primary' },
  ];

  return (
    <div>
      <PageHeader
        kicker="Vue d'ensemble"
        title="Tableau de bord"
        subtitle="Pilotage de la génération des emplois du temps du lycée"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card space-y-3 p-5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-8 w-14" />
              </div>
            ))
          : stats.map((s, i) => <StatCard key={i} stat={s} index={i} />)}
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Version */}
        <Card className="animate-fade-up lg:col-span-3" padding="lg">
          <CardHeader
            padding="lg"
            icon={<Sparkles className="h-5 w-5" />}
            title="Version active"
            subtitle="Dernière génération de l'emploi du temps"
          />
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-40" />
            </div>
          ) : version ? (
            <div className="space-y-6">
              <ScoreBar score={version.score_qualite} />
              <div className="grid grid-cols-2 gap-4 rounded-[12px] bg-paper/70 p-4">
                <div>
                  <p className="text-xs text-muted">Nom de la version</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{version.nom}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Créée le</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {new Date(version.date_creation).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <Link
                to="/edt"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
              >
                <CalendarDays className="h-4 w-4" />
                Consulter et gérer les versions
              </Link>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-line-strong p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted" />
              <p className="text-sm font-medium text-ink">Aucune version active</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                Créez et générez un emploi du temps depuis la page dédiée pour commencer.
              </p>
              <Link
                to="/edt"
                className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-strong"
              >
                <Wand2 className="h-4 w-4" />
                Créer une version
              </Link>
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="animate-fade-up lg:col-span-2" padding="lg">
          <CardHeader
            padding="lg"
            icon={<Sparkles className="h-5 w-5" />}
            title="Actions rapides"
            subtitle="Accéder directement aux tâches courantes"
          />
          <ul className="space-y-2.5">
            {quickActions.map(a => (
              <li key={a.to}>
                <Link
                  to={a.to}
                  className="group flex items-center gap-3.5 rounded-[13px] border border-line bg-surface p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-primary-soft/40 hover:shadow-card"
                >
                  <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-[11px] [&>svg]:h-5 [&>svg]:w-5', a.tint)}>
                    <a.icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{a.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{a.desc}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-all duration-200 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Info strip */}
      <div className="mt-6 flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gold-soft text-gold-strong">
            {version ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {version ? 'Emploi du temps prêt à consulter' : 'Aucun emploi du temps généré'}
            </p>
            <p className="text-xs text-muted">
              {version
                ? 'Consultez les emplois du temps par classe, enseignant ou salle.'
                : 'Générez une version depuis la page Emplois du temps.'}
            </p>
          </div>
        </div>
        <Link
          to="/edt"
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary"
        >
          Ouvrir
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}