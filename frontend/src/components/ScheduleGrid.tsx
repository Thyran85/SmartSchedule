import clsx from 'clsx';
import { Lock, Unlock } from 'lucide-react';
import type { Cours } from '../types';
import { DAYS, TIME_SLOTS } from '../types';

interface ScheduleGridProps {
  courses: Cours[];
  onToggleLock?: (id: number) => void;
  onCourseClick?: (course: Cours) => void;
  viewType: 'classe' | 'enseignant' | 'salle';
  entityName?: string;
}

const subjectColors: Record<string, string> = {
  MATH: 'bg-blue-100 border-blue-300 text-blue-800',
  FR: 'bg-red-100 border-red-300 text-red-800',
  ANG: 'bg-green-100 border-green-300 text-green-800',
  HG: 'bg-amber-100 border-amber-300 text-amber-800',
  PC: 'bg-purple-100 border-purple-300 text-purple-800',
  SVT: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  EPS: 'bg-orange-100 border-orange-300 text-orange-800',
  INFO: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  ELEC: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  ATEL: 'bg-rose-100 border-rose-300 text-rose-800',
  TPINFO: 'bg-indigo-100 border-indigo-300 text-indigo-800',
};

const defaultColor = 'bg-gray-100 border-gray-300 text-gray-800';

function getSubjectColor(course: Cours): string {
  const code = course.matiere_nom.substring(0, 4).toUpperCase();
  const key = Object.keys(subjectColors).find(k => code.startsWith(k));
  return key ? subjectColors[key] : defaultColor;
}

export default function ScheduleGrid({
  courses, onToggleLock, onCourseClick, viewType, entityName,
}: ScheduleGridProps) {
  const getCourseForSlot = (day: number, start: string): Cours | undefined => {
    return courses.find(c => c.jour_semaine === day && c.heure_debut.slice(0, 5) === start);
  };

  const renderCourseContent = (course: Cours) => {
    switch (viewType) {
      case 'classe':
        return (
          <>
            <div className="font-semibold text-xs leading-tight">{course.matiere_nom}</div>
            <div className="text-[10px] mt-0.5 opacity-75">{course.enseignant_nom || '-'}</div>
            {course.salle_nom && (
              <div className="text-[10px] opacity-60">{course.salle_nom}</div>
            )}
          </>
        );
      case 'enseignant':
        return (
          <>
            <div className="font-semibold text-xs leading-tight">{course.matiere_nom}</div>
            <div className="text-[10px] mt-0.5 opacity-75">{course.classe_nom}</div>
            {course.salle_nom && (
              <div className="text-[10px] opacity-60">{course.salle_nom}</div>
            )}
          </>
        );
      case 'salle':
        return (
          <>
            <div className="font-semibold text-xs leading-tight">{course.matiere_nom}</div>
            <div className="text-[10px] mt-0.5 opacity-75">{course.classe_nom}</div>
            <div className="text-[10px] opacity-60">{course.enseignant_nom || '-'}</div>
          </>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {entityName && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold">{entityName}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr>
              <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-r border-b border-gray-200">
                Créneau
              </th>
              {DAYS.map(day => (
                <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 border-r border-b border-gray-200 last:border-r-0">
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
                  <td className="px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-b border-gray-200 whitespace-nowrap">
                    {slot.start} - {slot.end}
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const course = getCourseForSlot(dayIdx, slot.start);
                    const isBreak = false;
                    return (
                      <td
                        key={dayIdx}
                        className={clsx(
                          'px-1 py-1 border-r border-b border-gray-100 align-top',
                          isLastSlot && 'border-b-0',
                          dayIdx === DAYS.length - 1 && 'border-r-0',
                        )}
                        style={{ height: course ? 'auto' : '48px' }}
                      >
                        {course ? (
                          <div
                            className={clsx(
                              'p-1.5 rounded-lg border cursor-pointer transition-shadow hover:shadow-sm relative group',
                              getSubjectColor(course),
                              course.est_verrouille && 'ring-2 ring-yellow-400',
                            )}
                            onClick={() => onCourseClick?.(course)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                {renderCourseContent(course)}
                              </div>
                              <div className="flex flex-col gap-0.5 shrink-0">
                                {course.est_verrouille && (
                                  <Lock className="h-3 w-3 text-yellow-600" />
                                )}
                              </div>
                            </div>
                            {onToggleLock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLock(course.id);
                                }}
                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-white rounded-full shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={course.est_verrouille ? 'Déverrouiller' : 'Verrouiller'}
                              >
                                {course.est_verrouille
                                  ? <Unlock className="h-3 w-3 text-gray-500" />
                                  : <Lock className="h-3 w-3 text-gray-400" />
                                }
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[48px]" />
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
