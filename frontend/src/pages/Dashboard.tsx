import { useEffect, useState } from 'react';
import { Users, GraduationCap, DoorOpen, BookOpen, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { classesApi, enseignantsApi, sallesApi, matieresApi, versionsApi, coursApi } from '../services/api';
import type { Classe, Enseignant, Salle, Matiere, ScheduleVersion, Cours } from '../types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  to: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, to, color }: StatCardProps) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [subjects, setSubjects] = useState<Matiere[]>([]);
  const [version, setVersion] = useState<ScheduleVersion | null>(null);
  const [recentConflicts, setRecentConflicts] = useState<Cours[]>([]);

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
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Gestion des emplois du temps du lycée</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Classes" value={classes.length} to="/classes" color="bg-blue-600" />
        <StatCard icon={GraduationCap} label="Enseignants" value={teachers.length} to="/enseignants" color="bg-emerald-600" />
        <StatCard icon={DoorOpen} label="Salles" value={rooms.length} to="/salles" color="bg-amber-600" />
        <StatCard icon={BookOpen} label="Matières" value={subjects.length} to="/matieres" color="bg-purple-600" />
        <StatCard icon={Calendar} label="Version active" value={version?.nom || 'Aucune'} to="/edt" color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-lg mb-4">Version active</h2>
          {version ? (
            <div className="space-y-2">
              <p><span className="text-gray-500">Nom:</span> {version.nom}</p>
              <p><span className="text-gray-500">Score qualité:</span>
                <span className={`ml-2 font-medium ${
                  (version.score_qualite ?? 0) >= 80 ? 'text-green-600' :
                  (version.score_qualite ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {version.score_qualite ?? 'N/A'}/100
                </span>
              </p>
              <p><span className="text-gray-500">Créée le:</span> {new Date(version.date_creation).toLocaleDateString('fr-FR')}</p>
            </div>
          ) : (
            <p className="text-gray-400">Aucune version active. Créez et générez un emploi du temps.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-lg">Actions rapides</h2>
          </div>
          <div className="space-y-2">
            <Link to="/edt" className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              Gérer les emplois du temps
            </Link>
            <Link to="/classes" className="block px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              Gérer les classes
            </Link>
            <Link to="/enseignants" className="block px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              Gérer les enseignants
            </Link>
            <Link to="/contraintes" className="block px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              Configurer les contraintes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
