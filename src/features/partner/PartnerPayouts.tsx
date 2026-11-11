import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LuArrowDownToLine, LuArrowUpRight, LuCircleCheck } from "react-icons/lu";
import { usePartnerStore } from "./partner.store";
import { getPartnerBalance } from "./partner.model";
import { EmptyState, TableScroll, Modal, Money, StatusBadge, formatDate, formatMoney, formatPayoutId } from "./PartnerUI";
import type { Partner, PartnerStore, PayoutDetails } from "./partner.types";

const legalForms: Record<PayoutDetails["legalForm"], string> = { "self-employed": "Самозанятый", entrepreneur: "ИП", company: "Юридическое лицо" };

function DetailsSummary({ details }: { details: PayoutDetails }) {
  return <dl className="p-detail-list"><div><dt>Получатель</dt><dd>{details.recipient}</dd></div><div><dt>Форма работы</dt><dd>{legalForms[details.legalForm]}</dd></div><div><dt>ИНН</dt><dd className="p-mono">{details.taxId}</dd></div><div><dt>Банк</dt><dd>{details.bank}</dd></div><div><dt>Расчётный счёт</dt><dd className="p-mono">{details.account}</dd></div><div><dt>БИК</dt><dd className="p-mono">{details.bic}</dd></div></dl>;
}

