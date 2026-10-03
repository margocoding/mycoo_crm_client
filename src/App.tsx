import { Route, Routes, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import TasksPage from "./pages/TasksPage";
import AIChatPage from "./components/shared/dashboard/ai/AIChatPage";
import CallsPage from "./pages/CallsPage";
import { AuthOverlay } from "./components/shared/auth/register/AuthOverlay";
import { OnboardingOverlay } from "./components/shared/auth/register/Onboarding/Onboarding";
import { DiagnosticsOverlay } from "./components/shared/auth/register/Diagnostics";
import SessionBootstrap from "./components/layout/SessionBootstrap";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import SubscriptionModal from "./components/ui/SubscriptionModal";
import TeamPage from "./pages/TeamPage";
import InvitationPage from "./pages/InvitationPage";
import NotificationsPage from './pages/NotificationsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import { useModalRouter } from "./hooks/useModalRouter";

export default function App() {
  const { state, closeModal } = useModalRouter();
  const location = useLocation();
  if (import.meta.env.DEV && location.pathname === "/preview/meetings") {
    return (
      <main className="min-h-screen bg-void px-4 py-6 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
            <span className="font-display text-sm font-bold tracking-widest text-snow">
              MYCOO <span className="ml-3 text-fog">/ ВСТРЕЧИ</span>
            </span>
            <span className="text-xs text-fog">Локальный просмотр</span>
          </div>
          <CallsPage preview />
        </div>
      </main>
    );
  }
  return (
    <div>
      <SessionBootstrap />
      <SubscriptionModal isOpen={state.modal === "subscription"} onClose={closeModal} />
      <AuthOverlay />
      <OnboardingOverlay />
      <DiagnosticsOverlay />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/invite/:token" element={<InvitationPage />} />
        <Route path="/dashboard/notifications" element={
          <ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/team/:departmentId?" element={
          <ProtectedRoute><DashboardLayout><TeamPage /></DashboardLayout></ProtectedRoute>
        } />
        <Route
          path="/dashboard/main"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks/:departmentId?"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TasksPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ai"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AIChatPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/calls"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CallsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
