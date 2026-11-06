import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LuArrowUpRight, LuChartNoAxesCombined, LuCreditCard, LuListChecks, LuLogOut, LuMenu, LuSettings2, LuUsers, LuWallet, LuX } from 'react-icons/lu';
import { Logo } from '@/components/icons';
import { usePartnerStore } from './partner.store';

export function PartnerBrand() { return <Link to="/partner" className="p-brand" aria-label="MyCoo — партнёрская программа"><Logo />MYCOO</Link>; }

const partnerNav = [
  { to: '/partner/account', label: 'Обзор', icon: LuChartNoAxesCombined },
  { to: '/partner/account/referrals', label: 'Рефералы', icon: LuUsers },
  { to: '/partner/account/payouts', label: 'Выплаты', icon: LuWallet },
  { to: '/partner/account/details', label: 'Реквизиты', icon: LuCreditCard },
];
const adminNav = [
  { to: '/admin', label: 'Заявки на выплату', icon: LuWallet },
  { to: '/admin/partners', label: 'Партнёры', icon: LuUsers },
  { to: '/admin/ledger', label: 'Начисления', icon: LuListChecks },
  { to: '/admin/settings', label: 'Настройки', icon: LuSettings2 },
];
export default function PartnerLayout({ admin = false }: { admin?: boolean }) {
  const store = usePartnerStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const menuOpen = menuPath === location.pathname;
  const menu = admin ? adminNav : partnerNav;
  function closeMenu() {
    setMenuPath(null);
    if (window.matchMedia('(max-width: 800px)').matches) menuButton.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (menuOpen && window.matchMedia('(max-width: 800px)').matches) navigation.current?.querySelector<HTMLAnchorElement>('nav a')?.focus({ preventScroll: true });
  }, [menuOpen]);
  return <div className="p-shell">
    <header className="p-topbar">
      <button ref={menuButton} className="p-button small p-mobile-menu" type="button" aria-controls="partner-navigation" aria-expanded={menuOpen} onClick={() => menuOpen ? closeMenu() : setMenuPath(location.pathname)}>{menuOpen ? <LuX aria-hidden="true" /> : <LuMenu aria-hidden="true" />}Меню</button>
      <span className="p-topbar-title">Партнёрская программа <span aria-hidden="true"> / </span> {admin ? 'Администрирование' : 'Личный кабинет'}</span>
      {admin ? <span className="p-kicker">{store.adminLogin}</span> : <div className="p-profile"><label htmlFor="partner-profile">Партнёр</label><select id="partner-profile" aria-label="Партнёр" value={store.currentPartnerId} onChange={event => store.selectPartner(event.target.value)}>{store.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.company || partner.name}{partner.status === 'pending' ? ' · заявка' : partner.status === 'rejected' ? ' · отказ' : ''}</option>)}</select></div>}
    </header>
    <aside ref={navigation} id="partner-navigation" className={`p-sidebar ${menuOpen ? 'is-open' : ''}`} onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { event.preventDefault(); closeMenu(); } }} onClick={event => { if ((event.target as HTMLElement).closest('a') && menuOpen) closeMenu(); }}>
      <PartnerBrand />
      <nav aria-label={admin ? 'Администрирование программы' : 'Кабинет партнёра'}>{menu.map(item => <NavLink end to={item.to} key={item.to}><item.icon aria-hidden="true" />{item.label}</NavLink>)}</nav>
      <div className="p-sidebar-bottom">
        <Link to="/partner">О программе <LuArrowUpRight style={{ display: 'inline' }} aria-hidden="true" /></Link>
        <Link to={admin ? '/partner/account' : '/admin'}>{admin ? 'Кабинет партнёра' : 'Администратор'}</Link>
        {admin && <button type="button" className="p-button small" onClick={() => { store.logoutAdmin(); navigate('/admin/login'); }}><LuLogOut aria-hidden="true" />Выйти</button>}
      </div>
    </aside>
    <div className="p-main-wrap">
      <main className="p-content"><Outlet /></main>
    </div>
  </div>;
}

export function PartnerPublicHeader() {
  return <header className="p-public-header"><div className="p-brand"><PartnerBrand /><small>Партнёрам</small></div><nav aria-label="Партнёрская программа"><a href="/partner#how-it-works">Как это работает</a><Link className="p-button small" to="/partner/account">Кабинет партнёра <LuArrowUpRight aria-hidden="true" /></Link></nav></header>;
}
export function PartnerPublicFooter() {
  return <footer className="p-public-footer"><span>© {new Date().getFullYear()} MyCoo · Партнёрская программа</span><div><Link to="/">Сайт MyCoo</Link><Link to="/admin">Администратор</Link></div></footer>;
}
