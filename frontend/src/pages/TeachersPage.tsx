import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock, Ban } from 'lucide-react';
import { enseignantsApi, matieresApi } from '../services/api';
import type { Enseignant, Matiere } from '../types';
import Modal from '../components/Modal';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Enseignant | null>(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', matiere: '',
    volume_horaire_max: '20', temps_partiel: false,
    prefere_eviter_apres_16h: false,
  });

  const load = () => {
    enseignantsApi.list().then(r => setTeachers(r.data.results));
    matieresApi.list().then(r => setMatieres(r.data.results));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', prenom: '', email: '', matiere: '', volume_horaire_max: '20', temps_partiel: false, prefere_eviter_apres_16h: false });
    setModalOpen(true);
  };

  const openEdit = (t: Enseignant) => {
    setEditing(t);
    setForm({
      nom: t.nom, prenom: t.prenom, email: t.email,
      matiere: String(t.matiere || ''),
      volume_horaire_max: String(t.volume_horaire_max),
      temps_partiel: t.temps_partiel,
      prefere_eviter_apres_16h: t.prefere_eviter_apres_16h,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      nom: form.nom, prenom: form.prenom, email: form.email,
      matiere: form.matiere ? Number(form.matiere) : null,
      volume_horaire_max: Number(form.volume_horaire_max),
      temps_partiel: form.temps_partiel,
      prefere_eviter_apres_16h: form.prefere_eviter_apres_16h,
    };
    if (editing) {
      await enseignantsApi.update(editing.id, data);
    } else {
      await enseignantsApi.create(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet enseignant ?')) {
      await enseignantsApi.delete(id);
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Enseignants</h1>
          <p className="text-gray-500 mt-1">Gestion des enseignants et de leurs disponibilités</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Ajouter un enseignant
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teachers.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t.prenom} {t.nom}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.matiere_nom || 'Sans matière'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t.volume_horaire_max}h/sem
              </div>
              {t.temps_partiel && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Ban className="h-4 w-4" /> Temps partiel
                </span>
              )}
              {t.prefere_eviter_apres_16h && (
                <span className="text-orange-600">Évite après 16h</span>
              )}
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400">Aucun enseignant enregistré</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <select value={form.matiere} onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner...</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volume horaire max/semaine</label>
            <input type="number" value={form.volume_horaire_max} onChange={e => setForm(f => ({ ...f, volume_horaire_max: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.temps_partiel}
                onChange={e => setForm(f => ({ ...f, temps_partiel: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">Temps partiel</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.prefere_eviter_apres_16h}
                onChange={e => setForm(f => ({ ...f, prefere_eviter_apres_16h: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">Préfère éviter les cours après 16h</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
