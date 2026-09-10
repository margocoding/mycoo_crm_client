import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useLaunchStore } from "@/store/launch.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useModalRouter } from "@/hooks/useModalRouter";

export default function SessionBootstrap() {
  const auth = useAuthStore();
  const workspace = useLaunchStore();
  const { state, openModal } = useModalRouter();

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
