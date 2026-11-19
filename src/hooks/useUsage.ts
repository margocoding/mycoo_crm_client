import { useEffect, useState } from 'react';
import { api, ApiError, errorMessage } from '@/api/base.api';
import type { CompanyUsage } from '@/types/usage.types';

export function useUsage(workspaceId: string, departmentId?: string) {
  const key = `${workspaceId}:${departmentId ?? ''}`;
  const [state, setState] = useState<{ key: string; data: CompanyUsage | null; error: string }>({ key, data: null, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController;
    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      try {
        const { data } = await api.get<CompanyUsage>(`/workspace/${encodeURIComponent(workspaceId)}/usage`, {
          signal: request.signal, params: departmentId ? { departmentId } : {},
        });
        if (!disposed && !request.signal.aborted) setState({ key, data, error: '' });
      } catch (error) {
        if (disposed || request.signal.aborted) return;
        const denied = error instanceof ApiError && [401, 403, 404].includes(error.status);
        setState(previous => ({ key, data: !denied && previous.key === key ? previous.data : null, error: errorMessage(error) }));
      }
    };
    const visible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const timer = setInterval(visible, 60_000);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => { disposed = true; controller?.abort(); clearInterval(timer);
      window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); };
  }, [workspaceId, departmentId, key, revision]);
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : '', reload: () => setRevision(n => n + 1) };
}
