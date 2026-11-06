import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight, LuCheck } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { PartnerPublicFooter, PartnerPublicHeader } from './PartnerLayout';

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const registerPartner = usePartnerStore(state => state.registerPartner);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = registerPartner({ name, email, company, channel: '', website: '' });
    if (result.ok) navigate('/partner/account', { replace: true });
    else { setError(result.error); setBusy(false); }
  }

  return <div className="p-public">
    <PartnerPublicHeader />
    <main className="p-registration">
      <div>
        <Link className="p-muted" to="/partner"><LuArrowLeft aria-hidden="true" style={{ display: 'inline', marginRight: 8 }} />О программе</Link>
        <h1>Станьте партнёром MyCoo</h1>
        <p>Участвовать может каждый. Укажите имя и email — кабинет и партнёрская ссылка будут доступны сразу.</p>
        <ul className="p-rule-list">
          <li><LuCheck aria-hidden="true" /><span>Персональная ссылка для приглашений</span></li>
          <li><LuCheck aria-hidden="true" /><span>История оплат и начислений</span></li>
          <li><LuCheck aria-hidden="true" /><span>Запросы выплат с понятным статусом</span></li>
        </ul>
      </div>
      <section className="p-panel">
        <div className="p-panel-head"><h2>Ваш профиль</h2></div>
        <form className="p-form" onSubmit={submit}>
          <label className="p-field"><span>Имя и фамилия</span><input autoComplete="name" maxLength={120} required value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="Как к вам обращаться" /></label>
          <label className="p-field"><span>Email</span><input type="email" autoComplete="email" maxLength={150} required value={email} onChange={event => { setEmail(event.target.value); setError(''); }} placeholder="name@example.ru" /></label>
          <label className="p-field"><span>Компания <small>· необязательно</small></span><input autoComplete="organization" maxLength={150} value={company} onChange={event => { setCompany(event.target.value); setError(''); }} placeholder="Название компании или проекта" /></label>
          {error && <p role="alert" className="p-notice warning">{error}</p>}
          <button className="p-button primary" type="submit" disabled={busy}>{busy ? 'Создаём профиль…' : 'Стать партнёром'}<LuArrowRight aria-hidden="true" /></button>
        </form>
      </section>
    </main>
    <PartnerPublicFooter />
  </div>;
}
