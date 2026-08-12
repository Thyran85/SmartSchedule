import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, School, Link2 } from 'lucide-react';
import { classesApi, niveauxApi, filieresApi } from '../services/api';
import type { Classe, Niveau, Filiere } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Table, { TableHead, Th, Td, Tr, ThActions, TdActions } from '../components/ui/Table';
import { Field, Input, Select } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [allClasses, setAllClasses] = useState<Classe[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', niveau: '', filiere: '', effectif: '', classe_technique: '' });
  const confirm = useConfirm();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      classesApi.list(),
      niveauxApi.list(),
      filieresApi.list(),
    ]).then(([c, n, f]) => {
      setClasses(c.data.results);
      setAllClasses(c.data.results);
      setNiveaux(n.data.results);
      setFilieres(f.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
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
      toast.success('Classe modifiée', `${data.nom} a été mis à jour.`);
    } else {
      await classesApi.create(data);
      toast.success('Classe créée', `${data.nom} a été ajoutée.`);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (c: Classe) => {
    const ok = await confirm({
      title: 'Supprimer la classe',
      message: `Voulez-vous vraiment supprimer la classe « ${c.nom} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await classesApi.delete(c.id);
    toast.success('Classe supprimée', `${c.nom} a été retirée.`);
    load();
  };

  return (
    <div>
      <PageHeader
        kicker="Gestion"
        title="Classes"
        subtitle="Les classes générales et techniques du lycée"
        actions={
          <Button onClick={openCreate} icon={<Plus />}>
            Ajouter une classe
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<School className="h-7 w-7" />}
            title="Aucune classe"
            description="Ajoutez votre première classe pour commencer à bâtir les emplois du temps."
            action={
              <Button onClick={openCreate} icon={<Plus />}>Ajouter une classe</Button>
            }
          />
        </Card>
      ) : (
        <div className="animate-fade-up">
          <Table>
            <TableHead>
              <Th>Nom</Th>
              <Th>Niveau</Th>
              <Th>Filière</Th>
              <Th>Effectif</Th>
              <Th>Classe technique</Th>
              <ThActions>Actions</ThActions>
            </TableHead>
            {classes.map(c => (
              <Tr key={c.id} className="group">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft font-display text-sm font-semibold text-primary">
                      {c.nom.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold text-ink">{c.nom}</span>
                  </div>
                </Td>
                <Td>{c.niveau_nom}</Td>
                <Td>
                  <Badge tone={c.filiere_nom === 'Technique' ? 'primary' : 'success'} dot>
                    {c.filiere_nom}
                  </Badge>
                </Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted" />
                    {c.effectif}
                  </span>
                </Td>
                <Td>
                  {c.classe_technique ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Link2 className="h-4 w-4 text-muted" />
                      {allClasses.find(cl => cl.id === c.classe_technique)?.nom || '—'}
                    </span>
                  ) : '—'}
                </Td>
                <TdActions>
                  <div className="flex items-center justify-end gap-1">
                    <IconButton label="Modifier" tone="primary" onClick={() => openEdit(c)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(c)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                </TdActions>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la classe' : 'Nouvelle classe'}
        subtitle={editing ? 'Mettez à jour les informations' : 'Ajoutez une classe au lycée'}
        icon={<School className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer la classe'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" htmlFor="classe-nom" required>
            <Input
              id="classe-nom"
              type="text"
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex : Seconde A"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Niveau" htmlFor="classe-niveau" required>
              <Select
                id="classe-niveau"
                value={form.niveau}
                onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
              >
                <option value="">Sélectionner…</option>
                {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </Select>
            </Field>
            <Field label="Filière" htmlFor="classe-filiere" required>
              <Select
                id="classe-filiere"
                value={form.filiere}
                onChange={e => setForm(f => ({ ...f, filiere: e.target.value }))}
              >
                <option value="">Sélectionner…</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Effectif" htmlFor="classe-effectif" required hint="Nombre d'élèves dans la classe">
            <Input
              id="classe-effectif"
              type="number"
              min="1"
              value={form.effectif}
              onChange={e => setForm(f => ({ ...f, effectif: e.target.value }))}
              placeholder="Ex : 35"
            />
          </Field>
          <Field
            label="Classe technique associée"
            hint="Les matières marquées « commun » seront programmées ensemble"
          >
            <Select
              value={form.classe_technique}
              onChange={e => setForm(f => ({ ...f, classe_technique: e.target.value }))}
            >
              <option value="">Aucune</option>
              {allClasses
                .filter(c => c.filiere_nom === 'Technique' && (!form.niveau || c.niveau === Number(form.niveau)))
                .map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}