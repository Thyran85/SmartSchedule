export interface Niveau {
  id: number;
  nom: string;
  ordre: number;
}

export interface Filiere {
  id: number;
  nom: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: number;
  niveau_nom: string;
  filiere: number;
  filiere_nom: string;
  effectif: number;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  heures_par_semaine: number;
  coefficient: number;
  type: 'GENERAL' | 'TECHNIQUE' | 'LABORATOIRE' | 'ATELIER';
  necessite_salle_informatique: boolean;
  necessite_laboratoire: boolean;
  necessite_atelier: boolean;
}

export interface ClasseMatiere {
  id: number;
  classe: number;
  classe_nom: string;
  matiere: number;
  matiere_nom: string;
  enseignant: number | null;
  enseignant_nom: string;
  heures_par_semaine: number;
  est_demi_groupe: boolean;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matiere: number | null;
  matiere_nom: string;
  volume_horaire_max: number;
  temps_partiel: boolean;
  prefere_eviter_apres_16h: boolean;
}

export interface DisponibiliteEnseignant {
  id: number;
  enseignant: number;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  est_disponible: boolean;
}

export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  type: 'NORMALE' | 'LABORATOIRE' | 'ATELIER' | 'INFORMATIQUE';
  est_salle_unique: boolean;
}

export interface DisponibiliteSalle {
  id: number;
  salle: number;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  est_disponible: boolean;
  motif: string;
}

export interface ScheduleVersion {
  id: number;
  nom: string;
  date_creation: string;
  est_active: boolean;
  score_qualite: number | null;
  notes: string;
}

export interface Cours {
  id: number;
  classe: number;
  classe_nom: string;
  matiere: number;
  matiere_nom: string;
  enseignant: number | null;
  enseignant_nom: string;
  salle: number | null;
  salle_nom: string;
  version: number;
  jour_semaine: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  est_verrouille: boolean;
  est_demi_groupe: boolean;
}

export interface ContrainteSpecifique {
  id: number;
  classe: number | null;
  niveau: number | null;
  matiere: number | null;
  type_contrainte: string;
  jour_semaine: number | null;
  heure_limite: string | null;
  valeur: number | null;
  description: string;
}

export interface Notification {
  id: number;
  utilisateur: number | null;
  type: string;
  message: string;
  lien: string;
  date_creation: string;
  lue: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type EntityType = 'classe' | 'enseignant' | 'salle';

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export const TIME_SLOTS = [
  { start: '07:00', end: '08:00' },
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:15', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:15', end: '17:00' },
  { start: '17:00', end: '18:00' },
];

export const ROOM_TYPES: Record<string, string> = {
  NORMALE: 'Salle normale',
  LABORATOIRE: 'Laboratoire',
  ATELIER: 'Atelier',
  INFORMATIQUE: 'Salle informatique',
};

export const SUBJECT_TYPES: Record<string, string> = {
  GENERAL: 'Général',
  TECHNIQUE: 'Technique',
  LABORATOIRE: 'Laboratoire',
  ATELIER: 'Atelier pratique',
};

export const CONSTRAINT_TYPES: Record<string, string> = {
  INDISP_NIVEAU: 'Indisponibilité niveau',
  MAT_PERIODE: 'Matière en période spécifique',
  MAX_HEURES_CONSEC: 'Max heures consécutives',
  FIN_AVANCEE: 'Fin des cours avancée',
  HEURES_MIN_JOUR: 'Heures minimum par jour',
};
