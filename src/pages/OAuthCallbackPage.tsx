import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, type OAuthExchange } from '@/api/auth.api';
import { errorMessage } from '@/api/base.api';
import { clearOAuthAttempt, currentOAuthAttempt, safeReturnTo } from '@/lib/oauth';
import { clearReferral } from '@/lib/referral';
import { useAuthStore } from '@/store/auth.store';
import { useLaunchStore } from '@/store/launch.store';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/icons';
import DashboardBackground from '@/components/layout/DashboardBackground';

const exchanges = new Map<string, Promise<OAuthExchange>>();
function exchangeOnce(ticket: string, codeVerifier: string) {
  const key = ticket + ':' + codeVerifier;
  let request = exchanges.get(key);
  if (!request) {
    request = authApi.oauthExchange({ ticket, codeVerifier });
    exchanges.set(key, request);
    void request.finally(() => { setTimeout(() => exchanges.delete(key), 1000); }).catch(() => {});
  }
  return request;
}

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ticket = params.get('ticket') || '';
  const [attempt] = useState(currentOAuthAttempt);
  const [phase, setPhase] = useState<'loading' | 'email' | 'code' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const completed = useRef(false);
  const submitBusy = useRef(false);
  async function finish(result: OAuthExchange) {
    if ('requiresEmail' in result) { setEmail(result.email || ''); setPhase('email'); return; }
    if (completed.current) return;
    completed.current = true;
    useLaunchStore.getState().reset();
    useAuthStore.getState().saveSession(result.accessToken, result.user);
    clearReferral(); clearOAuthAttempt();
    const returnTo = safeReturnTo(result.returnTo || attempt?.returnTo);
    if (returnTo !== '/') { navigate(returnTo, { replace: true }); return; }
    await useLaunchStore.getState().loadWorkspace();
    const state = useLaunchStore.getState();
    navigate(state.error ? '/' : state.trialActive ? '/dashboard/main' : state.workspace?.diagnosticsComplete ? '/subscription'
      : state.workspace?.onboardingComplete ? '/?diagnostics=true' : '/?onboarding=true', { replace: true });
  }
  useEffect(() => {
    let active = true;
    if (!ticket || !attempt) {
      setError(params.has('error') ? 'Не удалось войти через выбранный сервис. Попробуйте ещё раз или используйте email.'
        : 'Время входа истекло. Начните вход заново в этой вкладке.');
      setPhase('error'); return;
    }
    void exchangeOnce(ticket, attempt.codeVerifier).then((result) => { if (active) void finish(result); })
      .catch((cause) => { if (active) { setError(errorMessage(cause)); setPhase('error'); } });
    return () => { active = false; };
  }, [ticket, attempt]);
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (submitBusy.current || remaining || !email.trim()) return;
    submitBusy.current = true; setPending(true); setError('');
    try { await authApi.checkEmail(email.trim()); setCode(''); setPhase('code'); setRemaining(60); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { submitBusy.current = false; setPending(false); }
  }
  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!attempt || submitBusy.current || !/^\d{6}$/.test(code)) return;
    submitBusy.current = true; setPending(true); setError('');
    try { await finish(await authApi.oauthExchange({ ticket, codeVerifier: attempt.codeVerifier, email: email.trim(), code })); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { submitBusy.current = false; setPending(false); }
  }
  return <main className="relative isolate flex min-h-dvh items-center justify-center px-4 py-8 text-mist">
    <DashboardBackground />
    <section className="glass w-full max-w-md rounded-xl border border-line p-6 sm:p-8">
      <Link to="/" className="inline-flex items-center gap-3 text-snow"><Logo className="h-8 w-8" /><span className="font-display text-sm font-bold tracking-[0.2em]">MYCOO</span></Link>
      <h1 className="mt-7 font-display text-2xl font-semibold text-snow">{phase === 'loading' ? 'Завершаем вход…' : phase === 'error' ? 'Вход не завершён' : 'Подтвердите email'}</h1>
      {phase === 'loading' && <p role="status" className="mt-4 text-sm text-fog">Подключаем ваш аккаунт.</p>}
      {phase === 'email' && <form onSubmit={sendCode} className="mt-4 space-y-4">
        <p className="text-sm leading-relaxed text-fog">Укажите рабочий email. Если у вас уже есть аккаунт MyCoo, используйте его адрес — так сохранятся ваша компания и данные.</p>
        <label className="block text-sm">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} className="mt-2 block w-full rounded-md border border-line bg-void px-3 py-3 text-snow outline-none focus:border-flux" /></label>
        <Button type="submit" tone="flux" disabled={pending} className="w-full">{pending ? 'Отправляем…' : 'Получить код'}</Button>
      </form>}
      {phase === 'code' && <form onSubmit={confirm} className="mt-4 space-y-4">
        <p className="break-words text-sm text-fog">Код отправлен на {email}.</p>
        <label className="block text-sm">Код из письма<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} disabled={pending} className="mt-2 block w-full rounded-md border border-line bg-void px-3 py-3 font-mono tracking-[0.3em] text-snow outline-none focus:border-flux" /></label>
        <Button type="submit" tone="flux" disabled={pending || code.length !== 6} className="w-full">{pending ? 'Проверяем…' : 'Войти'}</Button>
        <div className="flex flex-wrap justify-between gap-3 text-xs text-fog">
          <button type="button" disabled={pending} onClick={() => { setPhase('email'); setError(''); setRemaining(0); }}>Другой email</button>
          <button type="button" disabled={pending || remaining > 0} onClick={() => void sendCode()}>{remaining ? `Повторно через ${remaining} с` : 'Отправить код ещё раз'}</button>
        </div>
      </form>}
      {error && <p role="alert" className="mt-4 text-sm text-crit">{error}</p>}
      {phase === 'error' && <Link to="/?auth=email" className="mt-6 inline-block text-sm text-flux">Вернуться ко входу</Link>}
    </section>
  </main>;
}
