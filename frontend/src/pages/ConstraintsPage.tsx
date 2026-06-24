import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { contraintesApi, niveauxApi, classesApi, matieresApi } from '../services/api';
import type { ContrainteSpecifique, Niveau, Classe, Matiere } from '../types';
import { CONSTRAINT_TYPES, DAYS } from '../types';
import Modal from '../components/Modal';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<ContrainteSpecifique[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type_contrainte: 'INDISP_CLASSE', classe: '', niveau: '',
    matiere: '', jour_semaine: '', heure_limite: '', description: '',
  });

  const load = () => {
    contraintesApi.list().then(r => setConstraints(r.data.results));
    niveauxApi.list().then(r => setNiveaux(r.data.results));
    classesApi.list().then(r => setClasses(r.data.results));
    matieresApi.list().then(r => setMatieres(r.data.results));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    await contraintesApi.create({
      type_contrainte: form.type_contrainte,
      classe: form.classe ? Number(form.classe) : null,
      niveau: form.niveau ? Number(form.niveau) : null,
      matiere: form.matiere ? Number(form.matiere) : null,
      jour_semaine: form.jour_semaine ? Number(form.jour_semaine) : null,
      heure_limite: form.heure_limite || null,
      description: form.description,
    });
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette contrainte ?')) {
      await contraintesApi.delete(id);
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contraintes</h1>
          <p className="text-gray-500 mt-1">Règles personnalisées pour la génération des emplois du temps</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Ajouter une contrainte
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Cible</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Jour</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Description</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {constraints.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    {CONSTRAINT_TYPES[c.type_contrainte] || c.type_contrainte}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.classe
                    ? classes.find(cl => cl.id === c.classe)?.nom || `Classe #${c.classe}`
                    : c.niveau
                    ? niveaux.find(n => n.id === c.niveau)?.nom || `Niveau #${c.niveau}`
                    : 'Tous'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.jour_semaine !== null ? DAYS[c.jour_semaine] : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {constraints.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">Aucune contrainte définie</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle contrainte">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrainte</label>
            <select value={form.type_contrainte}
              onChange={e => setForm(f => ({ ...f, type_contrainte: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {Object.entries(CONSTRAINT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau (optionnel)</label>
              <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Tous</option>
                {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe (optionnel)</label>
              <select value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Toutes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
              <select value={form.jour_semaine} onChange={e => setForm(f => ({ ...f, jour_semaine: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Tous</option>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure limite</label>
              <input type="time" value={form.heure_limite}
                onChange={e => setForm(f => ({ ...f, heure_limite: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Les Secondes ne travaillent pas mercredi après-midi" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Créer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