function PayoutsView({ data, partner }: { data: PartnerStore; partner: Partner }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const balance = getPartnerBalance(data, partner.id);
  const payouts = data.payouts.filter((item) => item.partnerId === partner.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = payouts.find((item) => item.id === selectedId);
  const canRequest = Boolean(partner.payoutDetails) && balance.available >= data.terms.minimumPayout;

  function openRequest() { setAmount(String(balance.available)); setConfirmed(false); setError(""); setSuccess(""); setRequestOpen(true); }
  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (data.mutating) return;
    if (!confirmed) { setError("Подтвердите сумму и реквизиты получателя."); return; }
    const result = await data.requestPayout(partner.id, Number(amount.replace(",", ".")));
    if (!result.ok) { setError(result.error); return; }
    setRequestOpen(false);
    setSuccess("Заявка отправлена. Сумма зарезервирована до решения по выплате.");
  }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>Выплаты</h1><p>Запрашивайте вознаграждение и следите за статусом заявок.</p></div></div>
    {success ? <div className="p-notice success" role="status"><LuCircleCheck aria-hidden="true" /><p>{success}</p></div> : null}
    <section className="p-panel p-balance-hero" aria-labelledby="payout-balance-title"><div><span className="p-kicker" id="payout-balance-title">Доступно к выплате</span><div className="p-balance-value"><Money value={balance.available} /></div><p className="p-muted">В заявках: <Money value={balance.reserved} /> · Выплачено: <Money value={balance.paid} /></p></div><div className="p-balance-action"><button className="p-button primary" type="button" disabled={!canRequest} onClick={openRequest} aria-describedby={!canRequest ? "payout-unavailable" : undefined}><LuArrowDownToLine aria-hidden="true" /> Запросить выплату</button><small className="p-muted">От <Money value={data.terms.minimumPayout} /></small></div></section>
    {!canRequest ? <div className="p-notice warning" id="payout-unavailable"><p>{!partner.payoutDetails ? <>Для первой выплаты заполните данные получателя. <Link to="/partner/account/details">Добавить реквизиты <LuArrowUpRight aria-hidden="true" /></Link></> : <>Минимальная сумма выплаты — <Money value={data.terms.minimumPayout} />. {balance.pending > 0 ? <>Ещё <Money value={balance.pending} /> ожидает проверки.</> : "Приглашайте компании, чтобы пополнить доступный баланс."}</>}</p></div> : null}
    <section className="p-panel" aria-labelledby="payout-history-title"><div className="p-panel-head"><h2 id="payout-history-title">История заявок</h2><span className="p-muted">{payouts.length} заявок</span></div>
      {payouts.length ? <TableScroll label="История заявок на выплату"><table className="p-table" aria-label="История заявок на выплату"><thead><tr><th scope="col">Заявка</th><th scope="col">Запрошено</th><th scope="col">Статус</th><th scope="col">Выплата</th><th scope="col"><span className="p-sr-only">Подробности</span></th></tr></thead><tbody>{payouts.map((payout) => <tr key={payout.id}><td><strong>{formatDate(payout.createdAt)}</strong><small className="p-mono p-muted">{formatPayoutId(payout.id)}</small></td><td><Money value={payout.amount} /></td><td><StatusBadge status={payout.status} />{payout.status === "rejected" && payout.reviewNote ? <small className="p-muted p-table-note">{payout.reviewNote}</small> : null}</td><td>{payout.status === "paid" ? <><strong><Money value={payout.paidAmount ?? payout.amount} /></strong><small className="p-muted">{payout.paidAt ? formatDate(payout.paidAt) : "Дата не указана"}</small></> : "—"}</td><td><button className="p-button small" type="button" onClick={() => setSelectedId(payout.id)} aria-label={`Подробности заявки ${payout.id}`}>Подробнее <LuArrowUpRight aria-hidden="true" /></button></td></tr>)}</tbody></table></TableScroll> : <EmptyState title="Первое вознаграждение впереди" description="Здесь будет история ваших заявок: от отправки до выплаты." />}
    </section>
    {requestOpen && partner.payoutDetails ? <Modal title="Запросить выплату" onClose={() => { if (!data.mutating) setRequestOpen(false); }}><form className="p-form" onSubmit={submitRequest} noValidate>
      <p className="p-muted">Доступно <Money value={balance.available} />. После отправки сумма будет зарезервирована.</p>
      <label className="p-field"><span>Сумма, ₽</span><input autoFocus type="number" inputMode="decimal" min={data.terms.minimumPayout} max={balance.available} step="0.01" required value={amount} onChange={(event) => { setAmount(event.target.value); setConfirmed(false); setError(""); }} aria-invalid={Boolean(error) && confirmed} aria-describedby={`payout-amount-hint${error && confirmed ? " payout-request-error" : ""}`} /><small className="p-muted" id="payout-amount-hint">От {formatMoney(data.terms.minimumPayout)} до {formatMoney(balance.available)}</small></label>
      <h3>Куда перевести</h3><DetailsSummary details={partner.payoutDetails} /><p className="p-muted">Эти реквизиты сохранятся в заявке. <Link to="/partner/account/details">Изменить реквизиты</Link></p>
      <label className="p-checkbox"><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setError(""); }} aria-invalid={Boolean(error) && !confirmed} aria-describedby={error && !confirmed ? "payout-request-error" : undefined} /><span>Подтверждаю сумму и реквизиты получателя</span></label>
      {error ? <p className="p-notice warning" id="payout-request-error" role="alert">{error}</p> : null}
      <div className="p-actions"><button className="p-button" type="button" onClick={() => setRequestOpen(false)}>Отмена</button><button className="p-button primary" type="submit" disabled={data.mutating}>Отправить заявку</button></div>
    </form></Modal> : null}
    {selected ? <Modal title="Заявка на выплату" onClose={() => setSelectedId(null)}><div className="p-panel-head"><span className="p-mono p-muted">{formatPayoutId(selected.id)}</span><StatusBadge status={selected.status} /></div><dl className="p-detail-list"><div><dt>Дата заявки</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt>Запрошено</dt><dd><Money value={selected.amount} /></dd></div>{selected.status === "paid" ? <><div><dt>Выплачено</dt><dd><Money value={selected.paidAmount ?? selected.amount} /></dd></div><div><dt>Дата выплаты</dt><dd>{selected.paidAt ? formatDate(selected.paidAt) : "Не указана"}</dd></div></> : null}</dl>{selected.reviewNote ? <div className={`p-notice ${selected.status === "rejected" ? "warning" : ""}`}><div><strong>{selected.status === "rejected" ? "Причина отклонения" : "Комментарий"}</strong><p>{selected.reviewNote}</p>{selected.status === "rejected" ? <p>Сумма возвращена в доступный баланс с учётом корректировок.</p> : null}</div></div> : null}<h3>Реквизиты в этой заявке</h3><DetailsSummary details={selected.details} /><div className="p-actions"><button className="p-button" type="button" onClick={() => setSelectedId(null)}>Закрыть</button></div></Modal> : null}
  </>;
}

export function PartnerPayouts() {
  const data = usePartnerStore();
  const partner = data.partners.find((item) => item.id === data.currentPartnerId);
  return partner ? <PayoutsView key={partner.id} data={data} partner={partner} /> : <EmptyState title="Профиль не найден" />;
}

export default PartnerPayouts;
