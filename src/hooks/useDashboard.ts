import { useEffect, useState } from 'react';
import { dashboardApi } from '@/api/dashboard.api';
import { ApiError, errorMessage } from '@/api/base.api';
import type { Dashboard } from '@/types/dashboard.types';

export function useDashboard(workspaceId?: string, departmentId?: string) {
  const [state, setState] = useState<{ key: string; data: Dashboard | null; error: string }>({ key: '', data: null, error: '' });
  const [revision, setRevision] = useState(0);
  const key = `${workspaceId ?? ''}:${departmentId ?? ''}`;
  useEffect(() => {
    if (!workspaceId) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      clearTimeout(timer);
      let interval = 60_000;
      try {
        const data = await dashboardApi.get(workspaceId, departmentId, request.signal);
        if (disposed || request.signal.aborted) return;
        setState({ key, data, error: '' });
        if (data.ai.status === 'updating') interval = 5000;
      } catch (error) {
        if (disposed || request.signal.aborted) return;
        const denied = error instanceof ApiError && [401, 403, 404].includes(error.status);
        setState(current => ({ key, data: !denied && current.key === key ? current.data : null, error: errorMessage(error) }));
      }
      if (!disposed) timer = setTimeout(() => { if (!document.hidden) void refresh(); }, interval);
    };
    const visible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => { disposed = true; controller?.abort(); clearTimeout(timer);
      window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); };
  }, [workspaceId, departmentId, key, revision]);
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : '',
    reload: () => setRevision(value => value + 1) };
}
