import { Link } from 'react-router-dom';
import { LuCheck, LuClipboardList, LuUserRound } from 'react-icons/lu';
import type { Notification } from '@/types/notification.types';
import { useNotifications } from './NotificationsProvider';

export function NotificationList({ items, pending, onRead, compact = false }: {
  items: Notification[]; pending: boolean; onRead: (id: string) => Promise<boolean>; compact?: boolean;
}) {
  return <ul className="space-y-3">
    {items.map(item => {
      const Icon = item.kind === 'ROLE_CHANGED' ? LuUserRound : LuClipboardList;
      return <li key={item.id} className={`rounded-lg border p-3 sm:p-4 ${item.readAt ? 'border-line/40 bg-hull/20' : 'border-flux/25 bg-flux/5'}`}>
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${item.kind === 'ROLE_CHANGED' ? 'text-ion' : 'text-flux'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fog/70">
              <span>{{ROLE_CHANGED:'Изменение роли',TASK_ASSIGNED:'Назначение задачи',MEETING_INVITED:'Приглашение на встречу',MEETING_PROTOCOL:'Протокол встречи'}[item.kind]}</span>
              {!item.readAt && <span className="text-flux">Новое</span>}
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
            </div>
            <p className="mt-2 break-words text-sm leading-relaxed text-mist">{item.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {item.href && <Link to={item.href} className="text-flux underline underline-offset-4"
                onClick={() => { if (!item.readAt) void onRead(item.id); }}>{item.kind.startsWith('MEETING_') ? 'Открыть встречу' : item.kind === 'TASK_ASSIGNED' ? 'Открыть доску' : 'Открыть департамент'}</Link>}
              {!item.readAt && <button type="button" disabled={pending} onClick={() => void onRead(item.id)}
                aria-label={'Отметить прочитанным: ' + item.message}
                className="inline-flex items-center gap-1.5 text-fog hover:text-snow disabled:opacity-40">
                <LuCheck aria-hidden="true" />{compact ? 'Прочитано' : 'Отметить прочитанным'}
              </button>}
            </div>
          </div>
        </div>
      </li>;
    })}
  </ul>;
}

export function ActivityFeed() {
  const { data, loading, pending, error, reload, read } = useNotifications();
  return <div>
    <p className="mb-4 text-xs text-fog/60">Ваши назначения и изменения роли</p>
    {error && <p role="alert" className="mb-3 text-xs text-crit">{error} <button onClick={() => void reload()} className="underline">Повторить</button></p>}
    {loading ? <p role="status" className="text-sm text-fog">Загрузка событий…</p>
      : data && !data.items.length ? <p className="text-sm text-fog">Новых событий пока не было.</p>
      : data && <NotificationList items={data.items.slice(0, 4)} pending={pending} onRead={read} compact />}
    <Link to="/dashboard/notifications" className="mt-4 inline-block text-xs text-flux underline underline-offset-4">Все уведомления</Link>
  </div>;
}
