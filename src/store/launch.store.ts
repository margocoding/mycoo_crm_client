import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import type { OnboardingProfile } from "./onboarding.store";
import type { Workspace } from "@/types/workspace.types";
import { workspaceApi } from "@/api/workspace.api";
import { errorMessage } from "@/api/base.api";
import { cacheWorkspace, clearWorkspaceCache, workspaceProfile } from "@/lib/workspace";
import { useModalRouter } from "@/hooks/useModalRouter";

interface LaunchStore {
  workspace: Workspace | null;
  loadedFor: string | null;
  trialActive: boolean;
  profile: OnboardingProfile | null;
  loading: boolean;
  error: string | null;
  setWorkspace: (workspace: Workspace) => void;
  loadWorkspace: () => Promise<void>;
  reset: () => void;
}

let revision = 0;
let request: { userId: string; promise: Promise<void> } | null = null;

export const useLaunchStore = create<LaunchStore>((set, get) => ({
  workspace: null, loadedFor: null, trialActive: false, profile: null, loading: false, error: null,
  setWorkspace: (workspace) => {
    cacheWorkspace(workspace);
    set({ workspace, loadedFor: useAuthStore.getState().user?.id ?? null, profile: workspaceProfile(workspace),
      trialActive: workspace.isActive && workspace.diagnosticsComplete, error: null });
  },
  reset: () => {
    revision++;
    request = null;
    clearWorkspaceCache();
    set({ workspace: null, loadedFor: null, trialActive: false, profile: null, loading: false, error: null });
  },
  loadWorkspace: () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) { get().reset(); return Promise.resolve(); }
    if (request?.userId === userId) return request.promise;
    const current = ++revision;
    set({ loading: true, error: null });
    const promise = (async () => {
      try {
        const status = await workspaceApi.status();
        const workspace = status.workspaceId ? await workspaceApi.get(status.workspaceId) : null;
        if (current !== revision || useAuthStore.getState().user?.id !== userId) return;
        if (workspace) get().setWorkspace(workspace);
        else {
          clearWorkspaceCache();
          set({ workspace: null, loadedFor: userId, profile: null, trialActive: false });
        }
      } catch (error) {
        if (current === revision) set({ error: errorMessage(error) });
      } finally {
        if (current === revision) { set({ loading: false }); request = null; }
      }
    })();
    request = { userId, promise };
    return promise;
  },
}));

export function useLaunch() {
  const navigate = useNavigate();
  const { openModal } = useModalRouter();
  const store = useLaunchStore();
  const go = (to: string) => { navigate(to); window.scrollTo(0, 0); };
  const launch = async () => {
    const auth = useAuthStore.getState();
    if (auth.isLoading) return;
    if (auth.error) { await auth.loadSession(); if (useAuthStore.getState().error) return; }
    const user = useAuthStore.getState().user;
    if (!user) { openModal("auth", { step: "email" }); return; }
    if (useLaunchStore.getState().loadedFor !== user.id || useLaunchStore.getState().error) await store.loadWorkspace();
    const state = useLaunchStore.getState();
    if (state.error || state.loading || state.loadedFor !== user.id) return;
    if (state.trialActive) go("/dashboard/main");
    else openModal(state.workspace?.onboardingComplete ? "diagnostics" : "onboarding");
  };
  return {
    ...store, launch,
    exitToSite: () => go("/"),
    resetDemo: () => { useAuthStore.getState().clearSession(); store.reset(); go("/"); },
    openSubscription: () => openModal("subscription"),
    launchWorkspace: (workspace: Workspace) => {
      store.setWorkspace(workspace);
      if (workspace.isActive && workspace.diagnosticsComplete) go("/dashboard/main");
    },
  };
}
