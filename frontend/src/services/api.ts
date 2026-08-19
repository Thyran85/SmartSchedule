import axios from 'axios';
import type {
  Niveau, Filiere, Classe, Matiere, ClasseMatiere,
  Enseignant, DisponibiliteEnseignant,
  Salle, DisponibiliteSalle,
  ScheduleVersion, Cours, ContrainteSpecifique, Notification,
  PaginatedResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Classes
export const niveauxApi = {
  list: () => api.get<PaginatedResponse<Niveau>>('/classes/niveaux/'),
  create: (d: Partial<Niveau>) => api.post<Niveau>('/classes/niveaux/', d),
  update: (id: number, d: Partial<Niveau>) => api.put<Niveau>(`/classes/niveaux/${id}/`, d),
  delete: (id: number) => api.delete(`/classes/niveaux/${id}/`),
};

export const filieresApi = {
  list: () => api.get<PaginatedResponse<Filiere>>('/classes/filieres/'),
  create: (d: Partial<Filiere>) => api.post<Filiere>('/classes/filieres/', d),
};

export const classesApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Classe>>('/classes/classes/', { params }),
  create: (d: Partial<Classe>) => api.post<Classe>('/classes/classes/', d),
  update: (id: number, d: Partial<Classe>) => api.put<Classe>(`/classes/classes/${id}/`, d),
  delete: (id: number) => api.delete(`/classes/classes/${id}/`),
};

// Subjects
export const matieresApi = {
  list: () => api.get<PaginatedResponse<Matiere>>('/subjects/matieres/'),
  create: (d: Partial<Matiere>) => api.post<Matiere>('/subjects/matieres/', d),
  update: (id: number, d: Partial<Matiere>) =>
    api.put<Matiere>(`/subjects/matieres/${id}/`, d),
  delete: (id: number) => api.delete(`/subjects/matieres/${id}/`),
};

export const classeMatieresApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<ClasseMatiere>>('/subjects/classe-matieres/', { params }),
  create: (d: Partial<ClasseMatiere>) =>
    api.post<ClasseMatiere>('/subjects/classe-matieres/', d),
  update: (id: number, d: Partial<ClasseMatiere>) =>
    api.put<ClasseMatiere>(`/subjects/classe-matieres/${id}/`, d),
  delete: (id: number) => api.delete(`/subjects/classe-matieres/${id}/`),
};

// Teachers
export const enseignantsApi = {
  list: () => api.get<PaginatedResponse<Enseignant>>('/teachers/enseignants/'),
  create: (d: Partial<Enseignant>) => api.post<Enseignant>('/teachers/enseignants/', d),
  update: (id: number, d: Partial<Enseignant>) =>
    api.put<Enseignant>(`/teachers/enseignants/${id}/`, d),
  delete: (id: number) => api.delete(`/teachers/enseignants/${id}/`),
};

export const disponibilitesEnseignantApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<DisponibiliteEnseignant>>('/teachers/disponibilites/', { params }),
  create: (d: Partial<DisponibiliteEnseignant>) =>
    api.post<DisponibiliteEnseignant>('/teachers/disponibilites/', d),
  update: (id: number, d: Partial<DisponibiliteEnseignant>) =>
    api.put<DisponibiliteEnseignant>(`/teachers/disponibilites/${id}/`, d),
  delete: (id: number) => api.delete(`/teachers/disponibilites/${id}/`),
};

// Rooms
export const sallesApi = {
  list: () => api.get<PaginatedResponse<Salle>>('/rooms/salles/'),
  create: (d: Partial<Salle>) => api.post<Salle>('/rooms/salles/', d),
  update: (id: number, d: Partial<Salle>) =>
    api.put<Salle>(`/rooms/salles/${id}/`, d),
  delete: (id: number) => api.delete(`/rooms/salles/${id}/`),
};

export const disponibilitesSalleApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<DisponibiliteSalle>>('/rooms/disponibilites/', { params }),
  create: (d: Partial<DisponibiliteSalle>) =>
    api.post<DisponibiliteSalle>('/rooms/disponibilites/', d),
};

// Schedules
export const versionsApi = {
  list: () => api.get<PaginatedResponse<ScheduleVersion>>('/schedules/versions/'),
  create: (d: Partial<ScheduleVersion>) =>
    api.post<ScheduleVersion>('/schedules/versions/', d),
  generate: (id: number) =>
    api.post(`/schedules/versions/${id}/generate/`),
  activate: (id: number) =>
    api.post(`/schedules/versions/${id}/activate/`),
  getActive: () => api.get<ScheduleVersion>('/schedules/versions/active/'),
};

export const coursApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Cours>>('/schedules/cours/', { params }),
  byClass: (classeId: number, versionId?: number) =>
    api.get<Cours[]>('/schedules/cours/by_class/', {
      params: { classe: classeId, version: versionId },
    }),
  byTeacher: (teacherId: number, versionId?: number) =>
    api.get<Cours[]>('/schedules/cours/by_teacher/', {
      params: { enseignant: teacherId, version: versionId },
    }),
  byRoom: (roomId: number, versionId?: number) =>
    api.get<Cours[]>('/schedules/cours/by_room/', {
      params: { salle: roomId, version: versionId },
    }),
  toggleLock: (id: number) =>
    api.post(`/schedules/cours/${id}/toggle_lock/`),
  update: (id: number, d: Partial<Cours>) =>
    api.put<Cours>(`/schedules/cours/${id}/`, d),
  delete: (id: number) => api.delete(`/schedules/cours/${id}/`),
  create: (d: Partial<Cours>) => api.post<Cours>('/schedules/cours/', d),
};

// Constraints
export const contraintesApi = {
  list: () => api.get<PaginatedResponse<ContrainteSpecifique>>('/constraints/contraintes/'),
  create: (d: Partial<ContrainteSpecifique>) =>
    api.post<ContrainteSpecifique>('/constraints/contraintes/', d),
  update: (id: number, d: Partial<ContrainteSpecifique>) =>
    api.put<ContrainteSpecifique>(`/constraints/contraintes/${id}/`, d),
  delete: (id: number) => api.delete(`/constraints/contraintes/${id}/`),
};

// Notifications
export const notificationsApi = {
  list: () => api.get<PaginatedResponse<Notification>>('/notifications/notifications/'),
  markRead: (id: number) =>
    api.patch(`/notifications/notifications/${id}/`, { lue: true }),
};

export default api;
