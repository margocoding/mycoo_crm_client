import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import type { Profile } from "@/components/shared/auth/register/Onboarding/Onboarding";

export type LaunchView = "site" | "app";

const TRIAL_KEY = "mycoo_trial_start";
const DEMO_KEYS = ["mycoo_profile", "mycoo_mgmt_profile", TRIAL_KEY];

const hasTrialStart = () => {
  try {
    return typeof localStorage !== "undefined" && Boolean(localStorage.getItem(TRIAL_KEY));
  } catch {
    return false;
  }
};

const ensureTrialStart = () => {
  try {
    if (!localStorage.getItem(TRIAL_KEY)) {
      localStorage.setItem(TRIAL_KEY, String(Date.now()));
    }
  } catch {
    void 0;
  }
};

const clearDemoStorage = () => {
  try {
    DEMO_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    void 0;
  }
};

let navigate: (to: string) => void = () => {};

const go = (to: string) => {
  navigate(to);
  window.scrollTo(0, 0);
};

interface LaunchStore {
  view: LaunchView;
  trialActive: boolean;
  profile: Profile | null;
  launch: (openAuth: () => void) => void;
  exitToSite: () => void;
  resetDemo: () => void;
  finishOnboarding: (profile: Profile) => void;
  launchWorkspace: () => void;
  setProfile: (profile: Profile | null) => void;
}

const initialTrial = hasTrialStart();

export const useLaunchStore = create<LaunchStore>((set) => ({
  view: initialTrial ? "app" : "site",
  trialActive: initialTrial,
  profile: null,

  launch: (openAuth) => {
    const user = useAuthStore.getState().user;
    if (user) {
      ensureTrialStart();
      set({ trialActive: true, view: "app" });
      go("/dashboard/main");
      return;
    }
    openAuth();
  },

  exitToSite: () => {
    set({ view: "site" });
    window.scrollTo(0, 0);
  },

  resetDemo: () => {
    clearDemoStorage();
    useAuthStore.getState().clearSession();
    set({
      trialActive: false,
      profile: null,
      view: "site",
    });
    go("/");
  },

  finishOnboarding: (profile) => {
    set({ profile });
  },

  launchWorkspace: () => {
    ensureTrialStart();
    set({ trialActive: true, view: "app" });
    go("/dashboard/main");
  },

  setProfile: (profile) => set({ profile }),
}));

export function useLaunch() {
  const routerNavigate = useNavigate();

  useEffect(() => {
    navigate = routerNavigate;
  }, [routerNavigate]);

  return useLaunchStore();
}