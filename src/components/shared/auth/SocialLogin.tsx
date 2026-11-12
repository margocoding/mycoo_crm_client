import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SiVk } from 'react-icons/si';
import { authApi, type OAuthProvider } from '@/api/auth.api';
import { errorMessage } from '@/api/base.api';
import { beginOAuthAttempt, type OAuthProviderId } from '@/lib/oauth';
import Button from '@/components/ui/Button';

export default function SocialLogin({ returnTo, disabled = false }: { returnTo?: string; disabled?: boolean }) {
  const location = useLocation();
  const [providers, setProviders] = useState<OAuthProvider[] | null>(null);
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void authApi.providers(controller.signal).then(setProviders).catch(() => {
      if (!controller.signal.aborted) setProviders([]);
    });
    return () => controller.abort();
  }, []);
  async function signIn(id: OAuthProviderId) {
    if (pending || disabled) return;
    setPending(id); setError('');
    try {
      const search = new URLSearchParams(location.search);
      for (const key of ['auth', 'mode', 'email', 'provider']) search.delete(key);
      const query = location.pathname === '/' ? '' : search.toString();
      const target = returnTo ?? location.pathname + (query ? '?' + query : '');
      const input = await beginOAuthAttempt(target);
      const result = await authApi.oauthStart(id, input);
      const destination = new URL(result.authorizationUrl);
      if (destination.protocol !== 'https:') throw new Error('Не удалось открыть страницу входа. Повторите попытку.');
      window.location.assign(destination.href);
    } catch (cause) { setError(errorMessage(cause)); setPending(null); }
  }
  return <div className="mt-7">
    <div className="flex items-center gap-4"><span className="h-px flex-1 bg-line/60" /><span className="text-xs text-fog/60">или войдите через</span><span className="h-px flex-1 bg-line/60" /></div>
    <div className="mt-4 grid grid-cols-2 gap-2.5">
      {(['yandex', 'vk'] as const).map((id) => {
        const provider = providers?.find((item) => item.id === id);
        const name = id === 'yandex' ? 'Яндекс ID' : 'VK ID';
        return <Button key={id} variant="secondary" disabled={disabled || Boolean(pending) || !provider?.enabled}
          onClick={() => void signIn(id)} className="!px-3 !py-3 !text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
          title={providers && !provider?.enabled ? 'Вход временно недоступен' : undefined}
          iconLeft={id === 'yandex' ? <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FC3F1D] font-bold text-white">Я</span>
            : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0077FF] text-white"><SiVk className="h-3.5 w-3.5" /></span>}>
          {pending === id ? 'Открываем…' : name}
        </Button>;
      })}
    </div>
    {providers && !providers.some((item) => item.enabled) && <p className="mt-3 text-xs text-fog">Вход через соцсети пока недоступен. Используйте email.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-crit">{error}</p>}
  </div>;
}
