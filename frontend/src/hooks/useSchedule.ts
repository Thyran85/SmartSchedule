import { useState, useEffect, useCallback } from 'react';
import type { ScheduleVersion, Cours } from '../types';
import { versionsApi, coursApi } from '../services/api';

export function useActiveVersion() {
  const [version, setVersion] = useState<ScheduleVersion | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await versionsApi.getActive();
      setVersion(res.data);
    } catch {
      setVersion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { version, loading, refetch: load };
}

export function useCourses(
  type: 'classe' | 'enseignant' | 'salle',
  id: number | null,
  versionId?: number,
) {
  const [courses, setCourses] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetcher = type === 'classe' ? coursApi.byClass
      : type === 'enseignant' ? coursApi.byTeacher
      : coursApi.byRoom;

    fetcher(id, versionId)
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [id, type, versionId]);

  return { courses, loading };
}
