import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock, Ban, GraduationCap, Clock4, Mail } from 'lucide-react';
import { enseignantsApi, matieresApi } from '../services/api';
import type { Enseignant, Matiere } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { Field, Input, Select, Checkbox } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

const empty = {
  nom: '', prenom: '', email: '', matiere: '',
  volume_horaire_max: '20', temps_partiel: false,
  prefere_eviter_apres_16h: false,
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Enseignant | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const confirm = useConfirm();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      enseignantsApi.list(),
      matieresApi.list(),
    ]).then(([t, m]) => {
      setTeachers(t.data.results);
      setMatieres(m.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true); };

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
      toast.success('Enseignant modifié', `${data.prenom} ${data.nom} a été mis à jour.`);
    } else {
      await enseignantsApi.create(data);
      toast.success('Enseignant ajouté', `${data.prenom} ${data.nom} a été enregistré.`);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (t: Enseignant) => {
    const ok = await confirm({
      title: 'Supprimer l’enseignant',
      message: `Voulez-vous vraiment supprimer « ${t.prenom} ${t.nom} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await enseignantsApi.delete(t.id);
    toast.success('Enseignant supprimé', `${t.prenom} ${t.nom} a été retiré.`);
    load();
  };

  return (
    <div>
      <PageHeader
        kicker="Gestion"
        title="Enseignants"
        subtitle="Profils, volumes horaires et préférences de planification"
        actions={
          <Button onClick={openCreate} icon={<Plus />}>
            Ajouter un enseignant
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : teachers.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<GraduationCap className="h-7 w-7" />}
            title="Aucun enseignant"
            description="Enregistrez les enseignants du lycée et leurs disponibilités."
            action={
              <Button onClick={openCreate} icon={<Plus />}>Ajouter un enseignant</Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-up">
          {teachers.map((t, i) => (
            <Card
              key={t.id}
              hover
              padding="none"
              className="group animate-fade-up overflow-hidden"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-strong font-display text-base font-semibold text-white">
                  {t.prenom.charAt(0)}{t.nom.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">
                        {t.prenom} {t.nom}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{t.email || '—'}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <IconButton label="Modifier" tone="primary" onClick={() => openEdit(t)}>
                        <Pencil />
                      </IconButton>
                      <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(t)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper/50 px-5 py-3">
                <Badge tone={t.matiere_nom ? 'primary' : 'neutral'} icon={<GraduationCap />}>
                  {t.matiere_nom || 'Sans matière'}
                </Badge>
                <Badge tone="info" icon={<Clock4 />}>
                  {t.volume_horaire_max}h/semaine
                </Badge>
                {t.temps_partiel && (
                  <Badge tone="gold" icon={<Ban />}>Temps partiel</Badge>
                )}
                {t.prefere_eviter_apres_16h && (
                  <Badge tone="danger" icon={<Clock />}>Évite après 16h</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier l’enseignant' : 'Nouvel enseignant'}
        subtitle={editing ? 'Mettez à jour les informations' : 'Ajoutez un enseignant au lycée'}
        icon={<GraduationCap className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer l’enseignant'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" htmlFor="t-nom" required>
              <Input id="t-nom" type="text" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ex : Rakoto" />
            </Field>
            <Field label="Prénom" htmlFor="t-prenom" required>
              <Input id="t-prenom" type="text" value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Ex : Jean" />
            </Field>
          </div>
          <Field label="Email" htmlFor="t-email">
            <Input id="t-email" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jean.rakoto@lycee.mg" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matière" htmlFor="t-matiere">
              <Select id="t-matiere" value={form.matiere}
                onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}>
                <option value="">Sélectionner…</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </Select>
            </Field>
            <Field label="Volume horaire max/semaine" htmlFor="t-vol" required>
              <Input id="t-vol" type="number" min="1" value={form.volume_horaire_max}
                onChange={e => setForm(f => ({ ...f, volume_horaire_max: e.target.value }))} />
            </Field>
          </div>
          <div className="grid gap-3 pt-1">
            <Checkbox
              label="Temps partiel"
              description="Charge horaire réduite à prendre en compte."
              checked={form.temps_partiel}
              onChange={e => setForm(f => ({ ...f, temps_partiel: e.target.checked }))}
            />
            <Checkbox
              label="Évite les cours après 16h"
              description="Planification préférentielle en début d'après-midi."
              checked={form.prefere_eviter_apres_16h}
              onChange={e => setForm(f => ({ ...f, prefere_eviter_apres_16h: e.target.checked }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}