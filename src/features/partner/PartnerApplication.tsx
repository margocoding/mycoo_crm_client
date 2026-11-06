import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight, LuCheck } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import type { PartnerApplication as Application } from './partner.types';
import { PartnerPublicFooter, PartnerPublicHeader } from './PartnerLayout';

export default function PartnerApplication() {
  const [params] = useSearchParams();
  const partner = usePartnerStore(state => state.partners.find(item => item.id === params.get('edit')));
  return <ApplicationForm key={partner?.id || 'new'} previous={partner?.status === 'rejected' ? partner : undefined} />;
}
function ApplicationForm({ previous }: { previous?: Application & { id: string; reviewNote: string } }) {
  const navigate = useNavigate();
  const { applyPartner, resubmitApplication } = usePartnerStore();
  const [form, setForm] = useState<Application>(previous || { name: '', email: '', company: '', channel: '', website: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function change(key: keyof Application, value: string) { setForm(state => ({ ...state, [key]: value })); setError(''); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const input = { name: form.name, email: form.email, company: form.company, channel: form.channel, website: form.website };
    const result = previous ? resubmitApplication(previous.id, input) : applyPartner(input);
    if (result.ok) navigate('/partner/account');
    else { setError(result.error); setBusy(false); }
  }
  return <div className="p-public"><PartnerPublicHeader /><main className="p-application"><div><Link className="p-muted" to="/partner"><LuArrowLeft aria-hidden="true" style={{ display: 'inline', marginRight: 8 }} />О программе</Link><h1>{previous ? 'Дополните заявку' : 'Давайте знакомиться'}</h1><p>Расскажите немного о себе и своих клиентах. После рассмотрения заявки в кабинете появится партнёрская ссылка.</p><ul className="p-rule-list"><li><LuCheck aria-hidden="true" /><span>Персональная ссылка для приглашений</span></li><li><LuCheck aria-hidden="true" /><span>История оплат и начислений</span></li><li><LuCheck aria-hidden="true" /><span>Запросы выплат с понятным статусом</span></li></ul></div><section className="p-panel"><div className="p-panel-head"><h2>Заявка партнёра</h2></div>{previous?.reviewNote && <div className="p-notice warning" style={{ marginBottom: 20 }}>{previous.reviewNote}</div>}<form className="p-form" onSubmit={submit}><label className="p-field"><span>Имя и фамилия</span><input autoComplete="name" maxLength={120} required value={form.name} onChange={event => change('name', event.target.value)} placeholder="Как к вам обращаться" /></label><label className="p-field"><span>Email</span><input type="email" autoComplete="email" maxLength={150} required value={form.email} onChange={event => change('email', event.target.value)} placeholder="name@company.ru" /></label><label className="p-field"><span>Компания <small>· необязательно</small></span><input autoComplete="organization" maxLength={150} value={form.company} onChange={event => change('company', event.target.value)} placeholder="Название компании или проекта" /></label><label className="p-field"><span>Как планируете рекомендовать MyCoo?</span><textarea required maxLength={500} value={form.channel} onChange={event => change('channel', event.target.value)} placeholder="Например, консультирую небольшие команды и помогаю наладить работу с задачами" /></label><label className="p-field"><span>Сайт или профиль <small>· необязательно</small></span><input type="url" maxLength={500} value={form.website} onChange={event => change('website', event.target.value)} placeholder="https://" /></label>{error && <p role="alert" className="p-notice warning">{error}</p>}<button className="p-button primary" type="submit" disabled={busy}>{busy ? 'Отправляем…' : previous ? 'Отправить повторно' : 'Отправить заявку'}<LuArrowRight aria-hidden="true" /></button></form></section></main><PartnerPublicFooter /></div>;
}
