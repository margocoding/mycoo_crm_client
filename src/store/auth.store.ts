import { create } from "zustand";
import type { UserRdo } from "../types/auth.types";
import { authApi } from "../api/auth.api";

const TOKEN_KEY = "mycoo_access_token";

interface AuthStore {
  email: string;
  mode: "login" | "register" | null;
  accessToken: string | null;
  user: UserRdo | null;
  setAuthEmail: (email: string) => void;
  setAuthMode: (mode: "login" | "register") => void;
  saveSession: (accessToken: string, user: UserRdo) => void;
  clearSession: () => void;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  email: "",
  mode: null,
  accessToken: null,
  user: null,

  setAuthEmail: (email) => set({ email }),
  setAuthMode: (mode) => set({ mode }),

  saveSession: (accessToken, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } catch {
      void 0;
    }
    set({ accessToken, user });
  },

  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      void 0;
    }
    set({ accessToken: null, user: null, mode: null, email: "" });
  },

  loadSession: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const user = await authApi.me(token);
      set({ accessToken: token, user });
    } catch {
      get().clearSession();
    }
  },
}));