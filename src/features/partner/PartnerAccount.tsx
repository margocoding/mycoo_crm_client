import { Link } from "react-router-dom";
import { LuArrowDownToLine, LuArrowUpRight, LuLink, LuUsers } from "react-icons/lu";
import { usePartnerStore } from "./partner.store";
import { getPartnerBalance } from "./partner.model";
import { CopyButton, EmptyState, Money, StatusBadge, formatDate } from "./PartnerUI";

export function PartnerAccount() {
  const data = usePartnerStore();
  const partner = data.partners.find((item) => item.id === data.currentPartnerId);
  if (!partner) return <EmptyState title="Профиль не найден" description="Обновите кабинет и повторите попытку." />;

  const balance = getPartnerBalance(data, partner.id);
  const referrals = data.referrals.filter((item) => item.partnerId === partner.id);
  const ledger = data.ledger.filter((item) => item.partnerId === partner.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const payouts = data.payouts.filter((item) => item.partnerId === partner.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const link = `${window.location.origin}/?partner=${encodeURIComponent(partner.code)}`;
  const referralNames = new Map(referrals.map((item) => [item.id, item.company]));

  return (
    <>
      <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>Обзор</h1></div></div>

      <section className="p-panel p-balance-hero" aria-labelledby="available-title">
        <div><span className="p-kicker" id="available-title">Доступно к выплате</span><div className="p-balance-value"><Money value={balance.available} /></div><p className="p-muted">После проверки оплат и с учётом отправленных заявок.</p></div>
        <div className="p-balance-action"><Link className="p-button primary" to="/partner/account/payouts"><LuArrowDownToLine aria-hidden="true" /> Запросить выплату</Link><small className="p-muted">Минимальная сумма — <Money value={data.terms.minimumPayout} /></small></div>
      </section>

      <div className="p-stats">
        <div className="p-stat"><span>Начислено всего</span><strong><Money value={balance.totalAccrued} /></strong><small>С учётом корректировок</small></div>
        <div className="p-stat"><span>Ожидает проверки</span><strong><Money value={balance.pending} /></strong><small>Проверка — {data.terms.holdDays} дн.</small></div>
        <div className="p-stat"><span>В заявках на выплату</span><strong><Money value={balance.reserved} /></strong><small>Сумма зарезервирована</small></div>
        <div className="p-stat"><span>Выплачено</span><strong><Money value={balance.paid} /></strong><small>Все завершённые выплаты</small></div>
      </div>

      {balance.debt > 0 ? <div className="p-notice warning"><p>Возвраты превысили доступный баланс на <Money value={balance.debt} />. Новые начисления сначала покроют эту сумму.</p></div> : null}

      <div className="p-grid-2">
        <section className="p-panel" aria-labelledby="referral-link-title">
          <div className="p-panel-head"><h2 id="referral-link-title"><LuLink aria-hidden="true" /> Ваша партнёрская ссылка</h2></div>
          <p className="p-muted">Поделитесь ссылкой с компанией, которой рекомендуете MyCoo.</p><div className="p-link-box"><code>{link}</code><CopyButton value={link} label="Копировать ссылку" /></div><p className="p-muted">Вознаграждение — {data.terms.commissionPercent}% от оплат в первые {data.terms.eligibleMonths} мес. после регистрации клиента.</p>
        </section>
        <section className="p-panel" aria-labelledby="clients-title">
          <div className="p-panel-head"><h2 id="clients-title"><LuUsers aria-hidden="true" /> Приглашённые компании</h2><Link className="p-button small" to="/partner/account/referrals">Все компании <LuArrowUpRight aria-hidden="true" /></Link></div>
          <div className="p-referral-count">{referrals.length}</div><p className="p-muted">{referrals.filter((item) => item.status === "active").length} с активной подпиской</p>
          {!referrals.length ? <p className="p-muted">Первая компания появится здесь после регистрации по вашей ссылке.</p> : null}
        </section>
      </div>

      <div className="p-grid-2">
        <section className="p-panel" aria-labelledby="recent-ledger-title">
          <div className="p-panel-head"><h2 id="recent-ledger-title">Последние начисления</h2><Link className="p-button small" to="/partner/account/ledger">Вся история <LuArrowUpRight aria-hidden="true" /></Link></div>
          {ledger.length ? <ul className="p-activity-list">{ledger.map((entry) => <li key={entry.id}><div><strong>{entry.referralId ? referralNames.get(entry.referralId) || "Приглашённая компания" : "Корректировка баланса"}</strong><p className="p-muted">{entry.description}</p><small className="p-muted">{formatDate(entry.createdAt)}{entry.amount > 0 && new Date(entry.availableAt).getTime() > Date.now() ? ` · Доступно с ${formatDate(entry.availableAt)}` : ""}</small></div><strong className={entry.amount < 0 ? "p-negative" : "p-positive"}>{entry.amount > 0 ? "+" : ""}<Money value={entry.amount} /></strong></li>)}</ul> : <EmptyState title="Начислений пока нет" description="Когда приглашённая компания оплатит подписку, здесь появится вознаграждение." />}
        </section>
        <section className="p-panel" aria-labelledby="recent-payouts-title">
          <div className="p-panel-head"><h2 id="recent-payouts-title">Последние выплаты</h2><Link className="p-button small" to="/partner/account/payouts">История <LuArrowUpRight aria-hidden="true" /></Link></div>
          {payouts.length ? <ul className="p-activity-list">{payouts.map((payout) => <li key={payout.id}><div><strong><Money value={payout.amount} /></strong><p className="p-muted">{formatDate(payout.createdAt)}</p>{payout.status === "rejected" && payout.reviewNote ? <small className="p-muted">{payout.reviewNote}</small> : null}</div><StatusBadge status={payout.status} /></li>)}</ul> : <EmptyState title="Выплат пока нет" description="Запросите выплату, когда доступный баланс достигнет минимальной суммы." />}
        </section>
      </div>
    </>
  );
}

export default PartnerAccount;
