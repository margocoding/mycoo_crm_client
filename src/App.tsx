import "./index.css";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/tasks/TasksPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import { Register } from "./components/Register";

// Dashboard wrapper with layout
function DashboardWithLayout() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}

// Tasks page wrapper with layout
function TasksWithLayout() {
  return (
    <DashboardLayout>
      <TasksPage />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Register>
      <Routes>
        {/* Публичный маршрут - лендинг */}
        <Route path="/" element={<LandingPage />} />

        {/* Защищенные маршруты - дашборд и вложенные страницы */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardWithLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute>
              <TasksWithLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Register>
  );
}
