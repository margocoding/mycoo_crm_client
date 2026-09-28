import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuCheck, LuCopy } from 'react-icons/lu';
import { billingApi } from '@/api/billing.api';
import { errorMessage } from '@/api/base.api';
import { useAuthStore } from '@/store/auth.store';
import { useLaunch, useLaunchStore } from '@/store/launch.store';
import { useModalRouter } from '@/hooks/useModalRouter';
import type { BillingAccount, BillingCatalog, BillingPeriod, PlanId } from '@/types/billing.types';

const button = 'rounded-lg border border-line px-4 py-2.5 text-sm text-mist hover:border-flux/50 disabled:cursor-not-allowed disabled:opacity-50';
const formatPrice = (kopecks: number) => (kopecks / 100).toLocaleString('ru-RU');

export default function SubscriptionContent() {
  const user = useAuthStore(s => s.user);
  const workspace = useLaunchStore(s => s.workspace);
  return <Content key={`${user?.id}:${workspace?.id}`} />;
}

function Content() {
  const { launch } = useLaunch();
  const user = useAuthStore(s => s.user);
  const workspace = useLaunchStore(s => s.workspace);
  const { openModal } = useModalRouter();
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [params] = useSearchParams();
  const [plan, setPlan] = useState<PlanId>(() => {
    const requested = params.get('plan');
    return requested === 'START' || requested === 'ENTERPRISE' ? requested : 'MISSION';
  });
  const [period, setPeriod] = useState<BillingPeriod>('MONTH');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestKey = useRef<{ selection: string; key: string } | null>(null);
  const paying = useRef(false);
  const canManage = !workspace || workspace.ownerId === user?.id;
  const subscription = workspace?.subscription ?? account?.subscription;

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    Promise.all([billingApi.plans(controller.signal), user ? billingApi.me(controller.signal) : Promise.resolve(null)])
      .then(([plans, me]) => { if (!controller.signal.aborted) { setCatalog(plans); setAccount(me); } })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); });
    return () => controller.abort();
  }, [user?.id, revision]);

  const reload = () => { setRevision(r => r + 1); if (user) void useLaunchStore.getState().loadWorkspace(true); };
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') {
      setRevision(r => r + 1); void useLaunchStore.getState().loadWorkspace(true);
    } }, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  async function pay() {
    if (!user) { openModal('auth', { step: 'email' }); return; }
    if (paying.current || !catalog?.paymentsAvailable || !canManage) return;
    paying.current = true; setBusy(true); setError('');
    const selection = `${plan}:${period}`;
    if (requestKey.current?.selection !== selection) requestKey.current = { selection, key: crypto.randomUUID() };
    try {
      const result = await billingApi.checkout(plan, period, requestKey.current.key, workspace?.id);
      const url = new URL(result.checkoutUrl);
      if (url.protocol !== 'https:') throw new Error('Некорректная ссылка оплаты.');
      window.location.assign(url.toString());
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); paying.current = false; }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(account!.referral.url); setNotice('Ссылка скопирована.'); }
    catch { setNotice('Выделите и скопируйте ссылку из поля.'); }
  }

  return <div className="space-y-6 p-5 md:p-6">
    {subscription && <section className="rounded-lg border border-line/50 bg-hull/20 p-4">
      <h2 className="font-display text-lg font-bold text-snow">{subscription.status === 'EXPIRED' ? 'Срок доступа закончился'
        : subscription.status === 'TRIAL' ? 'Пробный период' : subscription.status === 'PAID' ? `Подписка${subscription.planName ? ` «${subscription.planName}»` : ''}` : 'Пробный период ещё не начался'}</h2>
      <p className="mt-2 text-sm text-fog">{subscription.activeUntil
        ? `Доступ ${subscription.hasAccess ? 'до' : 'закончился'} ${new Date(subscription.activeUntil).toLocaleString('ru-RU')}. Осталось дней: ${subscription.daysRemaining}.`
        : `Пробный период — ${catalog?.trialDays ?? 10} дней после диагностики.`}</p>
      {!canManage && <p className="mt-2 text-sm text-warn">Подпиской компании управляет собственник. Попросите его продлить доступ.</p>}
      {user && canManage && subscription.status === 'NOT_STARTED' && <button onClick={launch} className="mt-3 text-sm text-flux underline">Начать пробный период</button>}
    </section>}

    {error && <div role="alert" className="rounded-lg border border-crit/40 p-3 text-sm text-crit">{error} <button className="underline" onClick={reload}>Повторить</button></div>}
    {!catalog && !error && <p role="status" className="text-fog">Загружаем тарифы…</p>}
    {catalog && <>
      <div className="flex flex-wrap justify-center gap-3" aria-label="Период подписки">
        <button className={`${button} ${period === 'MONTH' ? 'bg-flux/15 border-flux/50' : ''}`} aria-pressed={period === 'MONTH'} onClick={() => setPeriod('MONTH')}>Месяц</button>
        <button className={`${button} ${period === 'YEAR' ? 'bg-flux/15 border-flux/50' : ''}`} aria-pressed={period === 'YEAR'} onClick={() => setPeriod('YEAR')}>Год · 2 месяца в подарок</button>
      </div>
      <p className="text-center text-sm text-fog">Платите за 10 месяцев, получайте 12 месяцев доступа.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {catalog.plans.map(item => <button key={item.id} aria-pressed={plan === item.id} onClick={() => setPlan(item.id)}
          className={`relative flex flex-col rounded-lg border p-4 text-left transition-colors ${plan === item.id ? 'border-flux/60 bg-flux/10' : item.recommended ? 'border-flux/40 bg-hull/20 hover:border-flux/60' : 'border-line/50 bg-hull/20 hover:border-flux/30'}`}>
          <span className="mb-2 min-h-4 font-mono text-[9px] font-bold uppercase tracking-wider text-flux">{item.recommended ? 'Популярный' : '\u00a0'}</span>
          <span className="font-mono text-[10px] uppercase text-fog">{item.outcome}</span>
          <h3 className="mt-2 font-display font-bold text-snow">{item.name}</h3>
          <p className="mt-1 mb-4 flex-1 text-xs leading-relaxed text-fog">{item.promise}</p>
          <p className="text-xl font-bold text-flux">{formatPrice(period === 'MONTH' ? item.monthKopecks : item.yearKopecks)} ₽</p>
          <p className="text-xs text-fog">за {period === 'MONTH' ? 'месяц' : 'год'}</p>
          {plan === item.id && <LuCheck className="absolute right-3 top-3 text-flux" />}
        </button>)}
      </div>
      <div className="space-y-2">
        <h3 className="font-display font-bold text-snow">{catalog.plans.find(p => p.id === plan)?.tagline}</h3>
        <p className="text-sm leading-relaxed text-fog">«{catalog.plans.find(p => p.id === plan)?.description}»</p>
      </div>
      <ul className="space-y-2 text-sm text-fog">{catalog.plans.find(p => p.id === plan)?.features.map(feature =>
        <li key={feature} className="flex gap-2"><LuCheck className="shrink-0 text-ok" />{feature}</li>)}</ul>
      <div className="rounded-lg border border-line/40 p-4">
        <button onClick={pay} disabled={busy || Boolean(user && (!canManage || !catalog.paymentsAvailable))}
          className="rounded-lg bg-flux px-5 py-3 text-sm font-bold text-void disabled:cursor-not-allowed disabled:opacity-50">
          {!user ? 'Войти для оформления' : busy ? 'Готовим оплату…' : 'Купить подписку'}</button>
        {!catalog.paymentsAvailable && <p className="mt-3 text-sm text-fog">Оплата скоро станет доступна. Пока можно продлить доступ по реферальной программе.</p>}
      </div>
    </>}

    {account && <section className="rounded-lg border border-ion/40 bg-ion/5 p-4">
      <h2 className="font-display font-bold text-snow">Приглашайте друзей — получайте +30 дней</h2>
      <p className="mt-2 text-sm leading-relaxed text-fog">За каждого нового пользователя, который зарегистрируется по вашей ссылке и подтвердит email, вы получите {account.referral.daysPerRegistration} дней доступа. Если срок закончился, 30 дней отсчитываются с регистрации друга.</p>
      {!canManage && <p className="mt-2 text-sm text-warn">Бонус начисляется вашему аккаунту. Для продления доступа этой компании нужна ссылка её собственника.</p>}
      <label htmlFor="referral-link" className="mt-4 block text-xs text-fog">Ваша реферальная ссылка</label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input id="referral-link" readOnly value={account.referral.url} onFocus={e => e.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-line bg-void/60 px-3 py-2 text-sm text-mist" />
        <button className={button} onClick={copy} aria-label="Скопировать реферальную ссылку"><LuCopy /></button>
      </div>
      <p className="mt-3 text-sm text-fog">Регистраций: {account.referral.registrations} · Начислено: {account.referral.earnedDays} дней</p>
      {account.referral.pendingDays > 0 && <p className="mt-2 text-sm text-flux">{account.referral.pendingDays} бонусных дней добавятся при запуске вашего пробного периода.</p>}
      <p role="status" className="mt-2 text-xs text-ok">{notice}</p>
      <button className="mt-2 text-sm text-flux underline" onClick={reload}>Обновить срок и начисления</button>
    </section>}
  </div>;
}
