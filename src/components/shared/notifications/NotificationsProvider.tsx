import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError, errorMessage } from '@/api/base.api';
import { notificationsApi } from '@/api/notifications.api';
import type { NotificationsPageData } from '@/types/notification.types';

interface NotificationsState {
  workspaceId: string;
  data: NotificationsPageData | null;
  loading: boolean;
  pending: boolean;
  error: string;
  reload: () => Promise<void>;
  read: (id: string) => Promise<boolean>;
  readAll: () => Promise<boolean>;
}
const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ workspaceId, children }: { workspaceId: string; children: ReactNode }) {
  const [data, setData] = useState<NotificationsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    try {
      const result = await notificationsApi.list(workspaceId, undefined, request.signal);
      if (!request.signal.aborted && mounted.current) { setData(result); setError(''); }
    } catch (cause) {
      if (!request.signal.aborted && mounted.current) {
        if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setData(null);
        setError(errorMessage(cause));
      }
    } finally { if (!request.signal.aborted && mounted.current) setLoading(false); }
  }, [workspaceId]);

  useEffect(() => {
    mounted.current = true;
    const visible = () => { if (!document.hidden && !busy.current) void reload(); };
    void reload();
    const timer = window.setInterval(visible, 30_000);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => { mounted.current = false; controller.current?.abort(); window.clearInterval(timer);
      window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); };
  }, [reload]);

  async function mark(id?: string) {
    if (busy.current) return false;
    busy.current = true; controller.current?.abort(); setPending(true);
    try {
      if (id) await notificationsApi.read(workspaceId, id); else await notificationsApi.readAll(workspaceId);
      if (mounted.current) await reload();
      return true;
    } catch (cause) { if (mounted.current) setError(errorMessage(cause)); return false; }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  }

  return <NotificationsContext.Provider value={{ workspaceId, data, loading, pending, error, reload,
    read: id => mark(id), readAll: () => mark() }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const state = useContext(NotificationsContext);
  if (!state) throw new Error('NotificationsProvider is required');
  return state;
}
