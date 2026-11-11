import { partnerApi } from '../../api/partner.api';
import { usePartnerStore } from './partner.store';
import { usePartnerPage } from './usePartnerPage';
import { EmptyState, formatDate, Money, StatusBadge, TableScroll } from './PartnerUI';

function Ledger() {
  const page = usePartnerPage(partnerApi.ledger);
  const referrals = usePartnerStore(state => state.referrals);
  const companies = new Map(referrals.map(referral => [referral.id, referral.company]));
  return <>
    <div className="p-page-head"><div><span className="p-kicker">Кабинет партнёра</span><h1>История начислений</h1><p>Все комиссии, возвраты и корректировки баланса.</p></div></div>
    <section className="p-panel">
      {page.items.length > 0 && <TableScroll label="История начислений"><table className="p-table"><thead><tr><th scope="col">Дата и операция</th><th scope="col">Компания</th><th scope="col">Сумма</th><th scope="col">Основание</th></tr></thead><tbody>{page.items.map(item => <tr key={item.id}>
        <td><StatusBadge status={item.kind} /><small className="p-muted">{formatDate(item.createdAt)}</small></td>
        <td>{item.referralId ? companies.get(item.referralId) ?? 'Приглашённая компания' : 'Корректировка баланса'}{item.paymentId && <small className="p-muted p-mono">{item.paymentId}</small>}</td>
        <td><strong className={item.amount < 0 ? 'p-negative' : 'p-positive'}>{item.amount > 0 ? '+' : ''}<Money value={item.amount} /></strong><small className="p-muted">{new Date(item.availableAt) > new Date() ? `Доступно с ${formatDate(item.availableAt)}` : 'Учтено в балансе'}</small></td>
        <td style={{ whiteSpace: 'normal', minWidth: 180 }}>{item.description}</td>
      </tr>)}</tbody></table></TableScroll>}
      {!page.loading && !page.error && !page.items.length && <EmptyState title="Начислений пока нет" description="Здесь появятся комиссии с оплат приглашённых компаний." />}
      {page.error && <p className="p-notice warning" role="alert">{page.error}</p>}
      {page.loading && <p role="status">Загружаем историю…</p>}
      {(page.cursor || page.error) && <button className="p-button" disabled={page.loading} onClick={() => void page.load(page.cursor ?? undefined)}>{page.error ? 'Повторить' : 'Показать ещё'}</button>}
    </section>
  </>;
}
export default function PartnerLedger() {
  const id = usePartnerStore(state => state.currentPartnerId);
  return <Ledger key={id} />;
}
