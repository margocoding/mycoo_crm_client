import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Имитация проверки токена при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      // Имитируем проверку сохраненного токена
      const savedToken = localStorage.getItem("mycoo_auth_token");
      if (savedToken) {
        // Имитация проверки токена на сервере
        await new Promise((resolve) => setTimeout(resolve, 300));
        setIsAuthenticated(true);
        setToken(savedToken);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Имитация входа пользователя
  const login = async () => {
    setIsLoading(true);
    // Имитируем запрос к API для получения токена
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockToken = "mock_jwt_token_" + Date.now();
    localStorage.setItem("mycoo_auth_token", mockToken);
    setToken(mockToken);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("mycoo_auth_token");
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
