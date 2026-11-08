import { useState, type FormEvent } from 'react';
import { LuArrowDownLeft, LuPlus, LuRotateCcw, LuSearch } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { partnerDateInput as localDay } from './partner.model';
import { EmptyState, TableScroll, formatDate, formatMoney, Modal, Money } from './PartnerUI';
import type { ActionResult, LedgerKind } from './partner.types';

const kindLabels: Record<LedgerKind, string> = { commission: 'Начисление', refund: 'Возврат', adjustment: 'Корректировка' };
type LedgerDialog = 'adjustment' | 'payment' | 'refund';

export function AdminLedger() {
  const store = usePartnerStore();
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<LedgerDialog | null>(null);
  const [partnerId, setPartnerId] = useState('');
  const [referralId, setReferralId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDay);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = search.trim().toLocaleLowerCase('ru');
  const entries = store.ledger.filter(entry => (partnerFilter === 'all' || entry.partnerId === partnerFilter) && (kindFilter === 'all' || entry.kind === kindFilter) && (!query || `${entry.id} ${entry.paymentId ?? ''} ${entry.referralId ?? ''} ${entry.description}`.toLocaleLowerCase('ru').includes(query))).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const refundablePayments = store.payments.filter(payment => payment.amount > payment.refundedAmount);
  const refundTarget = store.payments.find(payment => payment.id === paymentId);
  const refundableAmount = refundTarget ? Math.max(0, refundTarget.amount - refundTarget.refundedAmount) : 0;
  const now = Date.now();

  function open(next: LedgerDialog) {
    setDialog(next);
    setPartnerId(store.partners[0]?.id ?? '');
    setReferralId(store.referrals[0]?.id ?? '');
    setPaymentId(next === 'refund' ? refundablePayments[0]?.id ?? '' : '');
    setAmount('');
    setReason('');
    setDate(localDay());
    setError('');
    setNotice('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (store.mutating) return;
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value === 0 || (dialog !== 'adjustment' && value < 0)) { setError('Укажите корректную сумму операции.'); return; }
    if (dialog !== 'payment' && !reason.trim()) { setError('Укажите причину операции.'); return; }
    let result: ActionResult;
    if (dialog === 'payment') result = await store.recordPayment(referralId, paymentId.trim(), value, date);
    else if (dialog === 'refund') result = await store.refundPayment(paymentId, value, reason.trim());
    else result = await store.adjustCommission(partnerId, value, reason.trim(), paymentId.trim() || undefined);
    if (!result.ok) { setError(result.error); return; }
    setNotice(dialog === 'payment' ? 'Оплата учтена по условиям программы.' : dialog === 'refund' ? 'Возврат сохранён. Изменение комиссии добавлено отдельной записью.' : 'Корректировка добавлена отдельной записью.');
    setDialog(null);
  }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">История операций</span><h1>Начисления</h1><p>Каждая оплата, возврат и корректировка сохраняются в истории.</p></div><div className="p-actions"><button className="p-button" type="button" onClick={() => open('refund')} disabled={!refundablePayments.length}><LuRotateCcw aria-hidden="true" /> Возврат</button><button className="p-button" type="button" onClick={() => open('payment')} disabled={!store.referrals.length}><LuArrowDownLeft aria-hidden="true" /> Добавить оплату</button><button className="p-button primary" type="button" onClick={() => open('adjustment')} disabled={!store.partners.length}><LuPlus aria-hidden="true" /> Корректировка</button></div></div>
    {notice && <p className="p-notice success" role="status">{notice}</p>}
    <div className="p-stats">
      <div className="p-stat"><span>Начисления с оплат</span><strong><Money value={store.ledger.filter(entry => entry.kind === 'commission').reduce((sum, entry) => sum + entry.amount, 0)} /></strong><small>За всё время</small></div>
      <div className="p-stat"><span>Возвраты комиссии</span><strong><Money value={store.ledger.filter(entry => entry.kind === 'refund').reduce((sum, entry) => sum + entry.amount, 0)} /></strong><small>После возвратов клиентам</small></div>
      <div className="p-stat"><span>Корректировки</span><strong><Money value={store.ledger.filter(entry => entry.kind === 'adjustment').reduce((sum, entry) => sum + entry.amount, 0)} /></strong><small>С указанной причиной</small></div>
      <div className="p-stat"><span>Операций в истории</span><strong>{store.ledger.length}</strong><small>Сохранённые записи</small></div>
    </div>
    <section className="p-panel">
      <div className="p-panel-head"><h2>Журнал начислений <span className="p-muted">{entries.length}</span></h2></div>
      <div className="p-grid-3" style={{ marginBottom: 24 }}>
        <label className="p-field"><span><LuSearch aria-hidden="true" /> Поиск по операции</span><input type="search" placeholder="ID оплаты, клиента или причина" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="p-field"><span>Партнёр</span><select value={partnerFilter} onChange={event => setPartnerFilter(event.target.value)}><option value="all">Все партнёры</option>{store.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
        <label className="p-field"><span>Тип операции</span><select value={kindFilter} onChange={event => setKindFilter(event.target.value)}><option value="all">Все операции</option>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {entries.length ? <TableScroll label="Журнал начислений"><table className="p-table" aria-label="Журнал начислений"><thead><tr><th scope="col">Дата и тип</th><th scope="col">Партнёр / клиент</th><th scope="col">Оплата</th><th scope="col">Сумма</th><th scope="col">Доступность</th><th scope="col">Основание</th></tr></thead><tbody>{entries.map(entry => {
        const partner = store.partners.find(item => item.id === entry.partnerId);
        const referral = store.referrals.find(item => item.id === entry.referralId);
        const held = new Date(entry.availableAt).getTime() > now;
        return <tr key={entry.id}><td><strong>{kindLabels[entry.kind]}</strong><small className="p-muted">{formatDate(entry.createdAt)}</small></td><td><strong>{partner?.name ?? entry.partnerId}</strong><small className="p-muted">{referral?.company ?? 'Без привязки к клиенту'}</small>{entry.referralId && <small className="p-muted p-mono">{entry.referralId}</small>}</td><td className="p-mono">{entry.paymentId ?? '—'}</td><td><strong style={{ color: entry.amount < 0 ? 'var(--p-danger, #ff9999)' : undefined }}>{entry.amount > 0 ? '+' : ''}<Money value={entry.amount} /></strong></td><td>{held ? <>После {formatDate(entry.availableAt)}<small className="p-muted">На удержании</small></> : <span className="p-muted">Учтено в балансе</span>}</td><td style={{ minWidth: 200, maxWidth: 320, whiteSpace: 'normal' }}>{entry.description}<small className="p-muted p-mono">{entry.id}</small></td></tr>;
      })}</tbody></table></TableScroll> : <EmptyState title="Операций не найдено" description="Измените фильтры или добавьте оплату." />}
      <p className="p-muted" style={{ marginTop: 20 }}>Сохранённые операции не редактируются. Чтобы изменить сумму, добавьте корректировку с причиной.</p>
    </section>
    {dialog && <Modal title={dialog === 'payment' ? 'Добавить оплату' : dialog === 'refund' ? 'Возврат оплаты' : 'Корректировка начисления'} onClose={() => { if (!store.mutating) setDialog(null); }}>
      <p className="p-muted">{dialog === 'payment' ? 'Выберите клиента и укажите оплату. Повторная оплата с тем же ID не создаст второе начисление.' : dialog === 'refund' ? 'Возврат уменьшит комиссию партнёра. Исходная оплата останется в истории.' : 'Положительная сумма увеличит баланс, отрицательная — уменьшит. Исходные записи останутся в истории.'}</p>
      <form className="p-form" onSubmit={submit}>
        {dialog === 'adjustment' && <label className="p-field"><span>Партнёр</span><select value={partnerId} onChange={event => setPartnerId(event.target.value)} required><option value="" disabled>Выберите партнёра</option>{store.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name} · {partner.company || partner.email}</option>)}</select></label>}
        {dialog === 'payment' && <label className="p-field"><span>Клиент и ID привлечения</span><select value={referralId} onChange={event => setReferralId(event.target.value)} required><option value="" disabled>Выберите клиента</option>{store.referrals.map(referral => <option key={referral.id} value={referral.id}>{referral.company} · {referral.id}</option>)}</select></label>}
        {dialog === 'refund' ? <><label className="p-field"><span>Оплата</span><select value={paymentId} onChange={event => { setPaymentId(event.target.value); setAmount(''); }} required><option value="" disabled>Выберите оплату</option>{refundablePayments.map(payment => <option key={payment.id} value={payment.id}>{payment.id} · {store.referrals.find(referral => referral.id === payment.referralId)?.company} · {formatMoney(payment.amount)}</option>)}</select></label><p className="p-muted">Доступно к возврату: {formatMoney(refundableAmount)}</p></> : <label className="p-field"><span>{dialog === 'payment' ? 'Уникальный ID оплаты' : 'ID связанной оплаты, если есть'}</span><input className="p-mono" value={paymentId} onChange={event => setPaymentId(event.target.value)} required={dialog === 'payment'} placeholder="pay-…" /></label>}
        <div className={dialog === 'payment' ? 'p-grid-2' : undefined}><label className="p-field"><span>{dialog === 'adjustment' ? 'Изменение баланса, ₽' : dialog === 'refund' ? 'Сумма возврата, ₽' : 'Сумма оплаты, ₽'}</span><input type="number" step="0.01" min={dialog === 'adjustment' ? undefined : '0.01'} max={dialog === 'refund' ? refundableAmount : undefined} value={amount} onChange={event => setAmount(event.target.value)} required placeholder={dialog === 'adjustment' ? 'Например, 1500 или −1500' : '0,00'} /></label>{dialog === 'payment' && <label className="p-field"><span>Дата оплаты (по Москве)</span><input type="date" max={localDay()} value={date} onChange={event => setDate(event.target.value)} required /></label>}</div>
        {dialog !== 'payment' && <label className="p-field"><span>Причина {dialog === 'refund' ? 'возврата' : 'корректировки'}</span><textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} required placeholder="Укажите основание для операции" /></label>}
        {error && <p className="p-notice warning" role="alert">{error}</p>}
        <div className="p-actions"><button className={`p-button ${dialog === 'refund' ? 'danger' : 'primary'}`} type="submit" disabled={store.mutating}>{dialog === 'payment' ? 'Сохранить оплату' : dialog === 'refund' ? 'Записать возврат' : 'Добавить корректировку'}</button><button className="p-button" type="button" onClick={() => setDialog(null)}>Отмена</button></div>
      </form>
    </Modal>}
  </>;
}

export default AdminLedger;
