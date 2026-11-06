import { lazy, Suspense, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { usePartnerStore } from './partner.store';
import PartnerLayout from './PartnerLayout';
import PartnerLanding from './PartnerLanding';
import PartnerApplication from './PartnerApplication';
import { EmptyState } from './PartnerUI';
import './partner.css';

const PartnerAccount = lazy(() => import('./PartnerAccount'));
const PartnerReferrals = lazy(() => import('./PartnerReferrals'));
const PartnerPayouts = lazy(() => import('./PartnerPayouts'));
const PartnerDetails = lazy(() => import('./PartnerDetails'));
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
export default function PartnerApp() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = pathname.startsWith('/admin') ? 'Администрирование · Партнёры MyCoo' : 'Партнёрская программа · MyCoo';
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    return () => { document.title = 'MyCoo'; };
  }, [pathname, hash]);
  return <div className="partner-ui"><Suspense fallback={<div className="p-empty" role="status">Загружаем страницу…</div>}><Routes>
    <Route path="/partner" element={<PartnerLanding />} />
    <Route path="/partner/apply" element={<PartnerApplication />} />
    <Route path="/partner/account" element={<PartnerLayout />}>
      <Route index element={<PartnerAccount />} />
      <Route path="referrals" element={<PartnerReferrals />} />
      <Route path="payouts" element={<PartnerPayouts />} />
      <Route path="details" element={<PartnerDetails />} />
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
