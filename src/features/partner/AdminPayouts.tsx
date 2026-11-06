import { useState, type FormEvent } from 'react';
import { LuArrowRight, LuCheck, LuSearch } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { getPartnerBalance } from './partner.model';
import { EmptyState, TableScroll, formatDate, formatMoney, formatPayoutId, Modal, Money, StatusBadge } from './PartnerUI';
import type { ActionResult, PayoutStatus } from './partner.types';

const statusLabels: Record<PayoutStatus, string> = { new: 'Новые', review: 'На проверке', approved: 'Одобрены', paid: 'Выплачены', rejected: 'Отклонены' };
const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function AdminPayouts() {
  const store = usePartnerStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<'reject' | 'paid' | null>(null);
  const [reason, setReason] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(localDay);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = store.payouts.find(payout => payout.id === selectedId);
  const partner = selected ? store.partners.find(item => item.id === selected.partnerId) : undefined;
  const balance = partner ? getPartnerBalance(store, partner.id) : undefined;
  const partnerReferralIds = new Set(store.referrals.filter(referral => referral.partnerId === partner?.id).map(referral => referral.id));
  const returnedPayments = store.payments.filter(payment => partnerReferralIds.has(payment.referralId) && payment.refundedAmount > 0);
  const query = search.trim().toLocaleLowerCase('ru');
  const rows = store.payouts.filter(payout => {
    const owner = store.partners.find(item => item.id === payout.partnerId);
    return (status === 'all' || payout.status === status) && (!query || `${payout.id} ${formatPayoutId(payout.id)} ${owner?.name} ${owner?.company} ${owner?.email}`.toLocaleLowerCase('ru').includes(query));
  }).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const waiting = store.payouts.filter(payout => ['new', 'review', 'approved'].includes(payout.status));

  function open(id: string) {
    setSelectedId(id);
    setAction(null);
    setError('');
    setNotice('');
    setReason('');
    setPaidDate(localDay());
  }

  function handleResult(result: ActionResult, message: string) {
    if (!result.ok) { setError(result.error); return; }
    setError('');
    setAction(null);
    setNotice(message);
  }

  function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (action === 'reject') {
      if (!reason.trim()) { setError('Укажите причину отклонения.'); return; }
      handleResult(store.reviewPayout(selected.id, 'rejected', reason.trim()), 'Заявка отклонена. Резерв освобождён.');
    } else if (action === 'paid') {
      handleResult(store.markPaid(selected.id, Number(paidAmount), paidDate), 'Дата и сумма выплаты сохранены.');
    }
  }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Партнёрская программа</span><h1>Заявки на выплату</h1><p>Проверьте начисления и реквизиты, затем отметьте результат выплаты.</p></div></div>
    <div className="p-stats">
      <div className="p-stat"><span>Новые заявки</span><strong>{store.payouts.filter(item => item.status === 'new').length}</strong><small>Ждут первого просмотра</small></div>
      <div className="p-stat"><span>На проверке</span><strong>{store.payouts.filter(item => item.status === 'review').length}</strong><small>Проверьте возвраты и реквизиты</small></div>
      <div className="p-stat"><span>К выплате</span><strong><Money value={store.payouts.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0)} /></strong><small>По одобренным заявкам</small></div>
      <div className="p-stat"><span>Всего в работе</span><strong><Money value={waiting.reduce((sum, item) => sum + item.amount, 0)} /></strong><small>{waiting.length} заявок в очереди</small></div>
    </div>
    <section className="p-panel">
      <div className="p-panel-head"><h2>Очередь выплат <span className="p-muted">{rows.length}</span></h2><div className="p-actions p-filter-bar">
        <label className="p-field"><span><LuSearch aria-hidden="true" /> Поиск</span><input type="search" placeholder="Партнёр или номер заявки" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="p-field"><span>Статус</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Все статусы</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div></div>
      {rows.length ? <TableScroll label="Очередь заявок на выплату"><table className="p-table" aria-label="Очередь заявок на выплату"><thead><tr><th scope="col">Заявка</th><th scope="col">Партнёр</th><th scope="col">Сумма</th><th scope="col">Статус</th><th scope="col"><span className="p-muted">Действие</span></th></tr></thead><tbody>{rows.map(payout => {
        const owner = store.partners.find(item => item.id === payout.partnerId);
        return <tr key={payout.id}><td><strong className="p-mono">{formatPayoutId(payout.id)}</strong><small className="p-muted">{formatDate(payout.createdAt)}</small></td><td><strong>{owner?.name ?? 'Партнёр'}</strong><small className="p-muted">{owner?.company}</small></td><td><strong><Money value={payout.amount} /></strong>{payout.status === 'paid' && payout.paidAmount !== payout.amount ? <small className="p-muted">Фактически: {formatMoney(payout.paidAmount ?? 0)}</small> : null}</td><td><StatusBadge status={payout.status} /></td><td><button type="button" className="p-button small" onClick={() => open(payout.id)} aria-label={`Открыть заявку ${payout.id}`}>Открыть <LuArrowRight aria-hidden="true" /></button></td></tr>;
      })}</tbody></table></TableScroll> : <EmptyState title="Заявок не найдено" description="Измените поиск или выберите другой статус." />}
    </section>
    {selected && <Modal title={`Заявка ${formatPayoutId(selected.id)}`} onClose={() => setSelectedId(null)}>
      <div className="p-panel-head"><div><strong>{partner?.name}</strong><p className="p-muted">{partner?.company} · {partner?.email}</p></div><StatusBadge status={selected.status} /></div>
      <div className="p-grid-3">
        <div className="p-stat"><span>Запрошено</span><strong><Money value={selected.amount} /></strong><small>{formatDate(selected.createdAt)}</small></div>
        <div className="p-stat"><span>Доступно партнёру</span><strong><Money value={balance?.available ?? 0} /></strong><small>С учётом текущего резерва</small></div>
        <div className="p-stat"><span>В резерве</span><strong><Money value={balance?.reserved ?? 0} /></strong><small>По всем заявкам партнёра</small></div>
      </div>
      <section className="p-panel"><h3>Реквизиты на момент заявки</h3><dl className="p-detail-list">
        <div><dt>Получатель</dt><dd>{selected.details.recipient}</dd></div>
        <div><dt>Форма работы</dt><dd>{{ 'self-employed': 'Самозанятый', entrepreneur: 'ИП', company: 'Юридическое лицо' }[selected.details.legalForm]}</dd></div>
        <div><dt>ИНН</dt><dd className="p-mono">{selected.details.taxId}</dd></div>
        <div><dt>Банк</dt><dd>{selected.details.bank}</dd></div>
        <div><dt>Расчётный счёт</dt><dd className="p-mono">{selected.details.account}</dd></div>
        <div><dt>БИК</dt><dd className="p-mono">{selected.details.bic}</dd></div>
      </dl></section>
      <div className={`p-notice ${returnedPayments.length || (balance?.debt ?? 0) > 0 ? 'warning' : ''}`}><div><strong>Проверка возвратов</strong><p>{returnedPayments.length ? `У клиентов партнёра есть возвраты: ${formatMoney(returnedPayments.reduce((sum, payment) => sum + payment.refundedAmount, 0))}. Они учтены в начислениях.` : 'У клиентов этого партнёра возвратов нет.'}{(balance?.debt ?? 0) > 0 ? ` Задолженность: ${formatMoney(balance?.debt ?? 0)}.` : ''}</p></div></div>
      {selected.reviewNote && <div className="p-notice"><div><strong>Комментарий к заявке</strong><p>{selected.reviewNote}</p></div></div>}
      {selected.status === 'paid' && <div className="p-notice success"><LuCheck aria-hidden="true" /> Отмечено как выплачено: {formatMoney(selected.paidAmount ?? 0)} · {selected.paidAt ? formatDate(selected.paidAt) : 'Дата не указана'}</div>}
      {notice && <p className="p-notice success" role="status">{notice}</p>}
      {error && <p className="p-notice warning" role="alert">{error}</p>}
      {action ? <form onSubmit={submitAction} className="p-form">
        {action === 'reject' ? <label className="p-field"><span>Причина отклонения</span><textarea value={reason} onChange={event => setReason(event.target.value)} required rows={3} placeholder="Что партнёру нужно исправить?" autoFocus /></label> : <>
          <div className="p-grid-2"><label className="p-field"><span>Фактически выплачено, ₽</span><input type="number" min="0.01" max={selected.amount} step="0.01" value={paidAmount} onChange={event => setPaidAmount(event.target.value)} required /></label><label className="p-field"><span>Дата выплаты</span><input type="date" min={localDay(new Date(selected.createdAt))} max={localDay()} value={paidDate} onChange={event => setPaidDate(event.target.value)} required /></label></div>
        </>}
        <div className="p-actions"><button className={`p-button ${action === 'reject' ? 'danger' : 'primary'}`} type="submit">{action === 'reject' ? 'Отклонить заявку' : 'Зафиксировать выплату'}</button><button className="p-button" type="button" onClick={() => { setAction(null); setError(''); }}>Отмена</button></div>
      </form> : <div className="p-actions">
        {selected.status === 'new' && <button className="p-button primary" type="button" onClick={() => handleResult(store.reviewPayout(selected.id, 'review'), 'Заявка взята на проверку.')}>Взять на проверку <LuArrowRight aria-hidden="true" /></button>}
        {selected.status === 'review' && <><button className="p-button primary" type="button" onClick={() => handleResult(store.reviewPayout(selected.id, 'approved'), 'Заявка одобрена. Можно отметить выплату.')}><LuCheck aria-hidden="true" /> Одобрить заявку</button><button className="p-button danger" type="button" onClick={() => { setAction('reject'); setNotice(''); }}>Отклонить</button></>}
        {selected.status === 'approved' && <><button className="p-button primary" type="button" onClick={() => { setAction('paid'); setPaidAmount(String(selected.amount)); setNotice(''); }}>Отметить выплату</button><button className="p-button danger" type="button" onClick={() => { setAction('reject'); setNotice(''); }}>Отклонить</button></>}
        {['paid', 'rejected'].includes(selected.status) && <p className="p-muted">Заявка завершена. Её история сохранена.</p>}
      </div>}
    </Modal>}
  </>;
}

export default AdminPayouts;
