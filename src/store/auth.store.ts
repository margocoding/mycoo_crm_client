import { create } from "zustand";
import type { UserRdo } from "@/types/auth.types";
import { authApi } from "@/api/auth.api";
import { ApiError, errorMessage, TOKEN_KEY } from "@/api/base.api";
import { clearWorkspaceCache } from "@/lib/workspace";

interface AuthStore {
  email: string;
  mode: "login" | "register" | null;
  accessToken: string | null;
  user: UserRdo | null;
  isLoading: boolean;
  error: string | null;
  setAuthEmail: (email: string) => void;
  setAuthMode: (mode: "login" | "register" | null) => void;
  saveSession: (accessToken: string, user: UserRdo) => void;
  clearSession: () => void;
  loadSession: () => Promise<void>;
}

let revision = 0;
let hydration: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  email: "", mode: null, accessToken: null, user: null, isLoading: true, error: null,
  setAuthEmail: (email) => set({ email }),
  setAuthMode: (mode) => set({ mode }),
  saveSession: (accessToken, user) => {
    revision++;
    localStorage.setItem(TOKEN_KEY, accessToken);
    set({ accessToken, user, email: user.email, isLoading: false, error: null });
  },
  clearSession: () => {
    revision++;
    localStorage.removeItem(TOKEN_KEY);
    clearWorkspaceCache();
    set({ accessToken: null, user: null, mode: null, email: "", isLoading: false, error: null });
  },
  loadSession: () => {
    if (hydration) return hydration;
    const current = ++revision;
    set({ isLoading: true, error: null });
    hydration = (async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { get().clearSession(); return; }
        const user = await authApi.me(token);
        if (current === revision) set({ accessToken: token, user, email: user.email });
      } catch (error) {
        if (current !== revision) return;
        if (error instanceof ApiError && error.status === 401) get().clearSession();
        else set({ error: errorMessage(error) });
      } finally {
        if (current === revision) set({ isLoading: false });
      }
    })().finally(() => { hydration = null; });
    return hydration;
  },
}));
