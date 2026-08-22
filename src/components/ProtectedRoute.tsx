import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Пока загружается проверка авторизации, показываем загрузку
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-flux border-t-transparent"></div>
          <p className="mt-4 font-mono text-sm text-fog">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован, редиректим на лендинг
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
