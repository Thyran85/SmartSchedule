import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock, GraduationCap, Clock4, Mail, X } from 'lucide-react';
import { enseignantsApi, matieresApi, disponibilitesEnseignantApi } from '../services/api';
import type { Enseignant, Matiere, DisponibiliteEnseignant } from '../types';
import { DAYS } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

interface DispoDraft {
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
}

const empty = {
  nom: '', prenom: '', email: '', matiere: '',
  volume_horaire_max: '20',
};

const fmtTime = (t: string) => t.slice(0, 5);

function dispoSummary(list: DisponibiliteEnseignant[]) {
  const byDay = new Map<number, string[]>();
  for (const d of list.filter(x => x.est_disponible)) {
    const ranges = byDay.get(d.jour_semaine) || [];
    ranges.push(`${fmtTime(d.heure_debut)}–${fmtTime(d.heure_fin)}`);
    byDay.set(d.jour_semaine, ranges);
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]);
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Enseignant[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [disposMap, setDisposMap] = useState<Record<number, DisponibiliteEnseignant[]>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Enseignant | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [dispos, setDispos] = useState<DispoDraft[]>([]);
  const [disposLoading, setDisposLoading] = useState(false);
  const [draft, setDraft] = useState({ jour_semaine: '0', heure_debut: '07:00', heure_fin: '08:00' });
  const confirm = useConfirm();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      enseignantsApi.list(),
      matieresApi.list(),
      disponibilitesEnseignantApi.list(),
    ]).then(([t, m, d]) => {
      setTeachers(t.data.results);
      setMatieres(m.data.results);
      const map: Record<number, DisponibiliteEnseignant[]> = {};
      for (const dispo of d.data.results) {
        (map[dispo.enseignant] = map[dispo.enseignant] || []).push(dispo);
      }
      setDisposMap(map);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDispos([]);
    setDraft({ jour_semaine: '0', heure_debut: '07:00', heure_fin: '08:00' });
    setModalOpen(true);
  };

  const openEdit = (t: Enseignant) => {
    setEditing(t);
    setForm({
      nom: t.nom, prenom: t.prenom, email: t.email,
      matiere: String(t.matiere || ''),
      volume_horaire_max: String(t.volume_horaire_max),
    });
    setDispos([]);
    setDisposLoading(true);
    setModalOpen(true);
    disponibilitesEnseignantApi.list({ enseignant: String(t.id) })
      .then(r => setDispos(r.data.results.map(d => ({
        jour_semaine: d.jour_semaine,
        heure_debut: d.heure_debut,
        heure_fin: d.heure_fin,
      }))))
      .catch(() => {})
      .finally(() => setDisposLoading(false));
  };

  const addDispo = () => {
    const d: DispoDraft = {
      jour_semaine: Number(draft.jour_semaine),
      heure_debut: draft.heure_debut,
      heure_fin: draft.heure_fin,
    };
    if (d.heure_fin <= d.heure_debut) {
      toast.error('Horaire invalide', "L'heure de fin doit être après l'heure de début.");
      return;
    }
    const dup = dispos.some(x =>
      x.jour_semaine === d.jour_semaine &&
      x.heure_debut === d.heure_debut &&
      x.heure_fin === d.heure_fin,
    );
    if (dup) {
      toast.error('Créneau déjà ajouté', `${DAYS[d.jour_semaine]} ${fmtTime(d.heure_debut)}–${fmtTime(d.heure_fin)} est déjà enregistré.`);
      return;
    }
    setDispos([...dispos, d]);
  };

  const removeDispo = (idx: number) => {
    setDispos(dispos.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const data = {
      nom: form.nom, prenom: form.prenom, email: form.email,
      matiere: form.matiere ? Number(form.matiere) : null,
      volume_horaire_max: Number(form.volume_horaire_max),
    };
    try {
      let teacherId: number;
      if (editing) {
        await enseignantsApi.update(editing.id, data);
        teacherId = editing.id;
      } else {
        const res = await enseignantsApi.create(data);
        teacherId = res.data.id;
      }
      const existing = await disponibilitesEnseignantApi.list({ enseignant: String(teacherId) });
      await Promise.all(existing.data.results.map(d => disponibilitesEnseignantApi.delete(d.id)));
      for (const d of dispos) {
        await disponibilitesEnseignantApi.create({
          enseignant: teacherId,
          jour_semaine: d.jour_semaine,
          heure_debut: d.heure_debut,
          heure_fin: d.heure_fin,
          est_disponible: true,
        });
      }
      toast.success(editing ? 'Enseignant modifié' : 'Enseignant ajouté',
        `${data.prenom} ${data.nom} a été enregistré.`);
      setModalOpen(false);
      load();
    } catch {
      toast.error('Erreur', "L'enregistrement de l'enseignant a échoué.");
    }
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
        subtitle="Profils, volumes horaires et disponibilités"
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
          {teachers.map((t, i) => {
            const summary = dispoSummary(disposMap[t.id] || []);
            return (
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
                </div>
                {summary.length > 0 && (
                  <div className="border-t border-line px-5 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      <Clock className="h-3.5 w-3.5" /> Disponibilités
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {summary.map(([day, ranges]) => (
                        <li key={day} className="flex items-baseline gap-2 text-sm">
                          <span className="w-20 shrink-0 font-medium text-ink">{DAYS[day]}</span>
                          <span className="font-mono text-xs text-muted">{ranges.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier l’enseignant' : 'Nouvel enseignant'}
        subtitle={editing ? 'Mettez à jour les informations et disponibilités' : 'Ajoutez un enseignant au lycée'}
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

          <div className="rounded-2xl border border-line bg-paper/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock className="h-4 w-4 text-primary" />
                Disponibilités hebdomadaires
              </h4>
              {dispos.length > 0 && (
                <Badge tone="primary">{dispos.length} créneau{dispos.length > 1 ? 'x' : ''}</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              Les cours ne seront placés que dans ces créneaux pendant la génération. Laissez vide pour une disponibilité totale.
            </p>

            {disposLoading ? (
              <div className="mt-3 h-12 animate-pulse rounded-xl bg-line/60" />
            ) : dispos.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {dispos.map((d, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 shadow-[0_1px_0_0_var(--color-line)]">
                    <span className="w-24 shrink-0 font-medium text-ink">{DAYS[d.jour_semaine]}</span>
                    <span className="flex-1 font-mono text-xs text-muted">
                      {fmtTime(d.heure_debut)}–{fmtTime(d.heure_fin)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDispo(idx)}
                      aria-label={`Retirer ${DAYS[d.jour_semaine]} ${fmtTime(d.heure_debut)}–${fmtTime(d.heure_fin)}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-sm text-muted">
                Aucun créneau défini — disponible toute la semaine.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <Field label="Jour" htmlFor="d-jour">
                  <Select id="d-jour" value={draft.jour_semaine}
                    onChange={e => setDraft(d => ({ ...d, jour_semaine: e.target.value }))}>
                    {DAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="De" htmlFor="d-debut">
                <Input id="d-debut" type="time" value={draft.heure_debut}
                  onChange={e => setDraft(d => ({ ...d, heure_debut: e.target.value }))} />
              </Field>
              <Field label="À" htmlFor="d-fin">
                <Input id="d-fin" type="time" value={draft.heure_fin}
                  onChange={e => setDraft(d => ({ ...d, heure_fin: e.target.value }))} />
              </Field>
              <Button onClick={addDispo} icon={<Plus />} className="!mb-0.5">Ajouter</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}