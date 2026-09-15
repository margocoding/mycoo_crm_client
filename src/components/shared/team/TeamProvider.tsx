import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { teamApi } from '@/api/team.api';
import { errorMessage } from '@/api/base.api';
import type { Team } from '@/types/team.types';

interface TeamState {
  data: Team | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}
const TeamContext = createContext<TeamState | null>(null);

export function TeamProvider({ workspaceId, children }: { workspaceId: string; children: ReactNode }) {
  const [data, setData] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await teamApi.get(workspaceId, controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setData(null);
        setError(errorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [workspaceId]);
  useEffect(() => {
    void reload();
    return () => request.current?.abort();
  }, [reload]);
  return <TeamContext.Provider value={{ data, loading, error, reload }}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const value = useContext(TeamContext);
  if (!value) throw new Error('TeamProvider is required');
  return value;
}
