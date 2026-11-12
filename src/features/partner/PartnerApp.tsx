import { lazy, Suspense, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { usePartnerStore } from './partner.store';
import PartnerLayout from './PartnerLayout';
import PartnerLanding from './PartnerLanding';
import PartnerRegistration from './PartnerRegistration';
import PartnerLogin from './PartnerLogin';
import { TOKEN_KEY } from '../../api/base.api';
import { EmptyState } from './PartnerUI';
import DashboardBackground from '@/components/layout/DashboardBackground';
import './partner.css';

const PartnerAccount = lazy(() => import('./PartnerAccount'));
const PartnerReferrals = lazy(() => import('./PartnerReferrals'));
const PartnerPayouts = lazy(() => import('./PartnerPayouts'));
const PartnerDetails = lazy(() => import('./PartnerDetails'));
const PartnerLedger = lazy(() => import('./PartnerLedger'));
const PartnerNotifications = lazy(() => import('./PartnerNotifications'));
const AdminLogin = lazy(() => import('./AdminLogin'));
const AdminPayouts = lazy(() => import('./AdminPayouts'));
const AdminPartners = lazy(() => import('./AdminPartners'));
const AdminLedger = lazy(() => import('./AdminLedger'));
const AdminSettings = lazy(() => import('./AdminSettings'));

function AdminGuard() {
  const authenticated = usePartnerStore(state => state.adminAuthenticated);
  const location = useLocation();
  return authenticated ? <PartnerLayout admin /> : <Navigate to="/admin/login" state={{ from: location }} replace />;
}
function PartnerGuard() {
  const { partnerAuthenticated, currentPartnerId } = usePartnerStore();
  if (!partnerAuthenticated) return <Navigate to="/partner/login" replace />;
  return currentPartnerId ? <PartnerLayout /> : <Navigate to="/partner/register" replace />;
}
export default function PartnerApp() {
  const { pathname, hash } = useLocation();
  const store = usePartnerStore();
  const scope = pathname.startsWith('/admin') ? 'admin' : pathname === '/partner' || pathname === '/partner/' ? 'public' : 'partner';
  useEffect(() => { void usePartnerStore.getState().load(scope); }, [scope]);
  useEffect(() => {
    const expirePartner = () => { usePartnerStore.getState().logoutPartner(); void usePartnerStore.getState().load(scope); };
    const expireAdmin = () => { usePartnerStore.getState().invalidate(scope); void usePartnerStore.getState().load(scope); };
    const changedSession = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY && scope === 'partner') {
        usePartnerStore.getState().invalidate(scope);
        void usePartnerStore.getState().load(scope);
      }
    };
    const refresh = () => { if (scope !== 'public' && !usePartnerStore.getState().mutating && document.visibilityState !== 'hidden') void usePartnerStore.getState().load(scope); };
    window.addEventListener('mycoo:session-expired', expirePartner);
    window.addEventListener('mycoo:partner-admin-expired', expireAdmin);
    window.addEventListener('storage', changedSession);
    window.addEventListener('focus', refresh);
    const timer = scope === 'partner' ? window.setInterval(refresh, 60_000) : undefined;
    return () => { window.clearInterval(timer); window.removeEventListener('mycoo:session-expired', expirePartner); window.removeEventListener('mycoo:partner-admin-expired', expireAdmin); window.removeEventListener('storage', changedSession); window.removeEventListener('focus', refresh); };
  }, [scope]);
  useEffect(() => {
    document.title = pathname.startsWith('/admin') ? 'Администрирование · Партнёры MyCoo' : 'Партнёрская программа · MyCoo';
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    return () => { document.title = 'MyCoo'; };
  }, [pathname, hash]);
  const waiting = store.scope !== scope || store.loading || (!store.loaded && !store.loadError);
  if (waiting) return <div className="partner-ui"><DashboardBackground /><div className="p-empty" role="status">Загружаем кабинет…</div></div>;
  if (store.loadError) return <div className="partner-ui"><DashboardBackground /><div className="p-auth p-panel"><h1>Не удалось загрузить данные</h1><p role="alert">{store.loadError}</p><button type="button" className="p-button primary" onClick={() => void store.load(scope)}>Повторить</button><Link className="p-button" to="/partner">О программе</Link></div></div>;
  return <div className="partner-ui"><DashboardBackground /><Suspense fallback={<div className="p-empty" role="status">Загружаем страницу…</div>}><Routes>
    <Route path="/partner" element={<PartnerLanding />} />
    <Route path="/partner/login" element={<PartnerLogin />} />
    <Route path="/partner/register" element={<PartnerRegistration />} />
    <Route path="/partner/apply" element={<Navigate to="/partner/register" replace />} />
    <Route path="/partner/account" element={<PartnerGuard />}>
      <Route index element={<PartnerAccount />} />
      <Route path="referrals" element={<PartnerReferrals />} />
      <Route path="payouts" element={<PartnerPayouts />} />
      <Route path="details" element={<PartnerDetails />} />
      <Route path="ledger" element={<PartnerLedger />} />
      <Route path="notifications" element={<PartnerNotifications />} />
    </Route>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<AdminGuard />}>
      <Route index element={<AdminPayouts />} />
      <Route path="partners" element={<AdminPartners />} />
      <Route path="ledger" element={<AdminLedger />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>
    <Route path="*" element={<EmptyState title="Страница не найдена"><Link to="/partner" className="p-button primary">К партнёрской программе</Link></EmptyState>} />
  </Routes></Suspense></div>;
}
