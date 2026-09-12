import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useLaunchStore } from "@/store/launch.store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useAuthStore();
  const workspace = useLaunchStore();
  if (error || workspace.error) return <div className="min-h-screen bg-void" />;
  if (isLoading || (user && (workspace.loading || workspace.loadedFor !== user.id))) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-void text-fog">Проверка доступа…</div>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (!workspace.trialActive) return <Navigate to={workspace.workspace?.onboardingComplete ? "/?diagnostics=true" : "/?onboarding=true"} replace />;
  return <>{children}</>;
}
