import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Monitor, Beaker, Wrench, DoorOpen } from 'lucide-react';
import { sallesApi } from '../services/api';
import type { Salle } from '../types';
import { ROOM_TYPES } from '../types';
import Modal from '../components/Modal';

const typeIcons: Record<string, React.ElementType> = {
  NORMALE: DoorOpen,
  LABORATOIRE: Beaker,
  ATELIER: Wrench,
  INFORMATIQUE: Monitor,
};

const typeColors: Record<string, string> = {
  NORMALE: 'bg-gray-100 text-gray-700',
  LABORATOIRE: 'bg-purple-100 text-purple-700',
  ATELIER: 'bg-amber-100 text-amber-700',
  INFORMATIQUE: 'bg-blue-100 text-blue-700',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Salle | null>(null);
  const [form, setForm] = useState({ nom: '', capacite: '', type: 'NORMALE', est_salle_unique: false });

  const load = () => { sallesApi.list().then(r => setRooms(r.data.results)); };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', capacite: '', type: 'NORMALE', est_salle_unique: false });
    setModalOpen(true);
  };

  const openEdit = (r: Salle) => {
    setEditing(r);
    setForm({ nom: r.nom, capacite: String(r.capacite), type: r.type, est_salle_unique: r.est_salle_unique });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const data = { nom: form.nom, capacite: Number(form.capacite), type: form.type as Salle['type'], est_salle_unique: form.est_salle_unique };
    if (editing) await sallesApi.update(editing.id, data);
    else await sallesApi.create(data);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette salle ?')) await sallesApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Salles</h1>
          <p className="text-gray-500 mt-1">Gestion des salles et de leurs disponibilités</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Ajouter une salle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => {
          const Icon = typeIcons[r.type] || DoorOpen;
          const colorClass = typeColors[r.type] || typeColors.NORMALE;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.nom}</h3>
                    <p className="text-sm text-gray-500">{r.capacite} places</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                  {ROOM_TYPES[r.type] || r.type}
                </span>
                {r.est_salle_unique && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Salle unique</span>
                )}
              </div>
            </div>
          );
        })}
        {rooms.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-400">Aucune salle enregistrée</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la salle' : 'Nouvelle salle'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
            <input type="number" value={form.capacite} onChange={e => setForm(f => ({ ...f, capacite: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {form.type === 'INFORMATIQUE' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.est_salle_unique}
                onChange={e => setForm(f => ({ ...f, est_salle_unique: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">Salle unique (un seul cours à la fois)</span>
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
