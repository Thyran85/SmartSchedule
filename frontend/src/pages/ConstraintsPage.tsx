import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { contraintesApi, niveauxApi, classesApi, matieresApi, sallesApi } from '../services/api';
import type { ContrainteSpecifique, Niveau, Classe, Matiere, Salle } from '../types';
import { CONSTRAINT_TYPES, DAYS } from '../types';
import Modal from '../components/Modal';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<ContrainteSpecifique[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [editing, setEditing] = useState<ContrainteSpecifique | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type_contrainte: 'INDISP_NIVEAU', classe: '', niveau: '',
    matiere: '', salle: '', jour_semaine: '', valeur: '',
    description: '',
  });

  const isTimeType = (t: string) => ['FIN_AVANCEE', 'INDISP_NIVEAU', 'INDISP_SALLE'].includes(t);
  const isNumericType = (t: string) => ['HEURES_MIN_JOUR', 'MAX_HEURES_CONSEC'].includes(t);
  const isPeriodType = (t: string) => t === 'MAT_PERIODE';

  const load = () => {
    contraintesApi.list().then(r => setConstraints(r.data.results));
    niveauxApi.list().then(r => setNiveaux(r.data.results));
    classesApi.list().then(r => setClasses(r.data.results));
    matieresApi.list().then(r => setMatieres(r.data.results));
    sallesApi.list().then(r => setSalles(r.data.results));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ type_contrainte: 'INDISP_NIVEAU', classe: '', niveau: '', matiere: '', salle: '', jour_semaine: '', valeur: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c: ContrainteSpecifique) => {
    setEditing(c);
    setForm({
      type_contrainte: c.type_contrainte,
      classe: String(c.classe || ''),
      niveau: String(c.niveau || ''),
      matiere: String(c.matiere || ''),
      salle: String(c.salle || ''),
      jour_semaine: String(c.jour_semaine ?? ''),
      valeur: isTimeType(c.type_contrainte)
        ? (c.heure_limite || '')
        : String(c.valeur ?? ''),
      description: c.description,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const isTime = isTimeType(form.type_contrainte);
    const data: Record<string, unknown> = {
      type_contrainte: form.type_contrainte,
      classe: form.classe ? Number(form.classe) : null,
      niveau: form.niveau ? Number(form.niveau) : null,
      matiere: form.matiere ? Number(form.matiere) : null,
      salle: form.salle ? Number(form.salle) : null,
      jour_semaine: form.jour_semaine ? Number(form.jour_semaine) : null,
      description: form.description,
    };
    if (isTime) {
      data.heure_limite = form.valeur || null;
      data.valeur = null;
    } else {
      data.valeur = form.valeur ? Number(form.valeur) : null;
      data.heure_limite = null;
    }
    if (editing) {
      await contraintesApi.update(editing.id, data);
    } else {
      await contraintesApi.create(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette contrainte ?')) {
      await contraintesApi.delete(id);
      load();
    }
  };

  const showTarget = !['MAX_HEURES_CONSEC', 'MAT_PERIODE', 'HEURES_MIN_JOUR'].includes(form.type_contrainte) || form.type_contrainte === 'INDISP_SALLE';

  const showMatiere = ['MAT_PERIODE', 'MAX_HEURES_CONSEC'].includes(form.type_contrainte);

  const showDay = ['INDISP_NIVEAU', 'INDISP_SALLE', 'FIN_AVANCEE'].includes(form.type_contrainte);

  const showValue = isTimeType(form.type_contrainte) || isNumericType(form.type_contrainte) || isPeriodType(form.type_contrainte);

  const descPlaceholder = {
    INDISP_NIVEAU: 'Ex: Les Secondes ne travaillent pas le mercredi après-midi',
    INDISP_SALLE: 'Ex: Laboratoire Physique indisponible le jeudi après-midi',
    FIN_AVANCEE: 'Ex: Les cours finissent à 17h le vendredi',
    HEURES_MIN_JOUR: 'Ex: Minimum 4h de cours par jour',
    MAX_HEURES_CONSEC: 'Ex: Max 2h consécutives de la même matière',
    MAT_PERIODE: 'Ex: Cette matière est uniquement le matin',
  }[form.type_contrainte] || 'Description de la contrainte';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contraintes</h1>
          <p className="text-gray-500 mt-1">Règles personnalisées pour la génération des emplois du temps</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Valeur</th>
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
                  {c.type_contrainte === 'INDISP_SALLE'
                    ? salles.find(s => s.id === c.salle)?.nom || `Salle #${c.salle}`
                    : c.classe
                    ? classes.find(cl => cl.id === c.classe)?.nom || `Classe #${c.classe}`
                    : c.niveau
                    ? niveaux.find(n => n.id === c.niveau)?.nom || `Niveau #${c.niveau}`
                    : 'Tous'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.jour_semaine !== null ? DAYS[c.jour_semaine] : '-'}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {c.type_contrainte === 'MAT_PERIODE'
                    ? c.valeur === 0 ? 'Matin' : c.valeur === 1 ? 'Après-midi' : '-'
                    : c.valeur !== null ? `${c.valeur}h` : c.heure_limite || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg ml-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {constraints.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Aucune contrainte définie</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la contrainte' : 'Nouvelle contrainte'}>
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

          {showTarget && (
            <div className="grid grid-cols-2 gap-4">
              {form.type_contrainte === 'INDISP_SALLE' ? (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                  <select value={form.salle} onChange={e => setForm(f => ({ ...f, salle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Sélectionner...</option>
                    {salles.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.type})</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value, classe: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Tous</option>
                      {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                      <select value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Toutes</option>
                        {classes
                          .filter(c => !form.niveau || c.niveau === Number(form.niveau))
                          .map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                  </div>
                </>
              )}
            </div>
          )}

          {showMatiere && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matière concernée</label>
              <select value={form.matiere} onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Sélectionner...</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
          )}

          {showDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
              <select value={form.jour_semaine} onChange={e => setForm(f => ({ ...f, jour_semaine: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Tous</option>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {showValue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isTimeType(form.type_contrainte)
                  ? 'Nouvelle heure de fin'
                  : isPeriodType(form.type_contrainte)
                  ? 'Période'
                  : { HEURES_MIN_JOUR: 'Heures minimum par jour', MAX_HEURES_CONSEC: 'Max heures consécutives' }[form.type_contrainte] || 'Valeur'}
              </label>
              {isTimeType(form.type_contrainte) ? (
                <input type="time" value={form.valeur}
                  onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : isPeriodType(form.type_contrainte) ? (
                <select value={form.valeur} onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Sélectionner...</option>
                  <option value="0">Matin seulement</option>
                  <option value="1">Après-midi seulement</option>
                </select>
              ) : (
                <div className="relative">
                  <input type="number" min="0" step="0.5" value={form.valeur}
                    onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={form.type_contrainte === 'HEURES_MIN_JOUR' ? 'Ex: 4' : 'Ex: 2'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">h</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={descPlaceholder} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Modifier' : 'Créer'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
