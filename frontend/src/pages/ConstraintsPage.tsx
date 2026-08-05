import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import { contraintesApi, niveauxApi, classesApi, matieresApi, sallesApi } from '../services/api';
import type { ContrainteSpecifique, Niveau, Classe, Matiere, Salle } from '../types';
import { CONSTRAINT_TYPES, DAYS } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge, { type BadgeTone } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Table, { TableHead, Th, Td, Tr } from '../components/ui/Table';
import { Field, Input, Select } from '../components/ui/Input';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toast';

const typeTones: Record<string, BadgeTone> = {
  INDISP_NIVEAU: 'danger',
  INDISP_SALLE: 'gold',
  MAT_PERIODE: 'primary',
  MAX_HEURES_CONSEC: 'info',
  FIN_AVANCEE: 'gold',
  HEURES_MIN_JOUR: 'success',
};

const empty = {
  type_contrainte: 'INDISP_NIVEAU', classe: '', niveau: '',
  matiere: '', salle: '', jour_semaine: '', valeur: '',
  description: '',
};

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<ContrainteSpecifique[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [editing, setEditing] = useState<ContrainteSpecifique | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const confirm = useConfirm();
  const toast = useToast();

  const isTimeType = (t: string) => ['FIN_AVANCEE', 'INDISP_NIVEAU', 'INDISP_SALLE'].includes(t);
  const isNumericType = (t: string) => ['HEURES_MIN_JOUR', 'MAX_HEURES_CONSEC'].includes(t);
  const isPeriodType = (t: string) => t === 'MAT_PERIODE';

  const load = () => {
    Promise.all([
      contraintesApi.list(),
      niveauxApi.list(),
      classesApi.list(),
      matieresApi.list(),
      sallesApi.list(),
    ]).then(([c, n, cl, m, s]) => {
      setConstraints(c.data.results);
      setNiveaux(n.data.results);
      setClasses(cl.data.results);
      setMatieres(m.data.results);
      setSalles(s.data.results);
    }).catch(() => {});
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
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
      toast.success('Contrainte modifiée', 'La règle a été mise à jour.');
    } else {
      await contraintesApi.create(data);
      toast.success('Contrainte ajoutée', 'La règle sera appliquée à la prochaine génération.');
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (c: ContrainteSpecifique) => {
    const ok = await confirm({
      title: 'Supprimer la contrainte',
      message: 'Voulez-vous vraiment retirer cette contrainte de génération ?',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await contraintesApi.delete(c.id);
    toast.success('Contrainte supprimée', 'La règle a été retirée.');
    load();
  };

  const showTarget = !['MAX_HEURES_CONSEC', 'MAT_PERIODE', 'HEURES_MIN_JOUR'].includes(form.type_contrainte) || form.type_contrainte === 'INDISP_SALLE';
  const showMatiere = ['MAT_PERIODE', 'MAX_HEURES_CONSEC'].includes(form.type_contrainte);
  const showDay = ['INDISP_NIVEAU', 'INDISP_SALLE', 'FIN_AVANCEE'].includes(form.type_contrainte);
  const showValue = isTimeType(form.type_contrainte) || isNumericType(form.type_contrainte) || isPeriodType(form.type_contrainte);

  const descPlaceholder = {
    INDISP_NIVEAU: 'Ex : Les Secondes ne travaillent pas le mercredi après-midi',
    INDISP_SALLE: 'Ex : Laboratoire Physique indisponible le jeudi après-midi',
    FIN_AVANCEE: 'Ex : Les cours finissent à 17h le vendredi',
    HEURES_MIN_JOUR: 'Ex : Minimum 4h de cours par jour',
    MAX_HEURES_CONSEC: 'Ex : Max 2h consécutives de la même matière',
    MAT_PERIODE: 'Ex : Cette matière est uniquement le matin',
  }[form.type_contrainte] || 'Description de la contrainte';

  const renderTarget = (c: ContrainteSpecifique) => {
    if (c.type_contrainte === 'INDISP_SALLE') {
      return salles.find(s => s.id === c.salle)?.nom || `Salle #${c.salle}`;
    }
    if (c.classe) return classes.find(cl => cl.id === c.classe)?.nom || `Classe #${c.classe}`;
    if (c.niveau) return niveaux.find(n => n.id === c.niveau)?.nom || `Niveau #${c.niveau}`;
    return 'Tous';
  };

  const renderValue = (c: ContrainteSpecifique) => {
    if (c.type_contrainte === 'MAT_PERIODE') {
      return c.valeur === 0 ? 'Matin' : c.valeur === 1 ? 'Après-midi' : '—';
    }
    if (c.valeur !== null) return `${c.valeur}h`;
    return c.heure_limite || '—';
  };

  return (
    <div>
      <PageHeader
        kicker="Planification"
        title="Contraintes"
        subtitle="Règles personnalisées appliquées lors de la génération"
        actions={
          <Button onClick={openCreate} icon={<Plus />}>
            Ajouter une contrainte
          </Button>
        }
      />

      {constraints.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={<ClipboardCheck className="h-7 w-7" />}
            title="Aucune contrainte définie"
            description="Ajoutez des règles pour affiner la génération des emplois du temps."
            action={<Button onClick={openCreate} icon={<Plus />}>Ajouter une contrainte</Button>}
          />
        </Card>
      ) : (
        <div className="animate-fade-up">
          <Table>
            <TableHead>
              <Th>Type</Th>
              <Th>Cible</Th>
              <Th>Jour</Th>
              <Th>Valeur</Th>
              <Th>Description</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            {constraints.map(c => (
              <Tr key={c.id} className="group">
                <Td>
                  <Badge tone={typeTones[c.type_contrainte] || 'neutral'} dot>
                    {CONSTRAINT_TYPES[c.type_contrainte] || c.type_contrainte}
                  </Badge>
                </Td>
                <Td className="font-medium text-ink">{renderTarget(c)}</Td>
                <Td>{c.jour_semaine !== null ? DAYS[c.jour_semaine] : '—'}</Td>
                <Td>
                  <span className="font-mono text-[13px] font-medium text-ink">
                    {renderValue(c)}
                  </span>
                </Td>
                <Td className="max-w-[260px]">
                  <span className="line-clamp-2 text-[13px] text-muted">{c.description || '—'}</span>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconButton label="Modifier" tone="primary" onClick={() => openEdit(c)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(c)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la contrainte' : 'Nouvelle contrainte'}
        subtitle="Définissez la règle et sa cible"
        icon={<ClipboardCheck className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer la contrainte'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Type de contrainte" htmlFor="c-type" required>
            <Select id="c-type" value={form.type_contrainte}
              onChange={e => setForm(f => ({ ...f, type_contrainte: e.target.value }))}>
              {Object.entries(CONSTRAINT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>

          {showTarget && (
            form.type_contrainte === 'INDISP_SALLE' ? (
              <Field label="Salle concernée" htmlFor="c-salle" required>
                <Select id="c-salle" value={form.salle}
                  onChange={e => setForm(f => ({ ...f, salle: e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.type})</option>)}
                </Select>
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Niveau" htmlFor="c-niveau">
                  <Select id="c-niveau" value={form.niveau}
                    onChange={e => setForm(f => ({ ...f, niveau: e.target.value, classe: '' }))}>
                    <option value="">Tous</option>
                    {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                  </Select>
                </Field>
                <Field label="Classe" htmlFor="c-classe">
                  <Select id="c-classe" value={form.classe}
                    onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}>
                    <option value="">Toutes</option>
                    {classes
                      .filter(c => !form.niveau || c.niveau === Number(form.niveau))
                      .map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </Select>
                </Field>
              </div>
            )
          )}

          {showMatiere && (
            <Field label="Matière concernée" htmlFor="c-matiere" required>
              <Select id="c-matiere" value={form.matiere}
                onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}>
                <option value="">Sélectionner…</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </Select>
            </Field>
          )}

          {showDay && (
            <Field label="Jour de la semaine" htmlFor="c-jour">
              <Select id="c-jour" value={form.jour_semaine}
                onChange={e => setForm(f => ({ ...f, jour_semaine: e.target.value }))}>
                <option value="">Tous les jours</option>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </Select>
            </Field>
          )}

          {showValue && (
            <Field
              label={
                isTimeType(form.type_contrainte)
                  ? 'Nouvelle heure de fin'
                  : isPeriodType(form.type_contrainte)
                  ? 'Période'
                  : { HEURES_MIN_JOUR: 'Heures minimum par jour', MAX_HEURES_CONSEC: 'Max heures consécutives' }[form.type_contrainte] || 'Valeur'
              }
              hint={
                isTimeType(form.type_contrainte)
                  ? 'Heure limite autorisée pour les cours'
                  : undefined
              }
            >
              {isTimeType(form.type_contrainte) ? (
                <Input type="time" value={form.valeur}
                  onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))} />
              ) : isPeriodType(form.type_contrainte) ? (
                <Select value={form.valeur} onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  <option value="0">Matin seulement</option>
                  <option value="1">Après-midi seulement</option>
                </Select>
              ) : (
                <div className="relative">
                  <Input type="number" min="0" step="0.5" value={form.valeur}
                    onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                    placeholder={form.type_contrainte === 'HEURES_MIN_JOUR' ? 'Ex : 4' : 'Ex : 2'} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">h</span>
                </div>
              )}
            </Field>
          )}

          <Field label="Description" htmlFor="c-desc">
            <Input id="c-desc" type="text" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={descPlaceholder} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}