import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Logo } from '@/components/icons';
import Button from '@/components/ui/Button';
import PasswordFields from '@/components/shared/auth/register/PasswordFields';
import { teamApi } from '@/api/team.api';
import { ApiError, errorMessage } from '@/api/base.api';
import { useAuthStore } from '@/store/auth.store';
import { useLaunchStore } from '@/store/launch.store';
import { passwordRules } from '@/lib/password';
import { ROLE_LABELS, type InvitationInfo } from '@/types/team.types';

export default function InvitationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setInfo(null); setError(''); setPassword(''); setConfirmation('');
    teamApi.invitation(token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setInfo(data);
    }).catch((error) => {
      if (!controller.signal.aborted) setError(errorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, retry]);
  const valid = info?.existingAccount ? password.length > 0
    : passwordRules(password).every((r) => r.ok) && password === confirmation;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current || !valid) return;
    busy.current = true; setPending(true); setError('');
    try {
      const session = await teamApi.accept(token, password);
      useLaunchStore.getState().reset();
      localStorage.setItem('mycoo_workspace:' + session.user.id, session.workspaceId);
      useAuthStore.getState().saveSession(session.accessToken, session.user);
      navigate('/dashboard/main', { replace: true });
    } catch (error) {
      setError(errorMessage(error));
      if (error instanceof ApiError && [404, 410].includes(error.status)) setInfo(null);
    } finally { busy.current = false; setPending(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-void px-4 py-10 text-mist">
    <div className="glass corner w-full max-w-lg rounded-xl border border-line p-6 md:p-8">
      <Link to="/" className="inline-flex items-center gap-3 text-snow"><Logo className="h-8 w-8" />
        <span className="font-display text-sm font-bold tracking-[0.2em]">MYCOO</span></Link>
      <p className="mono-label mt-8 text-flux">Приглашение в команду</p>
      {loading ? <p role="status" className="mt-5 text-fog">Проверка приглашения…</p> : info ? <>
        <h1 className="mt-3 break-words font-display text-2xl font-bold text-snow">{info.company}</h1>
        <p className="mt-3 text-sm leading-relaxed text-fog">{info.invitedBy} приглашает вас в департамент «{info.department}».</p>
        <p className="mt-2 text-sm text-ion">{ROLE_LABELS[info.role]}</p>
        <div className="mt-6 border-t border-line pt-6">
          <h2 className="font-display text-lg font-semibold text-snow">{info.existingAccount ? 'Введите пароль аккаунта' : 'Придумайте пароль'}</h2>
          <p className="mt-2 break-all text-sm text-fog">{info.email}</p>
          {info.existingAccount && <p className="mt-2 text-xs leading-relaxed text-fog">Аккаунт уже существует. Используйте действующий пароль, чтобы присоединиться к компании.</p>}
          <form onSubmit={submit} className="mt-5">
            <PasswordFields idPrefix="invite" mode={info.existingAccount ? 'login' : 'register'}
              password={password} confirmation={confirmation} onPasswordChange={(value) => { setPassword(value); setError(''); }}
              onConfirmationChange={setConfirmation} disabled={pending} />
            {error && <p role="alert" className="mt-4 text-sm text-crit">{error}</p>}
            <Button type="submit" tone="flux" className="mt-6 w-full" disabled={pending || !valid}>
              {pending ? 'Вход в компанию…' : 'Присоединиться к команде'}
            </Button>
          </form>
        </div>
      </> : <div className="mt-5">
        <h1 className="font-display text-xl font-bold text-snow">Приглашение недоступно</h1>
        <p role="alert" className="mt-3 text-sm leading-relaxed text-fog">{error}</p>
        <Button variant="secondary" className="mt-5" onClick={() => setRetry((v) => v + 1)}>Проверить ещё раз</Button>
      </div>}
    </div>
  </main>;
}
