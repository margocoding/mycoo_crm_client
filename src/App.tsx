import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { LaunchProvider } from "./components/shared/auth/register/Register";
import { TasksProvider } from "./context/TasksContext";
import "./index.css";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import TasksPage from "./pages/TasksPage";
import AIChatPage from "./components/shared/dashboard/ai/AIChatPage";


// Dashboard wrapper with layout and tasks context
function DashboardWithLayout() {
  return (
    <TasksProvider>
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    </TasksProvider>
  );
}

// Tasks page wrapper with layout
function TasksWithLayout() {
  return (
    <TasksProvider>
      <DashboardLayout>
        <TasksPage />
      </DashboardLayout>
    </TasksProvider>
  );
}

// AI Chat page wrapper with layout
function AIChatWithLayout() {
  return (
    <TasksProvider>
      <DashboardLayout>
        <AIChatPage />
      </DashboardLayout>
    </TasksProvider>
  );
}

export default function App() {
  return (
    <LaunchProvider>
      <Routes>
        {/* Публичный маршрут - лендинг */}
        <Route path="/" element={<LandingPage />} />
        
        
        <Route
          path="/dashboard/main"
          element={
              <DashboardWithLayout />
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
              <TasksWithLayout />
          }
        />
        <Route
          path="/dashboard/ai"
          element={
              <AIChatWithLayout />
          }
        />
      </Routes>
    </LaunchProvider>
  );
}
