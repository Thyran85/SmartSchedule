import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Link2, BadgeCheck } from 'lucide-react';
import { matieresApi, classesApi, enseignantsApi, classeMatieresApi } from '../services/api';
import type { Matiere, Classe, Enseignant, ClasseMatiere } from '../types';
import { SUBJECT_TYPES } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge, { type BadgeTone } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Table, { TableHead, Th, Td, Tr, ThActions, TdActions } from '../components/ui/Table';
import { Field, Input, Select, Checkbox } from '../components/ui/Input';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

const typeTones: Record<string, BadgeTone> = {
  GENERAL: 'success',
  TECHNIQUE: 'primary',
  LABORATOIRE: 'info',
  ATELIER: 'gold',
};

const empty = {
  nom: '', code: '', heures_par_semaine: '', coefficient: '1',
  type: 'GENERAL', necessite_salle_informatique: false,
  necessite_laboratoire: false, necessite_atelier: false,
};

const emptyAssign = { classe: '', matiere: '', enseignant: '', heures_par_semaine: '', est_commun: false };

export default function SubjectsPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [assignments, setAssignments] = useState<ClasseMatiere[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editing, setEditing] = useState<Matiere | null>(null);
  const [form, setForm] = useState(empty);
  const [assignForm, setAssignForm] = useState(emptyAssign);
  const confirm = useConfirm();
  const toast = useToast();

  const load = () => {
    Promise.all([
      matieresApi.list(),
      classeMatieresApi.list(),
      classesApi.list(),
      enseignantsApi.list(),
    ]).then(([m, a, c, t]) => {
      setMatieres(m.data.results);
      setAssignments(a.data.results);
      setClasses(c.data.results);
      setTeachers(t.data.results);
    }).catch(() => {});
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true); };

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
    if (editing) {
      await matieresApi.update(editing.id, data);
      toast.success('Matière modifiée', `${data.nom} a été mis à jour.`);
    } else {
      await matieresApi.create(data);
      toast.success('Matière créée', `${data.nom} a été ajoutée.`);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (m: Matiere) => {
    const ok = await confirm({
      title: 'Supprimer la matière',
      message: `Voulez-vous vraiment supprimer « ${m.nom} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await matieresApi.delete(m.id);
    toast.success('Matière supprimée', `${m.nom} a été retirée.`);
    load();
  };

  const openAssign = () => { setAssignForm(emptyAssign); setAssignModalOpen(true); };

  const handleAssign = async () => {
    const payload = {
      classe: Number(assignForm.classe),
      matiere: Number(assignForm.matiere),
      enseignant: Number(assignForm.enseignant),
      heures_par_semaine: Number(assignForm.heures_par_semaine),
      est_commun: assignForm.est_commun,
    };
    await classeMatieresApi.create(payload);
    toast.success('Affectation créée', 'La matière a été affectée à la classe.');
    setAssignModalOpen(false);
    load();
  };

  const removeAssign = async (a: ClasseMatiere) => {
    const ok = await confirm({
      title: 'Retirer l’affectation',
      message: `Retirer « ${a.matiere_nom} » de la classe « ${a.classe_nom} » ?`,
      confirmLabel: 'Retirer',
      danger: true,
    });
    if (!ok) return;
    await classeMatieresApi.delete(a.id);
    toast.success('Affectation retirée', 'La matière a été retirée de la classe.');
    load();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Gestion"
        title="Matières"
        subtitle="Matières enseignées et affectations classe — matière — enseignant"
        actions={
          <>
            <Button variant="success" onClick={openAssign} icon={<Plus />}>
              Affecter une matière
            </Button>
            <Button onClick={openCreate} icon={<Plus />}>
              Nouvelle matière
            </Button>
          </>
        }
      />

      {/* Matières */}
      <div className="animate-fade-up">
        <Table>
          <TableHead>
            <Th>Matière</Th>
            <Th>Code</Th>
            <Th>Type</Th>
            <Th>h/sem</Th>
            <Th>Coeff</Th>
            <ThActions>Actions</ThActions>
          </TableHead>
          {matieres.map(m => (
            <Tr key={m.id} className="group">
              <Td>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-ink">{m.nom}</span>
                </div>
              </Td>
              <Td className="font-mono text-[13px]">{m.code}</Td>
              <Td>
                <Badge tone={typeTones[m.type] || 'neutral'} dot>{SUBJECT_TYPES[m.type]}</Badge>
              </Td>
              <Td className="font-medium text-ink">{m.heures_par_semaine}h</Td>
              <Td>{m.coefficient}</Td>
              <TdActions>
                <div className="flex items-center justify-end gap-1">
                  <IconButton label="Modifier" tone="primary" onClick={() => openEdit(m)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(m)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </TdActions>
            </Tr>
          ))}
        </Table>
        {matieres.length === 0 && (
          <Card className="mt-4">
            <EmptyState
              compact
              icon={<BookOpen className="h-6 w-6" />}
              title="Aucune matière"
              description="Créez d'abord les matières du lycée."
              action={<Button onClick={openCreate} icon={<Plus />}>Nouvelle matière</Button>}
            />
          </Card>
        )}
      </div>

      {/* Affectations */}
      <div className="animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Affectations</h2>
            <p className="text-xs text-muted">Classe · matière · enseignant · heures</p>
          </div>
          <Button size="sm" variant="outline" onClick={openAssign} icon={<Plus />}>
            Affecter
          </Button>
        </div>
        <Table>
          <TableHead>
            <Th>Classe</Th>
            <Th>Matière</Th>
            <Th>Enseignant</Th>
            <Th>h/sem</Th>
            <Th>Commun</Th>
            <ThActions>Actions</ThActions>
          </TableHead>
          {assignments.map(a => (
            <Tr key={a.id} className="group">
              <Td className="font-semibold text-ink">{a.classe_nom}</Td>
              <Td>
                <span className="flex items-center gap-2">
                  {a.matiere_nom}
                  {a.est_commun && <BadgeCheck className="h-4 w-4 text-success" aria-label="Commun" />}
                </span>
              </Td>
              <Td>{a.enseignant_nom || <Badge tone="gold">Non assigné</Badge>}</Td>
              <Td className="font-medium text-ink">{a.heures_par_semaine}h</Td>
              <Td>
                {a.est_commun ? (
                  <Badge tone="success" icon={<Link2 />}>Commun</Badge>
                ) : '—'}
              </Td>
              <TdActions>
                <div className="flex items-center justify-end">
                  <IconButton label="Retirer" tone="danger" onClick={() => removeAssign(a)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </TdActions>
            </Tr>
          ))}
        </Table>
        {assignments.length === 0 && (
          <Card className="mt-4">
            <EmptyState
              compact
              icon={<Link2 className="h-6 w-6" />}
              title="Aucune affectation"
              description="Affectez les matières aux classes et aux enseignants."
              action={<Button size="sm" onClick={openAssign} icon={<Plus />}>Affecter une matière</Button>}
            />
          </Card>
        )}
      </div>

      {/* Modal matière */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la matière' : 'Nouvelle matière'}
        subtitle={editing ? 'Mettez à jour les informations' : 'Ajoutez une matière au programme'}
        icon={<BookOpen className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer la matière'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" htmlFor="m-nom" required>
              <Input id="m-nom" type="text" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ex : Mathématiques" />
            </Field>
            <Field label="Code" htmlFor="m-code" required>
              <Input id="m-code" type="text" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="Ex : MATH" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Heures/semaine" htmlFor="m-heures" required>
              <Input id="m-heures" type="number" step="0.5" min="1" value={form.heures_par_semaine}
                onChange={e => setForm(f => ({ ...f, heures_par_semaine: e.target.value }))} />
            </Field>
            <Field label="Coefficient" htmlFor="m-coeff" required>
              <Input id="m-coeff" type="number" step="0.5" min="1" value={form.coefficient}
                onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} />
            </Field>
            <Field label="Type" htmlFor="m-type" required>
              <Select id="m-type" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(SUBJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 pt-1">
            <Checkbox
              label="Nécessite une salle informatique"
              checked={form.necessite_salle_informatique}
              onChange={e => setForm(f => ({ ...f, necessite_salle_informatique: e.target.checked }))}
            />
            <Checkbox
              label="Nécessite un laboratoire"
              checked={form.necessite_laboratoire}
              onChange={e => setForm(f => ({ ...f, necessite_laboratoire: e.target.checked }))}
            />
            <Checkbox
              label="Nécessite un atelier"
              checked={form.necessite_atelier}
              onChange={e => setForm(f => ({ ...f, necessite_atelier: e.target.checked }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal affectation */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Affecter une matière"
        subtitle="Lier une matière à une classe et un enseignant"
        icon={<Link2 className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Annuler</Button>
            <Button variant="success" onClick={handleAssign}>Affecter</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Classe" htmlFor="a-classe" required>
            <Select id="a-classe" value={assignForm.classe}
              onChange={e => setAssignForm(f => ({ ...f, classe: e.target.value }))}>
              <option value="">Sélectionner…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matière" htmlFor="a-matiere" required>
              <Select id="a-matiere" value={assignForm.matiere}
                onChange={e => setAssignForm(f => ({ ...f, matiere: e.target.value }))}>
                <option value="">Sélectionner…</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </Select>
            </Field>
            <Field label="Heures/semaine" htmlFor="a-heures" required>
              <Input id="a-heures" type="number" step="0.5" min="1" value={assignForm.heures_par_semaine}
                onChange={e => setAssignForm(f => ({ ...f, heures_par_semaine: e.target.value }))} />
            </Field>
          </div>
          <Field label="Enseignant" htmlFor="a-enseignant">
            <Select id="a-enseignant" value={assignForm.enseignant}
              onChange={e => setAssignForm(f => ({ ...f, enseignant: e.target.value }))}>
              <option value="">Sélectionner…</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
            </Select>
          </Field>
          <Checkbox
            label="Cours commun"
            description="Programmé simultanément avec la classe technique associée."
            checked={assignForm.est_commun}
            onChange={e => setAssignForm(f => ({ ...f, est_commun: e.target.checked }))}
          />
        </div>
      </Modal>
    </div>
  );
}