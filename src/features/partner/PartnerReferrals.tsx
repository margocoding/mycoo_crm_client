import { useState } from "react";
import { LuArrowUpRight, LuSearch, LuUsers } from "react-icons/lu";
import { usePartnerStore } from "./partner.store";
import { EmptyState, TableScroll, Modal, Money, StatusBadge, formatDate } from "./PartnerUI";
import type { LedgerEntry, Partner, PartnerStore, ReferralStatus } from "./partner.types";

function RewardStatus({ entries }: { entries: LedgerEntry[] }) {
  if (!entries.length) return <span className="p-muted">Нет начислений</span>;
  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) return <span className="p-muted">Скорректировано</span>;
  const pending = entries.reduce((sum, item) => sum + (new Date(item.availableAt).getTime() > Date.now() ? item.amount : 0), 0) > 0;
  return <span className={pending ? "p-muted" : "p-positive"}>{pending ? "Ожидает проверки" : "Проверено"}</span>;
}

function ReferralsView({ data, partner }: { data: PartnerStore; partner: Partner }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReferralStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const referrals = data.referrals.filter((item) => item.partnerId === partner.id);
  const query = search.trim().toLocaleLowerCase("ru");
  const filtered = referrals.filter((item) => (status === "all" || item.status === status) && `${item.company} ${item.id}`.toLocaleLowerCase("ru").includes(query));
  const selected = referrals.find((item) => item.id === selectedId);
  const paymentsByReferral = new Map(referrals.map((item) => [item.id, data.payments.filter((payment) => payment.referralId === item.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))]));
  const ledgerByReferral = new Map(referrals.map((item) => [item.id, data.ledger.filter((entry) => entry.partnerId === partner.id && entry.referralId === item.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))]));
  const selectedPayments = selected ? paymentsByReferral.get(selected.id) || [] : [];
  const selectedLedger = selected ? ledgerByReferral.get(selected.id) || [] : [];

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>Приглашённые компании</h1><p>Регистрации, оплаты и вознаграждение по вашей ссылке.</p></div><span className="p-count"><LuUsers aria-hidden="true" /> {referrals.length}</span></div>
    <section className="p-panel" aria-label="Приглашённые компании">
      <div className="p-panel-head p-filters"><label className="p-field"><span><LuSearch aria-hidden="true" /> Поиск компании</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или ID" /></label><label className="p-field"><span>Статус подписки</span><select value={status} onChange={(event) => setStatus(event.target.value as ReferralStatus | "all")}><option value="all">Все статусы</option><option value="trial">Пробный период</option><option value="active">Активна</option><option value="overdue">Оплата просрочена</option><option value="cancelled">Отменена</option></select></label></div>
      {filtered.length ? <TableScroll label="Приглашённые компании"><table className="p-table" aria-label="Приглашённые компании"><thead><tr><th scope="col">Компания</th><th scope="col">Регистрация</th><th scope="col">Подписка</th><th scope="col">Оплаты</th><th scope="col">Вознаграждение</th><th scope="col"><span className="p-sr-only">Подробности</span></th></tr></thead><tbody>{filtered.map((referral) => {
        const payments = paymentsByReferral.get(referral.id) || [];
        const entries = ledgerByReferral.get(referral.id) || [];
        return <tr key={referral.id}><td><strong>{referral.company}</strong><small className="p-mono p-muted">{referral.id}</small></td><td>{formatDate(referral.registeredAt)}</td><td><StatusBadge status={referral.status} /></td><td><strong><Money value={payments.reduce((sum, payment) => sum + payment.amount - payment.refundedAmount, 0)} /></strong><small className="p-muted">{payments.length ? `Последняя ${formatDate(payments[0].paidAt)}` : "Оплат пока нет"}</small></td><td><strong><Money value={entries.reduce((sum, entry) => sum + entry.amount, 0)} /></strong><small><RewardStatus entries={entries} /></small></td><td><button className="p-button small" type="button" onClick={() => setSelectedId(referral.id)} aria-label={`История компании ${referral.company}`}>История <LuArrowUpRight aria-hidden="true" /></button></td></tr>;
      })}</tbody></table></TableScroll> : <EmptyState title={referrals.length ? "Ничего не найдено" : "Здесь будут ваши компании"} description={referrals.length ? "Попробуйте другое название или выберите все статусы." : "Поделитесь партнёрской ссылкой. После регистрации компания появится в этом списке."}>{referrals.length ? <button className="p-button small" type="button" onClick={() => { setSearch(""); setStatus("all"); }}>Сбросить фильтры</button> : null}</EmptyState>}
    </section>
    {selected ? <Modal title={selected.company} onClose={() => setSelectedId(null)}>
      <div className="p-panel-head"><span className="p-muted p-mono">{selected.id}</span><StatusBadge status={selected.status} /></div><p className="p-muted">Регистрация {formatDate(selected.registeredAt)}</p>
      <div className="p-grid-2"><div className="p-stat"><span>Оплачено с учётом возвратов</span><strong><Money value={selectedPayments.reduce((sum, payment) => sum + payment.amount - payment.refundedAmount, 0)} /></strong></div><div className="p-stat"><span>Вознаграждение</span><strong><Money value={selectedLedger.reduce((sum, entry) => sum + entry.amount, 0)} /></strong></div></div>
      <h3>История оплат</h3>{selectedPayments.length ? <TableScroll label="История оплат компании"><table className="p-table" aria-label="История оплат компании"><thead><tr><th scope="col">Дата</th><th scope="col">Оплата</th><th scope="col">Возврат</th></tr></thead><tbody>{selectedPayments.map((payment) => <tr key={payment.id}><td>{formatDate(payment.paidAt)}<small className="p-mono p-muted">{payment.id}</small></td><td><Money value={payment.amount} /></td><td>{payment.refundedAmount > 0 ? <Money value={payment.refundedAmount} /> : "—"}</td></tr>)}</tbody></table></TableScroll> : <p className="p-muted">Компания ещё не оплачивала подписку.</p>}
      <h3>История вознаграждений</h3>{selectedLedger.length ? <ul className="p-activity-list">{selectedLedger.map((entry) => <li key={entry.id}><div><strong>{entry.description}</strong><p className="p-muted">{formatDate(entry.createdAt)}</p><small className="p-muted">{entry.amount > 0 && new Date(entry.availableAt).getTime() > Date.now() ? `Доступно с ${formatDate(entry.availableAt)}` : "Учтено в балансе"}</small></div><strong className={entry.amount < 0 ? "p-negative" : "p-positive"}>{entry.amount > 0 ? "+" : ""}<Money value={entry.amount} /></strong></li>)}</ul> : <p className="p-muted">Вознаграждение появится после первой подходящей оплаты.</p>}
      <div className="p-actions"><button className="p-button" type="button" onClick={() => setSelectedId(null)}>Закрыть</button></div>
    </Modal> : null}
  </>;
}

export function PartnerReferrals() {
  const data = usePartnerStore();
  const partner = data.partners.find((item) => item.id === data.currentPartnerId);
  return partner ? <ReferralsView key={partner.id} data={data} partner={partner} /> : <EmptyState title="Выберите партнёра" />;
}

export default PartnerReferrals;
