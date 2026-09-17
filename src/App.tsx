import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { TasksProvider } from "./context/TasksContext";
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
import { useModalRouter } from "./hooks/useModalRouter";

export default function App() {
  const { state, closeModal } = useModalRouter();
  return (
    <div>
      <SessionBootstrap />
      <SubscriptionModal isOpen={state.modal === "subscription"} onClose={closeModal} />
      <AuthOverlay />
      <OnboardingOverlay />
      <DiagnosticsOverlay />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/invite/:token" element={<InvitationPage />} />
        <Route path="/dashboard/team/:departmentId?" element={
          <ProtectedRoute><DashboardLayout><TeamPage /></DashboardLayout></ProtectedRoute>
        } />
        <Route
          path="/dashboard/main"
          element={
            <ProtectedRoute><TasksProvider>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </TasksProvider></ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute><TasksProvider>
              <DashboardLayout>
                <TasksPage />
              </DashboardLayout>
            </TasksProvider></ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ai"
          element={
            <ProtectedRoute><TasksProvider>
              <DashboardLayout>
                <AIChatPage />
              </DashboardLayout>
            </TasksProvider></ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/calls"
          element={
            <ProtectedRoute><TasksProvider>
              <DashboardLayout>
                <CallsPage />
              </DashboardLayout>
            </TasksProvider></ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
