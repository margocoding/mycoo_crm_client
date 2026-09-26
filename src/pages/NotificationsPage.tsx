import { useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/api/notifications.api';
import { errorMessage } from '@/api/base.api';
import { useNotifications } from '@/components/shared/notifications/NotificationsProvider';
import { NotificationList } from '@/components/shared/notifications/NotificationList';
import type { Notification } from '@/types/notification.types';

export default function NotificationsPage() {
  const { workspaceId, data, loading, pending, error, reload, read, readAll } = useNotifications();
  const [older, setOlder] = useState<{ head: string; items: Notification[]; cursor: string | null } | null>(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const head = data?.items[0]?.id ?? '';
  const matching = older?.head === head ? older : null;
  const cursor = matching ? matching.cursor : data?.nextCursor;
  const latest = data?.items ?? [];
  const latestIds = new Set(latest.map(item => item.id));
  const items = [...latest, ...(matching?.items ?? []).filter(item => !latestIds.has(item.id))];

  async function loadMore() {
    if (!cursor || moreLoading || pending) return;
    const controller = new AbortController(); request.current = controller;
    setMoreLoading(true); setMoreError('');
    try {
      const page = await notificationsApi.list(workspaceId, cursor, controller.signal);
      if (!controller.signal.aborted) setOlder({ head, items: [...(matching?.items ?? []), ...page.items], cursor: page.nextCursor });
    } catch (cause) { if (!controller.signal.aborted) setMoreError(errorMessage(cause)); }
    finally { if (!controller.signal.aborted) setMoreLoading(false); }
  }

  async function mark(id?: string) {
    const success = id ? await read(id) : await readAll();
    if (success) setOlder(current => current ? { ...current, items: current.items.map(item => !id || item.id === id
      ? { ...item, readAt: item.readAt || new Date().toISOString() } : item) } : current);
    return success;
  }

  return <section className="mx-auto max-w-3xl space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-display text-xl font-bold text-snow">Уведомления</h1>
        <p className="mt-2 text-sm text-fog">Ваша личная лента активности в компании.</p>
        {data && <p aria-live="polite" className="mt-2 text-xs text-flux">Непрочитанных: {data.unreadCount}</p>}
      </div>
      <button type="button" disabled={pending || moreLoading || !data?.unreadCount} onClick={() => void mark()}
        className="rounded-lg border border-line px-3 py-2 text-xs text-mist hover:border-flux/50 disabled:opacity-40">Прочитать все</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-crit/30 p-4 text-sm text-crit">{error}
      <button onClick={() => void reload()} className="ml-3 underline">Повторить</button></div>}
    {loading ? <p role="status" className="text-sm text-fog">Загрузка уведомлений…</p>
      : data && !items.length ? <div className="glass rounded-lg p-6 text-sm text-fog">Здесь появятся уведомления о назначении задач и изменении вашей роли.</div>
      : <NotificationList items={items} pending={pending || moreLoading} onRead={id => mark(id)} />}
    {moreError && <p role="alert" className="text-sm text-crit">{moreError}</p>}
    {cursor && <button type="button" disabled={moreLoading || pending} onClick={() => void loadMore()}
      className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow disabled:opacity-40">{moreLoading ? 'Загрузка…' : 'Показать ещё'}</button>}
  </section>;
}
