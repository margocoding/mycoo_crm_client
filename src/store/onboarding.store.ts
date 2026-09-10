import { workspaceApi } from "@/api/workspace.api";
import { create } from "zustand";
import { useLaunchStore } from "./launch.store";
import { workspaceProfile } from "@/lib/workspace";
import { errorMessage } from "@/api/base.api";
import type { Workspace } from "@/types/workspace.types";

export interface OnboardingProfile {
  company: string;
  industry: string;
  industryOther: string;
  site: string;
  employees: string;
  managers: string;
  revenue: string;
  stage: string;
  ownerName: string;
  ownerRole: string;
  roleOther: string;
  ownerEmail: string;
  goal: string;
  problem: string;
  p1: string;
  p2: string;
  p3: string;
}

const EMPTY: OnboardingProfile = {
  company: "",
  industry: "",
  industryOther: "",
  site: "",
  employees: "",
  managers: "",
  revenue: "",
  stage: "",
  ownerName: "",
  ownerRole: "",
  roleOther: "",
  ownerEmail: "",
  goal: "",
  problem: "",
  p1: "",
  p2: "",
  p3: "",
};

interface OnboardingStore {
  profile: OnboardingProfile;
  workspaceId: string | null;
  loading: boolean;
  error: string | null;
  setField: <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => void;
  setOwnerEmail: (email: string) => void;
  reset: (ownerEmail?: string) => void;
  restore: (workspace: Workspace | null, email: string) => void;
  saveStep: (step: number) => Promise<Workspace>;
  clearError: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  profile: { ...EMPTY },
  workspaceId: null,
  loading: false,
  error: null,

  setField: (key, value) =>
    set((s) => ({
      profile: { ...s.profile, [key]: value },
      error: null,
    })),

  setOwnerEmail: (email) =>
    set((s) => ({
      profile: { ...s.profile, ownerEmail: email },
    })),

  reset: (ownerEmail) =>
    set({
      profile: { ...EMPTY, ownerEmail: ownerEmail ?? "" },
      workspaceId: null,
      loading: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
  restore: (workspace, email) => {
    if (get().workspaceId !== (workspace?.id ?? null) || !get().profile.ownerEmail) {
      set({ profile: workspaceProfile(workspace, email), workspaceId: workspace?.id ?? null, error: null });
    }
  },
  saveStep: async (step) => {
    if (get().loading) throw new Error("Данные ещё сохраняются.");
    const p = get().profile;
    const id = get().workspaceId;
    set({ loading: true, error: null });
    try {
      let workspace: Workspace;
      if (step === 1) workspace = await workspaceApi.saveCompany({
        company: p.company.trim(),
        industry: p.industry,
        industryOther: p.industry === "Другое" ? p.industryOther.trim() : undefined,
        site: p.site.trim() || undefined,
        employees: p.employees.trim(),
        managers: p.managers.trim(),
        revenue: p.revenue.trim() || undefined,
        stage: p.stage.trim(),
      }, id ?? undefined);
      else if (step === 2 && id) workspace = await workspaceApi.saveOwner(id, {
        ownerName: p.ownerName.trim(),
        ownerRole: p.ownerRole,
        roleOther: p.ownerRole === "Другое" ? p.roleOther.trim() : undefined,
        ownerEmail: p.ownerEmail.trim().toLowerCase(),
      });
      else if (step === 3 && id) workspace = await workspaceApi.saveGoals(id, {
        goal: p.goal.trim(),
        problem: p.problem.trim(),
        priority1: p.p1.trim() || undefined,
        priority2: p.p2.trim() || undefined,
        priority3: p.p3.trim() || undefined,
      });
      else throw new Error("Сначала сохраните данные компании.");
      set({ workspaceId: workspace.id });
      useLaunchStore.getState().setWorkspace(workspace);
      return workspace;
    } catch (err) {
      set({ error: errorMessage(err) });
      throw err;
    } finally { set({ loading: false }); }
  },
}));
