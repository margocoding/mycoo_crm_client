import { useEffect, useState } from 'react';
import { partnerApi } from '../../api/partner.api';
import { errorMessage } from '../../api/base.api';
import { formatDate, formatDateTime, Money, StatusBadge } from './PartnerUI';
import type { PartnerPayoutEvent } from './partner.types';

function eventNote(item: PartnerPayoutEvent) {
  const paidDate = item.status === 'paid' && item.note.match(/^Выплата зафиксирована за (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)$/);
  return paidDate ? `Выплата зафиксирована за ${formatDate(paidDate[1])}` : item.note;
}

export function AdminPayoutHistory({ id, status }: { id: string; status: string }) {
  const [items, setItems] = useState<PartnerPayoutEvent[]>([]);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    void partnerApi.payoutHistory(id).then(result => { if (current) setItems(result.items); })
      .catch(cause => { if (current) setError(errorMessage(cause)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id, status, retry]);
  return <section><h3>История заявки</h3>
    {loading ? <p role="status">Загружаем историю…</p> : error ? <div className="p-notice warning"><p role="alert">{error}</p><button className="p-button small" onClick={() => setRetry(value => value + 1)}>Повторить</button></div> : <ol className="p-activity-list">{items.map(item => <li key={item.id}><div><StatusBadge status={item.status} /><p>{eventNote(item)}</p><small className="p-muted">{item.actor} · {formatDateTime(item.createdAt)}</small></div>{item.amount !== null && <Money value={item.amount} />}</li>)}</ol>}
  </section>;
}
