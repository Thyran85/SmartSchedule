import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Download, AlertTriangle,
  Clock, Users, GraduationCap, DoorOpen
} from 'lucide-react';
import { versionsApi, classesApi, enseignantsApi, sallesApi } from '../services/api';
import type { ScheduleVersion, Classe, Enseignant, Salle } from '../types';
import Modal from '../components/Modal';

export default function SchedulePage() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ cours_crees: number; conflits: string[]; score: number } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [activeVersion, setActiveVersion] = useState<number | null>(null);

  const load = () => {
    versionsApi.list().then(r => {
      setVersions(r.data.results);
      const active = r.data.results.find(v => v.est_active);
      if (active) setActiveVersion(active.id);
    });
    classesApi.list().then(r => setClasses(r.data.results));
    enseignantsApi.list().then(r => setTeachers(r.data.results));
    sallesApi.list().then(r => setRooms(r.data.results));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    const res = await versionsApi.create({ nom: versionName });
    setCreateModal(false);
    setVersionName('');
    load();
  };

  const handleGenerate = async (id: number) => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await versionsApi.generate(id);
      setResult(res.data as { cours_crees: number; conflits: string[]; score: number });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleActivate = async (id: number) => {
    await versionsApi.activate(id);
    load();
  };

  const handleExport = (format: string, type: string, id: number) => {
    window.open(`/api/schedules/export/${format}/${type}/${id}/`, '_blank');
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emplois du temps</h1>
          <p className="text-gray-500 mt-1">Génération et gestion des emplois du temps</p>
        </div>
        <button onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Nouvelle version
        </button>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 ${
          result.conflits.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.conflits.length > 0
              ? <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              : <Check className="h-5 w-5 text-green-500 mt-0.5" />
            }
            <div>
              <p className="font-medium">
                Génération terminée — {result.cours_crees} cours créés
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Score qualité: <strong className={scoreColor(result.score)}>{result.score}/100</strong>
              </p>
              {result.conflits.length > 0 && (
                <div className="mt-2 text-sm text-amber-700">
                  <p className="font-medium">Conflits ({result.conflits.length}):</p>
                  <ul className="list-disc list-inside">
                    {result.conflits.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {versions.map(v => (
          <div key={v.id} className={`bg-white rounded-xl border p-5 ${
            v.est_active ? 'border-green-300 ring-1 ring-green-300' : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{v.nom}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(v.date_creation).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              {v.est_active && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-lg font-bold ${scoreColor(v.score_qualite)}`}>
                {v.score_qualite !== null ? `${v.score_qualite}/100` : 'N/A'}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!v.est_active && (
                <button onClick={() => handleActivate(v.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                  <Check className="h-3.5 w-3.5" />
                  Activer
                </button>
              )}
              <button onClick={() => handleGenerate(v.id)} disabled={generating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50">
                <Play className="h-3.5 w-3.5" />
                {generating ? 'Génération...' : 'Générer'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick view by entity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-lg mb-4">Consulter un emploi du temps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-1" /> Par classe
            </label>
            <select onChange={e => e.target.value && navigate(`/edt/classe/${e.target.value}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner une classe...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="h-4 w-4 inline mr-1" /> Par enseignant
            </label>
            <select onChange={e => e.target.value && navigate(`/edt/enseignant/${e.target.value}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner un enseignant...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DoorOpen className="h-4 w-4 inline mr-1" /> Par salle
            </label>
            <select onChange={e => e.target.value && navigate(`/edt/salle/${e.target.value}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner une salle...</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Export section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-lg mb-4">
          <Download className="h-5 w-5 inline mr-1" />
          Export
        </h2>
        <p className="text-sm text-gray-500 mb-3">Consultez d'abord un emploi du temps pour l'exporter.</p>
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Nouvelle version">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la version</label>
            <input type="text" value={versionName}
              onChange={e => setVersionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Version S1 2026" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Créer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
