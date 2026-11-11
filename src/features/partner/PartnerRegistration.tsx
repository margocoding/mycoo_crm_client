import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight, LuCheck } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { useAuthStore } from '../../store/auth.store';
import { PartnerAuthForm } from './PartnerLogin';
import { PartnerPublicFooter, PartnerPublicHeader } from './PartnerLayout';

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const { registerPartner, partnerAuthenticated, currentPartnerId } = usePartnerStore();
  const user = useAuthStore(state => state.user);
  const [name, setName] = useState(user?.name ?? '');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await registerPartner({ name, company, channel: '', website: '' });
    if (result.ok) navigate('/partner/account', { replace: true });
    else { setError(result.error); setBusy(false); }
  }

  if (partnerAuthenticated && currentPartnerId) return <Navigate to="/partner/account" replace />;
  return <div className="p-public">
    <PartnerPublicHeader />
    <main className="p-registration">
      <div>
        <Link className="p-muted" to="/partner"><LuArrowLeft aria-hidden="true" style={{ display: 'inline', marginRight: 8 }} />О программе</Link>
        <h1>Станьте партнёром MyCoo</h1>
        <p>Участвовать может каждый. Войдите в аккаунт и заполните профиль — партнёрская ссылка появится сразу.</p>
        <ul className="p-rule-list">
          <li><LuCheck aria-hidden="true" /><span>Персональная ссылка для приглашений</span></li>
          <li><LuCheck aria-hidden="true" /><span>История оплат и начислений</span></li>
          <li><LuCheck aria-hidden="true" /><span>Запросы выплат с понятным статусом</span></li>
        </ul>
      </div>
      <section className="p-panel">
        <div className="p-panel-head"><h2>Ваш профиль</h2></div>
        {!partnerAuthenticated ? <PartnerAuthForm /> : <form className="p-form" onSubmit={submit}>
          <label className="p-field"><span>Имя и фамилия</span><input autoComplete="name" maxLength={120} required value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="Как к вам обращаться" /></label>
          <label className="p-field"><span>Email аккаунта</span><input type="email" value={user?.email ?? ''} readOnly /></label>
          <label className="p-field"><span>Компания <small>· необязательно</small></span><input autoComplete="organization" maxLength={150} value={company} onChange={event => { setCompany(event.target.value); setError(''); }} placeholder="Название компании или проекта" /></label>
          {error && <p role="alert" className="p-notice warning">{error}</p>}
          <button className="p-button primary" type="submit" disabled={busy}>{busy ? 'Создаём профиль…' : 'Стать партнёром'}<LuArrowRight aria-hidden="true" /></button>
        </form>}
      </section>
    </main>
    <PartnerPublicFooter />
  </div>;
}
