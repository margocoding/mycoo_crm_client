import { useState } from 'react';
import { LuArrowRight, LuSearch } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { getPartnerBalance } from './partner.model';
import { EmptyState, TableScroll, formatDate, Modal, Money, StatusBadge } from './PartnerUI';

export function AdminPartners() {
  const store = usePartnerStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase('ru');
  const partners = store.partners.filter(partner => !query || `${partner.name} ${partner.company} ${partner.email} ${partner.code}`.toLocaleLowerCase('ru').includes(query)).sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  const referralCounts = new Map<string, number>();
  for (const referral of store.referrals) referralCounts.set(referral.partnerId, (referralCounts.get(referral.partnerId) ?? 0) + 1);
  const selected = store.partners.find(partner => partner.id === selectedId);
  const referrals = store.referrals.filter(referral => referral.partnerId === selectedId);
  const balance = selected ? getPartnerBalance(store, selected.id) : undefined;

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Участники программы</span><h1>Партнёры</h1><p>Реестр партнёров, привлечённые компании и вознаграждения.</p></div></div>
    <div className="p-stats">
      <div className="p-stat"><span>Всего партнёров</span><strong>{store.partners.length}</strong><small>Зарегистрированы в программе</small></div>
      <div className="p-stat"><span>С привлечёнными клиентами</span><strong>{store.partners.filter(partner => referralCounts.has(partner.id)).length}</strong><small>Пригласили хотя бы одну компанию</small></div>
      <div className="p-stat"><span>Привлечено компаний</span><strong>{store.referrals.length}</strong><small>По партнёрским ссылкам</small></div>
      <div className="p-stat"><span>Начислено партнёрам</span><strong><Money value={store.ledger.reduce((sum, entry) => sum + entry.amount, 0)} /></strong><small>С учётом возвратов и корректировок</small></div>
    </div>
    <section className="p-panel">
      <div className="p-panel-head"><h2>Все партнёры <span className="p-muted">{partners.length}</span></h2><div className="p-actions p-filter-bar">
        <label className="p-field"><span><LuSearch aria-hidden="true" /> Поиск</span><input type="search" placeholder="Имя, компания, email или код" value={search} onChange={event => setSearch(event.target.value)} /></label>
      </div></div>
      {partners.length ? <TableScroll label="Все партнёры"><table className="p-table" aria-label="Все партнёры"><thead><tr><th scope="col">Партнёр</th><th scope="col">Регистрация</th><th scope="col">Клиенты</th><th scope="col">Доступно</th><th scope="col">Действие</th></tr></thead><tbody>{partners.map(partner => <tr key={partner.id}>
        <td><strong>{partner.name}</strong><small className="p-muted">{partner.company || partner.email}</small></td><td>{formatDate(partner.registeredAt)}</td><td>{referralCounts.get(partner.id) ?? 0}</td><td><Money value={getPartnerBalance(store, partner.id).available} /></td><td><button className="p-button small" type="button" onClick={() => setSelectedId(partner.id)} aria-label={`Открыть карточку ${partner.name}`}>Открыть <LuArrowRight aria-hidden="true" /></button></td>
      </tr>)}</tbody></table></TableScroll> : <EmptyState title="Партнёры не найдены" description={query ? 'Измените поисковый запрос.' : 'Здесь появятся зарегистрированные участники программы.'} />}
    </section>
    {selected && balance && <Modal title={selected.name} onClose={() => setSelectedId(null)}>
      <div className="p-panel-head"><div><span className="p-kicker">{selected.code}</span><p className="p-muted">Дата регистрации: {formatDate(selected.registeredAt)}</p></div></div>
      <dl className="p-detail-list">
        <div><dt>Компания</dt><dd>{selected.company || 'Не указана'}</dd></div><div><dt>Email</dt><dd>{selected.email}</dd></div><div><dt>Канал привлечения</dt><dd>{selected.channel || 'Не указан'}</dd></div><div><dt>Сайт или страница</dt><dd>{selected.website || 'Не указаны'}</dd></div>
      </dl>
      <h3>Баланс партнёра</h3>
      <div className="p-stats">
        <div className="p-stat"><span>Доступно</span><strong><Money value={balance.available} /></strong></div><div className="p-stat"><span>На удержании</span><strong><Money value={balance.pending} /></strong></div><div className="p-stat"><span>В резерве</span><strong><Money value={balance.reserved} /></strong></div><div className="p-stat"><span>Выплачено</span><strong><Money value={balance.paid} /></strong></div>
      </div>
      {balance.debt > 0 && <p className="p-notice warning">Задолженность после возвратов: <Money value={balance.debt} />. Она уменьшит следующие начисления.</p>}
      <div className="p-panel-head"><h3>Привлечённые компании</h3><span className="p-muted">{referrals.length}</span></div>
      {referrals.length ? <TableScroll label="Привлечённые компании партнёра"><table className="p-table" aria-label="Привлечённые компании партнёра"><thead><tr><th scope="col">Компания</th><th scope="col">Регистрация</th><th scope="col">Статус</th><th scope="col">Начислено</th></tr></thead><tbody>{referrals.map(referral => <tr key={referral.id}><td><strong>{referral.company}</strong><small className="p-muted p-mono">{referral.id}</small></td><td>{formatDate(referral.registeredAt)}</td><td><StatusBadge status={referral.status} /></td><td><Money value={store.ledger.filter(entry => entry.partnerId === selected.id && entry.referralId === referral.id).reduce((sum, entry) => sum + entry.amount, 0)} /></td></tr>)}</tbody></table></TableScroll> : <EmptyState title="Привлечённых компаний пока нет" description="Здесь появятся компании, зарегистрированные по ссылке партнёра." />}
    </Modal>}
  </>;
}

export default AdminPartners;
