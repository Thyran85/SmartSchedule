import clsx from 'clsx';
import { Lock, Unlock, MapPin, User } from 'lucide-react';
import type { Cours } from '../types';
import { DAYS, TIME_SLOTS } from '../types';

type ViewType = 'classe' | 'enseignant' | 'salle';

interface ScheduleGridProps {
  courses: Cours[];
  onToggleLock?: (id: number) => void;
  onCourseClick?: (course: Cours) => void;
  viewType: ViewType;
  entityName?: string;
}

const subjectStyles: { block: string; bar: string }[] = [
  { block: 'border-indigo-200/70 bg-indigo-50/80 text-indigo-900', bar: 'bg-indigo-500' },
  { block: 'border-rose-200/70 bg-rose-50/80 text-rose-900', bar: 'bg-rose-500' },
  { block: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-900', bar: 'bg-emerald-500' },
  { block: 'border-amber-200/70 bg-amber-50/80 text-amber-900', bar: 'bg-amber-500' },
  { block: 'border-violet-200/70 bg-violet-50/80 text-violet-900', bar: 'bg-violet-500' },
  { block: 'border-cyan-200/70 bg-cyan-50/80 text-cyan-900', bar: 'bg-cyan-500' },
  { block: 'border-orange-200/70 bg-orange-50/80 text-orange-900', bar: 'bg-orange-500' },
  { block: 'border-teal-200/70 bg-teal-50/80 text-teal-900', bar: 'bg-teal-500' },
  { block: 'border-fuchsia-200/70 bg-fuchsia-50/80 text-fuchsia-900', bar: 'bg-fuchsia-500' },
  { block: 'border-sky-200/70 bg-sky-50/80 text-sky-900', bar: 'bg-sky-500' },
  { block: 'border-lime-200/70 bg-lime-50/80 text-lime-900', bar: 'bg-lime-500' },
];

function styleFor(course: Cours): { block: string; bar: string } {
  const code = course.matiere_nom.substring(0, 4).toUpperCase();
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return subjectStyles[hash % subjectStyles.length];
}

function CourseBody({ course, viewType }: { course: Cours; viewType: ViewType }) {
  if (viewType === 'salle') {
    return (
      <>
        <div className="font-display text-[13px] font-semibold leading-tight">{course.matiere_nom}</div>
        <div className="mt-0.5 text-[11px] opacity-75">{course.classe_nom}</div>
        {course.enseignant_nom && (
          <div className="flex items-center gap-1 text-[11px] opacity-60">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{course.enseignant_nom}</span>
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <div className="font-display text-[13px] font-semibold leading-tight">{course.matiere_nom}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] opacity-75">
        <User className="h-3 w-3 shrink-0" />
        <span className="truncate">{viewType === 'classe' ? course.enseignant_nom : course.classe_nom}</span>
      </div>
      {course.salle_nom && (
        <div className="flex items-center gap-1 text-[11px] opacity-60">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{course.salle_nom}</span>
        </div>
      )}
    </>
  );
}

function CourseCell({
  course,
  viewType,
  onClick,
  onToggleLock,
}: {
  course: Cours;
  viewType: ViewType;
  onClick?: () => void;
  onToggleLock?: (id: number) => void;
}) {
  const style = styleFor(course);
  return (
    <div
      className={clsx(
        'group relative m-0.5 flex h-[52px] cursor-pointer overflow-hidden rounded-[10px] border text-left',
        'shadow-[0_1px_2px_rgba(33,29,62,0.06)] transition-all duration-200',
        'hover:-translate-y-px hover:shadow-card',
        style.block,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <span className={clsx('h-full w-1 shrink-0', style.bar)} aria-hidden />
      <div className="min-w-0 flex-1 px-2 py-1.5">
        <CourseBody course={course} viewType={viewType} />
      </div>
      {course.est_verrouille && (
        <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white/80 text-yellow-600 shadow-sm">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
      {onToggleLock && (
        <button
          onClick={e => { e.stopPropagation(); onToggleLock(course.id); }}
          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-muted shadow-card transition-all duration-150 hover:text-ink md:opacity-0 md:group-hover:opacity-100"
          title={course.est_verrouille ? 'Déverrouiller' : 'Verrouiller'}
          aria-label={course.est_verrouille ? 'Déverrouiller' : 'Verrouiller'}
        >
          {course.est_verrouille ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}

export default function ScheduleGrid({
  courses, onToggleLock, onCourseClick, viewType, entityName,
}: ScheduleGridProps) {
  const getCourseForSlot = (day: number, start: string): Cours | undefined => {
    return courses.find(c => c.jour_semaine === day && c.heure_debut.slice(0, 5) === start);
  };

  return (
    <div className="card animate-fade-up overflow-hidden">
      {entityName && (
        <div className="flex items-center justify-between border-b border-line bg-paper/60 px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Emploi du temps
            </p>
            <h2 className="font-display text-lg font-semibold text-ink">{entityName}</h2>
          </div>
          <span className="chip bg-primary-soft text-primary">{courses.length} cours</span>
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="w-24 border-b border-r border-line bg-paper/60 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                Créneau
              </th>
              {DAYS.map(day => (
                <th
                  key={day}
                  className="border-b border-r border-line bg-paper/60 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted last:border-r-0"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot, slotIdx) => {
              const isLastSlot = slotIdx === TIME_SLOTS.length - 1;
              return (
                <tr key={slot.start}>
                  <td
                    className={clsx(
                      'whitespace-nowrap border-b border-r border-line bg-paper/40 px-3 py-1 text-[11px] font-medium text-muted',
                      isLastSlot && 'border-b-0',
                    )}
                  >
                    <span className="font-mono">{slot.start}</span>
                    <span className="mx-0.5 text-muted/50">–</span>
                    <span className="font-mono">{slot.end}</span>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const course = getCourseForSlot(dayIdx, slot.start);
                    return (
                      <td
                        key={dayIdx}
                        className={clsx(
                          'border-b border-r border-line px-1 py-1 align-top last:border-r-0',
                          isLastSlot && 'border-b-0',
                          !course && 'bg-surface',
                        )}
                        style={{ height: course ? undefined : '52px' }}
                      >
                        {course ? (
                          <CourseCell
                            course={course}
                            viewType={viewType}
                            onClick={() => onCourseClick?.(course)}
                            onToggleLock={onToggleLock}
                          />
                        ) : (
                          <div className="h-full min-h-[52px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}