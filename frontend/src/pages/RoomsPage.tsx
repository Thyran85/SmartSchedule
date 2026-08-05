import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Monitor, Beaker, Wrench, DoorOpen, Users } from 'lucide-react';
import { sallesApi } from '../services/api';
import type { Salle } from '../types';
import { ROOM_TYPES } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge, { type BadgeTone } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { Field, Input, Select, Checkbox } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

const typeIcons: Record<string, React.ElementType> = {
  NORMALE: DoorOpen,
  LABORATOIRE: Beaker,
  ATELIER: Wrench,
  INFORMATIQUE: Monitor,
};

const typeTones: Record<string, BadgeTone> = {
  NORMALE: 'neutral',
  LABORATOIRE: 'info',
  ATELIER: 'gold',
  INFORMATIQUE: 'primary',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Salle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Salle | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', capacite: '', type: 'NORMALE', est_salle_unique: false });
  const confirm = useConfirm();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    sallesApi.list().then(r => setRooms(r.data.results)).catch(() => {})
      .finally(() => setLoading(false));
  };
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
    if (editing) {
      await sallesApi.update(editing.id, data);
      toast.success('Salle modifiée', `${data.nom} a été mis à jour.`);
    } else {
      await sallesApi.create(data);
      toast.success('Salle créée', `${data.nom} a été ajoutée.`);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (r: Salle) => {
    const ok = await confirm({
      title: 'Supprimer la salle',
      message: `Voulez-vous vraiment supprimer la salle « ${r.nom} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await sallesApi.delete(r.id);
    toast.success('Salle supprimée', `${r.nom} a été retirée.`);
    load();
  };

  return (
    <div>
      <PageHeader
        kicker="Gestion"
        title="Salles"
        subtitle="Salles de cours, laboratoires, ateliers et salles informatiques"
        actions={
          <Button onClick={openCreate} icon={<Plus />}>
            Ajouter une salle
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<DoorOpen className="h-7 w-7" />}
            title="Aucune salle"
            description="Ajoutez les salles du lycée pour permettre la génération."
            action={<Button onClick={openCreate} icon={<Plus />}>Ajouter une salle</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {rooms.map((r, i) => {
            const Icon = typeIcons[r.type] || DoorOpen;
            return (
              <Card
                key={r.id}
                hover
                padding="none"
                className="group animate-fade-up overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3.5 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-primary-soft text-primary [&>svg]:h-5 [&>svg]:w-5">
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold text-ink">{r.nom}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <Users className="h-4 w-4" />
                      {r.capacite} places
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <IconButton label="Modifier" tone="primary" onClick={() => openEdit(r)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(r)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-line bg-paper/50 px-5 py-3">
                  <Badge tone={typeTones[r.type] || 'neutral'} dot>
                    {ROOM_TYPES[r.type] || r.type}
                  </Badge>
                  {r.est_salle_unique && (
                    <Badge tone="danger">Salle unique</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la salle' : 'Nouvelle salle'}
        subtitle={editing ? 'Mettez à jour les informations' : 'Ajoutez une salle au lycée'}
        icon={<DoorOpen className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer la salle'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" htmlFor="salle-nom" required>
            <Input id="salle-nom" type="text" value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex : Salle 12" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacité" htmlFor="salle-capacite" required>
              <Input id="salle-capacite" type="number" min="1" value={form.capacite}
                onChange={e => setForm(f => ({ ...f, capacite: e.target.value }))}
                placeholder="Ex : 40" />
            </Field>
            <Field label="Type" htmlFor="salle-type" required>
              <Select id="salle-type" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          </div>
          {form.type === 'INFORMATIQUE' && (
            <Checkbox
              label="Salle unique"
              description="Un seul cours à la fois dans cette salle."
              checked={form.est_salle_unique}
              onChange={e => setForm(f => ({ ...f, est_salle_unique: e.target.checked }))}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}