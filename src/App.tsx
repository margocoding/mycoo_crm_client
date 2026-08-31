import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { LaunchProvider } from "./components/shared/auth/register/Register";
import { TasksProvider } from "./context/TasksContext";
import "./index.css";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import TasksPage from "./pages/TasksPage";
import AIChatPage from "./components/shared/dashboard/ai/AIChatPage";
import CallsPage from "./pages/CallsPage";

export default function App() {
  return (
    <LaunchProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard/main"
          element={
            <TasksProvider>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </TasksProvider>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <TasksProvider>
              <DashboardLayout>
                <TasksPage />
              </DashboardLayout>
            </TasksProvider>
          }
        />
        <Route
          path="/dashboard/ai"
          element={
            <TasksProvider>
              <DashboardLayout>
                <AIChatPage />
              </DashboardLayout>
            </TasksProvider>
          }
        />
        <Route
          path="/dashboard/calls"
          element={
            <TasksProvider>
              <DashboardLayout>
                <CallsPage />
              </DashboardLayout>
            </TasksProvider>
          }
        />
      </Routes>
    </LaunchProvider>
  );
}