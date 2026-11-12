import { useState } from 'react';
import { Link } from 'react-router-dom';
import { partnerApi } from '../../api/partner.api';
import { errorMessage } from '../../api/base.api';
import { usePartnerStore } from './partner.store';
import { usePartnerPage } from './usePartnerPage';
import { EmptyState, formatDate } from './PartnerUI';

function Notifications() {
  const page = usePartnerPage(partnerApi.notifications);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function read(id?: string) {
    if (busy) return;
    setBusy(true); setError('');
    const owner = usePartnerStore.getState().currentPartnerId;
    try {
      await partnerApi.readNotification(id);
      if (usePartnerStore.getState().currentPartnerId !== owner) return;
      page.setItems(items => items.map(item => !id || item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item));
      void usePartnerStore.getState().load('partner');
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>Уведомления</h1><p>Решения по вашим заявкам на выплату. Копии уведомлений приходят на почту аккаунта.</p></div><button className="p-button" disabled={busy || page.loading} onClick={() => void read()}>Прочитать все</button></div>
    <section className="p-panel">
      {(error || page.error) && <p className="p-notice warning" role="alert">{error || page.error}</p>}
      <ul className="p-activity-list">{page.items.map(item => <li key={item.id}><div><strong>{item.title}{!item.readAt && <span className="p-status info" style={{ marginLeft: 8 }}>Новое</span>}</strong><p>{item.message}</p><small className="p-muted">{formatDate(item.createdAt)}</small><div className="p-actions" style={{ marginTop: 12 }}><Link className="p-button small" to="/partner/account/payouts">К выплатам</Link>{!item.readAt && <button className="p-button small" disabled={busy} onClick={() => void read(item.id)}>Прочитано</button>}</div></div></li>)}</ul>
      {!page.loading && !page.error && !page.items.length && <EmptyState title="Уведомлений пока нет" description="Здесь появятся изменения статуса ваших заявок на выплату." />}
      {page.loading && <p role="status">Загружаем уведомления…</p>}
      <div className="p-actions"><button className="p-button" disabled={page.loading} onClick={() => void page.load()}>Обновить</button>{page.cursor && <button className="p-button" disabled={page.loading} onClick={() => void page.load(page.cursor!)}>Показать ещё</button>}</div>
    </section>
  </>;
}
export default function PartnerNotifications() {
  const id = usePartnerStore(state => state.currentPartnerId);
  return <Notifications key={id} />;
}
