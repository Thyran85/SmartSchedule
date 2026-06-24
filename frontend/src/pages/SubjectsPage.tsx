import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { matieresApi, classesApi, enseignantsApi, classeMatieresApi } from '../services/api';
import type { Matiere, Classe, Enseignant, ClasseMatiere } from '../types';
import { SUBJECT_TYPES } from '../types';
import Modal from '../components/Modal';

export default function SubjectsPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [assignments, setAssignments] = useState<ClasseMatiere[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editing, setEditing] = useState<Matiere | null>(null);
  const [form, setForm] = useState({
    nom: '', code: '', heures_par_semaine: '', coefficient: '1',
    type: 'GENERAL', necessite_salle_informatique: false,
    necessite_laboratoire: false, necessite_atelier: false,
  });
  const [assignForm, setAssignForm] = useState({ classe: '', matiere: '', enseignant: '', heures_par_semaine: '' });

  const load = () => {
    matieresApi.list().then(r => setMatieres(r.data.results));
    classeMatieresApi.list().then(r => setAssignments(r.data.results));
    classesApi.list().then(r => setClasses(r.data.results));
    enseignantsApi.list().then(r => setTeachers(r.data.results));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', code: '', heures_par_semaine: '', coefficient: '1', type: 'GENERAL', necessite_salle_informatique: false, necessite_laboratoire: false, necessite_atelier: false });
    setModalOpen(true);
  };

  const openEdit = (m: Matiere) => {
    setEditing(m);
    setForm({
      nom: m.nom, code: m.code, heures_par_semaine: String(m.heures_par_semaine),
      coefficient: String(m.coefficient), type: m.type,
      necessite_salle_informatique: m.necessite_salle_informatique,
      necessite_laboratoire: m.necessite_laboratoire,
      necessite_atelier: m.necessite_atelier,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      nom: form.nom, code: form.code,
      heures_par_semaine: Number(form.heures_par_semaine),
      coefficient: Number(form.coefficient), type: form.type as Matiere['type'],
      necessite_salle_informatique: form.necessite_salle_informatique,
      necessite_laboratoire: form.necessite_laboratoire,
      necessite_atelier: form.necessite_atelier,
    };
    if (editing) await matieresApi.update(editing.id, data);
    else await matieresApi.create(data);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette matière ?')) {
      await matieresApi.delete(id);
      load();
    }
  };

  const openAssign = () => {
    setAssignForm({ classe: '', matiere: '', enseignant: '', heures_par_semaine: '' });
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    await classeMatieresApi.create({
      classe: Number(assignForm.classe),
      matiere: Number(assignForm.matiere),
      enseignant: Number(assignForm.enseignant),
      heures_par_semaine: Number(assignForm.heures_par_semaine),
    });
    setAssignModalOpen(false);
    load();
  };

  const removeAssign = async (id: number) => {
    if (confirm('Retirer cette affectation ?')) {
      await classeMatieresApi.delete(id);
      load();
    }
  };

  const typeColors: Record<string, string> = {
    GENERAL: 'bg-green-100 text-green-700',
    TECHNIQUE: 'bg-blue-100 text-blue-700',
    LABORATOIRE: 'bg-purple-100 text-purple-700',
    ATELIER: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matières</h1>
          <p className="text-gray-500 mt-1">Gestion des matières et des affectations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAssign} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Affecter une matière
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nouvelle matière
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-4 py-3 font-semibold border-b border-gray-200 bg-gray-50">Matières</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nom</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">h/sem</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Coeff</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matieres.map(m => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{m.nom}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.code}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${typeColors[m.type] || typeColors.GENERAL}`}>
                    {SUBJECT_TYPES[m.type]}
                  </span>
                </td>
                <td className="px-4 py-3">{m.heures_par_semaine}h</td>
                <td className="px-4 py-3">{m.coefficient}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg ml-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-4 py-3 font-semibold border-b border-gray-200 bg-gray-50">Affectations classe-matière-enseignant</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Classe</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Matière</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Enseignant</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">h/sem</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.classe_nom}</td>
                <td className="px-4 py-3">{a.matiere_nom}</td>
                <td className="px-4 py-3">{a.enseignant_nom || 'Non assigné'}</td>
                <td className="px-4 py-3">{a.heures_par_semaine}h</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeAssign(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la matière' : 'Nouvelle matière'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures/semaine</label>
              <input type="number" step="0.5" value={form.heures_par_semaine} onChange={e => setForm(f => ({ ...f, heures_par_semaine: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
              <input type="number" step="0.5" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {Object.entries(SUBJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.necessite_salle_informatique}
                onChange={e => setForm(f => ({ ...f, necessite_salle_informatique: e.target.checked }))} />
              <span className="text-sm">Nécessite salle informatique</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.necessite_laboratoire}
                onChange={e => setForm(f => ({ ...f, necessite_laboratoire: e.target.checked }))} />
              <span className="text-sm">Nécessite laboratoire</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.necessite_atelier}
                onChange={e => setForm(f => ({ ...f, necessite_atelier: e.target.checked }))} />
              <span className="text-sm">Nécessite atelier</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Affecter une matière à une classe">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
            <select value={assignForm.classe} onChange={e => setAssignForm(f => ({ ...f, classe: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <select value={assignForm.matiere} onChange={e => setAssignForm(f => ({ ...f, matiere: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner...</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
            <select value={assignForm.enseignant} onChange={e => setAssignForm(f => ({ ...f, enseignant: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heures/semaine</label>
            <input type="number" step="0.5" value={assignForm.heures_par_semaine}
              onChange={e => setAssignForm(f => ({ ...f, heures_par_semaine: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleAssign} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Affecter</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
