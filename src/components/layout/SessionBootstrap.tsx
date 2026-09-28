import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useLaunchStore } from "@/store/launch.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useModalRouter } from "@/hooks/useModalRouter";
import { useLocation } from 'react-router-dom';
import { captureReferral } from '@/lib/referral';

export default function SessionBootstrap() {
  const auth = useAuthStore();
  const workspace = useLaunchStore();
  const { state, openModal } = useModalRouter();
  const { search } = useLocation();

  useEffect(() => { captureReferral(search); }, [search]);

  useEffect(() => {
    if (!auth.user) return;
    const refresh = () => { void useLaunchStore.getState().loadWorkspace(true); };
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('mycoo:subscription-expired', refresh);
    window.addEventListener('focus', onFocus);
    const end = workspace.workspace?.subscription?.activeUntil;
    let timer: number | undefined;
    const schedule = () => {
      const delay = end ? Date.parse(end) - Date.now() : 0;
      if (delay > 0) timer = window.setTimeout(() => { refresh(); schedule(); }, Math.min(delay + 100, 2147483647));
    };
    schedule();
    return () => {
      window.removeEventListener('mycoo:subscription-expired', refresh);
      window.removeEventListener('focus', onFocus);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [auth.user?.id, workspace.workspace?.subscription?.activeUntil, workspace.workspace?.id]);

  useEffect(() => {
    const expire = () => useAuthStore.getState().clearSession();
    window.addEventListener("mycoo:session-expired", expire);
    void useAuthStore.getState().loadSession();
    return () => window.removeEventListener("mycoo:session-expired", expire);
  }, []);

  useEffect(() => {
    if (auth.user) void useLaunchStore.getState().loadWorkspace();
    else if (!auth.isLoading && !auth.error) {
      useLaunchStore.getState().reset();
      useOnboardingStore.getState().reset();
    }
  }, [auth.user?.id, auth.isLoading, auth.error]);

  useEffect(() => {
    if (!auth.isLoading && !auth.error && !auth.user && (state.modal === "onboarding" || state.modal === "diagnostics")) {
      openModal("auth", { step: "email" });
    }
  }, [auth.isLoading, auth.error, auth.user, state.modal, openModal]);

  const error = auth.error || workspace.error;
  if (!error) return null;
  return <div role="alert" className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-xl rounded-lg border border-crit/50 bg-void p-4 text-sm text-mist">
    <p>{error}</p>
    <button className="mt-3 text-flux" disabled={auth.isLoading || workspace.loading}
      onClick={() => { void (auth.error ? auth.loadSession() : workspace.loadWorkspace()); }}>Повторить</button>
  </div>;
}
