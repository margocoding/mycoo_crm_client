import { workspaceApi } from "@/api/workspace.api";
import { create } from "zustand";

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
  loading: boolean;
  error: string | null;
  setField: <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => void;
  setOwnerEmail: (email: string) => void;
  reset: (ownerEmail?: string) => void;
  submit: () => Promise<void>;
  clearError: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  profile: { ...EMPTY },
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
      loading: false,
      error: null,
    }),

  clearError: () => set({ error: null }),

  submit: async () => {
    const p = get().profile;
    set({ loading: true, error: null });
    try {
      await workspaceApi.completeOnboarding({
        company: p.company.trim(),
        industry:
          p.industry === "Другое" && p.industryOther.trim()
            ? p.industryOther.trim()
            : p.industry,
        industryOther: p.industry === "Другое" ? p.industryOther.trim() : undefined,
        site: p.site.trim() || undefined,
        employees: p.employees.trim(),
        managers: p.managers.trim(),
        revenue: p.revenue.trim() || undefined,
        stage: p.stage.trim(),
        ownerName: p.ownerName.trim(),
        ownerRole:
          p.ownerRole === "Другое" && p.roleOther.trim()
            ? p.roleOther.trim()
            : p.ownerRole,
        roleOther: p.ownerRole === "Другое" ? p.roleOther.trim() : undefined,
        ownerEmail: p.ownerEmail.trim().toLowerCase(),
        goal: p.goal.trim(),
        problem: p.problem.trim(),
        priority1: p.p1.trim() || undefined,
        priority2: p.p2.trim() || undefined,
        priority3: p.p3.trim() || undefined,
      });
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка при сохранении брифа";
      set({ loading: false, error: message });
      throw err;
    }
  },
}));