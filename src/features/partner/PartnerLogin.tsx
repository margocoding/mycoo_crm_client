import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { authApi } from '../../api/auth.api';
import { errorMessage } from '../../api/base.api';
import { useAuthStore } from '../../store/auth.store';
import { usePartnerStore } from './partner.store';
import { PartnerPublicFooter, PartnerPublicHeader } from './PartnerLayout';

export function PartnerAuthForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      if (!mode) {
        const result = await authApi.checkEmail(email.trim());
        setMode(result.success ? 'login' : 'register');
        setNotice('Код отправлен на вашу почту.');
      } else {
        if (mode === 'register' && password !== confirmation) { setError('Пароли не совпадают.'); return; }
        const result = await authApi[mode](email.trim(), password, code.trim());
        useAuthStore.getState().saveSession(result.accessToken, result.user);
        await usePartnerStore.getState().load('partner');
        const state = usePartnerStore.getState();
        if (state.loadError) { setError(state.loadError); return; }
        navigate(state.currentPartnerId ? '/partner/account' : '/partner/register', { replace: true });
      }
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await authApi.resendCode(email.trim()); setNotice('Новый код отправлен.'); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="p-form">
    <p className="p-muted">Если у вас уже есть аккаунт MyCoo, используйте тот же email и пароль.</p>
    <label className="p-field"><span>Email</span><input type="email" autoComplete="email" required maxLength={150} value={email} readOnly={Boolean(mode)} onChange={event => setEmail(event.target.value)} /></label>
    {mode && <>
      <button className="p-button small" type="button" disabled={busy} onClick={() => { setMode(null); setCode(''); setPassword(''); setConfirmation(''); setNotice(''); setError(''); }}>Другой email</button>
      <label className="p-field"><span>Код из письма</span><input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} /></label>
      <label className="p-field"><span>{mode === 'register' ? 'Придумайте пароль' : 'Пароль от MyCoo'}</span><input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {mode === 'register' && <small className="p-muted">От 8 до 128 символов: строчные и заглавные буквы и хотя бы одна цифра.</small>}
      {mode === 'register' && <label className="p-field"><span>Повторите пароль</span><input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
    </>}
    {notice && <p className="p-notice success" role="status">{notice}</p>}
    {error && <p className="p-notice warning" role="alert">{error}</p>}
    <button className="p-button primary" type="submit" disabled={busy}>{busy ? 'Подождите…' : !mode ? 'Получить код' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}<LuArrowRight aria-hidden="true" /></button>
    {mode && <button className="p-button" type="button" disabled={busy} onClick={() => void resend()}>Отправить код повторно</button>}
  </form>;
}

export default function PartnerLogin() {
  const { partnerAuthenticated, currentPartnerId } = usePartnerStore();
  if (partnerAuthenticated) return <Navigate to={currentPartnerId ? '/partner/account' : '/partner/register'} replace />;
  return <div className="p-public"><PartnerPublicHeader /><main className="p-auth p-panel"><h1>Кабинет партнёра</h1><p className="p-muted">Войдите или создайте аккаунт, чтобы участвовать в программе.</p><PartnerAuthForm /><p className="p-muted"><Link to="/partner">О программе</Link></p></main><PartnerPublicFooter /></div>;
}
