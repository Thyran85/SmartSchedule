import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { classesApi, niveauxApi, filieresApi } from '../services/api';
import type { Classe, Niveau, Filiere } from '../types';
import Modal from '../components/Modal';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [allClasses, setAllClasses] = useState<Classe[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Classe | null>(null);
  const [form, setForm] = useState({ nom: '', niveau: '', filiere: '', effectif: '', classe_technique: '' });

  const load = () => {
    classesApi.list().then(r => setClasses(r.data.results));
    classesApi.list().then(r => setAllClasses(r.data.results));
    niveauxApi.list().then(r => setNiveaux(r.data.results));
    filieresApi.list().then(r => setFilieres(r.data.results));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', niveau: '', filiere: '', effectif: '', classe_technique: '' });
    setModalOpen(true);
  };

  const openEdit = (c: Classe) => {
    setEditing(c);
    setForm({
      nom: c.nom,
      niveau: String(c.niveau),
      filiere: String(c.filiere),
      effectif: String(c.effectif),
      classe_technique: String(c.classe_technique || ''),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      nom: form.nom,
      niveau: Number(form.niveau),
      filiere: Number(form.filiere),
      effectif: Number(form.effectif),
      classe_technique: form.classe_technique ? Number(form.classe_technique) : null,
    };
    if (editing) {
      await classesApi.update(editing.id, data);
    } else {
      await classesApi.create(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette classe ?')) {
      await classesApi.delete(id);
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-gray-500 mt-1">Gestion des classes du lycée</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Ajouter une classe
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nom</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Niveau</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Filière</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Effectif</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Classe technique</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.nom}</td>
                <td className="px-4 py-3">{c.niveau_nom}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.filiere_nom === 'Technique' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {c.filiere_nom}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    {c.effectif}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {allClasses.find(cl => cl.id === c.classe_technique)?.nom || '-'}
                </td><td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Aucune classe enregistrée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la classe' : 'Nouvelle classe'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Seconde A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
            <select
              value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Sélectionner...</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
            <select
              value={form.filiere} onChange={e => setForm(f => ({ ...f, filiere: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Sélectionner...</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effectif</label>
            <input
              type="number" value={form.effectif} onChange={e => setForm(f => ({ ...f, effectif: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe technique associée</label>
            <select value={form.classe_technique} onChange={e => setForm(f => ({ ...f, classe_technique: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Aucune</option>
              {allClasses
                .filter(c => c.filiere_nom === 'Technique' && (!form.niveau || c.niveau === Number(form.niveau)))
                .map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {editing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
