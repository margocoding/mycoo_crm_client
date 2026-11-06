import { useState, type FormEvent } from 'react';
import { LuArrowRight, LuCheck, LuSearch } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { getPartnerBalance } from './partner.model';
import { EmptyState, TableScroll, formatDate, Modal, Money, StatusBadge } from './PartnerUI';

export function AdminPartners() {
  const store = usePartnerStore();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = search.trim().toLocaleLowerCase('ru');
  const partners = store.partners.filter(partner => (status === 'all' || partner.status === status) && (!query || `${partner.name} ${partner.company} ${partner.email} ${partner.code}`.toLocaleLowerCase('ru').includes(query))).slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  const selected = store.partners.find(partner => partner.id === selectedId);
  const referrals = store.referrals.filter(referral => referral.partnerId === selectedId);
  const balance = selected ? getPartnerBalance(store, selected.id) : undefined;

  function open(id: string) {
    setSelectedId(id);
    setRejecting(false);
    setReason('');
    setError('');
    setNotice('');
  }

  function review(status: 'approved' | 'rejected') {
    if (!selected) return;
    if (status === 'rejected' && !reason.trim()) { setError('Укажите причину отклонения заявки.'); return; }
    const result = store.reviewPartner(selected.id, status, status === 'rejected' ? reason.trim() : undefined);
    if (!result.ok) { setError(result.error); return; }
    setError('');
    setRejecting(false);
    setNotice(status === 'approved' ? 'Заявка одобрена. Партнёру доступен личный кабинет.' : 'Заявка отклонена. Партнёр увидит вашу причину.');
  }

  function reject(event: FormEvent<HTMLFormElement>) { event.preventDefault(); review('rejected'); }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Участники программы</span><h1>Партнёры</h1><p>Рассматривайте заявки и следите за результатами каждого партнёра.</p></div></div>
    <div className="p-stats">
      <div className="p-stat"><span>Всего партнёров</span><strong>{store.partners.length}</strong><small>Заявки за всё время</small></div>
      <div className="p-stat"><span>Ждут решения</span><strong>{store.partners.filter(partner => partner.status === 'pending').length}</strong><small>Новые заявки</small></div>
      <div className="p-stat"><span>Участвуют в программе</span><strong>{store.partners.filter(partner => partner.status === 'approved').length}</strong><small>Одобренные партнёры</small></div>
      <div className="p-stat"><span>Привлечено компаний</span><strong>{store.referrals.length}</strong><small>По партнёрским ссылкам</small></div>
    </div>
    <section className="p-panel">
      <div className="p-panel-head"><h2>Все партнёры <span className="p-muted">{partners.length}</span></h2><div className="p-actions p-filter-bar">
        <label className="p-field"><span><LuSearch aria-hidden="true" /> Поиск</span><input type="search" placeholder="Имя, компания или email" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="p-field"><span>Статус заявки</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Все статусы</option><option value="pending">На рассмотрении</option><option value="approved">Одобрены</option><option value="rejected">Отклонены</option></select></label>
      </div></div>
      {partners.length ? <TableScroll label="Все партнёры"><table className="p-table" aria-label="Все партнёры"><thead><tr><th scope="col">Партнёр</th><th scope="col">Дата заявки</th><th scope="col">Статус</th><th scope="col">Клиенты</th><th scope="col">Доступно</th><th scope="col">Действие</th></tr></thead><tbody>{partners.map(partner => <tr key={partner.id}>
        <td><strong>{partner.name}</strong><small className="p-muted">{partner.company || partner.email}</small></td><td>{formatDate(partner.appliedAt)}</td><td><StatusBadge status={partner.status} /></td><td>{store.referrals.filter(referral => referral.partnerId === partner.id).length}</td><td><Money value={getPartnerBalance(store, partner.id).available} /></td><td><button className="p-button small" type="button" onClick={() => open(partner.id)} aria-label={`Открыть карточку ${partner.name}`}>Открыть <LuArrowRight aria-hidden="true" /></button></td>
      </tr>)}</tbody></table></TableScroll> : <EmptyState title="Партнёры не найдены" description="Измените поисковый запрос или выберите другой статус." />}
    </section>
    {selected && balance && <Modal title={selected.name} onClose={() => setSelectedId(null)}>
      <div className="p-panel-head"><div><span className="p-kicker">{selected.code}</span><p className="p-muted">Заявка от {formatDate(selected.appliedAt)}</p></div><StatusBadge status={selected.status} /></div>
      <dl className="p-detail-list">
        <div><dt>Компания</dt><dd>{selected.company || 'Не указана'}</dd></div><div><dt>Email</dt><dd>{selected.email}</dd></div><div><dt>Канал привлечения</dt><dd>{selected.channel}</dd></div><div><dt>Сайт или страница</dt><dd>{selected.website || 'Не указаны'}</dd></div>
      </dl>
      {selected.reviewNote && <div className={`p-notice ${selected.status === 'rejected' ? 'warning' : ''}`}><div><strong>{selected.status === 'rejected' ? 'Причина отклонения' : 'Комментарий к заявке'}</strong><p>{selected.reviewNote}</p></div></div>}
      {notice && <p className="p-notice success" role="status">{notice}</p>}
      {error && <p className="p-notice warning" role="alert">{error}</p>}
      {selected.status === 'pending' && (rejecting ? <form className="p-form" onSubmit={reject}><label className="p-field"><span>Причина отклонения</span><textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} placeholder="Напишите, что нужно исправить в заявке" required autoFocus /></label><div className="p-actions"><button className="p-button danger" type="submit">Отклонить заявку</button><button className="p-button" type="button" onClick={() => { setRejecting(false); setError(''); }}>Отмена</button></div></form> : <div className="p-actions"><button className="p-button primary" type="button" onClick={() => review('approved')}><LuCheck aria-hidden="true" /> Одобрить заявку</button><button className="p-button danger" type="button" onClick={() => { setRejecting(true); setNotice(''); }}>Отклонить</button></div>)}
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
