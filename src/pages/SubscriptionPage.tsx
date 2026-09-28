import { Link, Navigate } from 'react-router-dom';
import SubscriptionContent from '@/components/shared/billing/SubscriptionContent';
import { useAuthStore } from '@/store/auth.store';
import { useLaunchStore } from '@/store/launch.store';

export default function SubscriptionPage() {
  const { user, isLoading, clearSession } = useAuthStore();
  const hasAccess = useLaunchStore(s => s.trialActive);
  if (isLoading) return <div role="status" className="min-h-screen bg-void p-8 text-fog">Загружаем подписку…</div>;
  if (!user) return <Navigate to="/?auth=true" replace />;
  return <main className="min-h-screen bg-void px-4 py-8 text-mist">
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-snow">Подписка MyCOO</h1>
        <div className="flex flex-wrap gap-4 text-sm text-flux">{hasAccess && <Link to="/dashboard/main">В рабочее пространство</Link>}<Link to="/">На сайт</Link><button onClick={clearSession}>Выйти</button></div>
      </div>
      <div className="glass rounded-xl border border-line"><SubscriptionContent /></div>
    </div>
  </main>;
}
