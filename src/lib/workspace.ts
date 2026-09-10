import type { OnboardingProfile } from "@/store/onboarding.store";
import type { Workspace } from "@/types/workspace.types";

export function workspaceProfile(workspace: Workspace | null, email = ""): OnboardingProfile {
  return {
    company: workspace?.company ?? "", industry: workspace?.industry ?? "", industryOther: workspace?.industryOther ?? "",
    site: workspace?.site ?? "", employees: workspace?.employees ?? "", managers: workspace?.managers ?? "",
    revenue: workspace?.revenue ?? "", stage: workspace?.stage ?? "", ownerName: workspace?.ownerName ?? "",
    ownerRole: workspace?.ownerRole ?? "", roleOther: workspace?.roleOther ?? "", ownerEmail: workspace?.ownerEmail ?? email,
    goal: workspace?.goal ?? "", problem: workspace?.problem ?? "", p1: workspace?.priority1 ?? "", p2: workspace?.priority2 ?? "", p3: workspace?.priority3 ?? "",
  };
}
export function clearWorkspaceCache() {
  try {
    ["mycoo_profile", "mycoo_mgmt_profile", "mycoo_trial_start"].forEach((key) => localStorage.removeItem(key));
  } catch {}
}
export function cacheWorkspace(workspace: Workspace) {
  try {
    localStorage.setItem("mycoo_profile", JSON.stringify(workspaceProfile(workspace)));
    if (workspace.diagnosticsAnalysis) localStorage.setItem("mycoo_mgmt_profile", JSON.stringify({
      ...workspace.diagnosticsAnalysis, risks: workspace.diagnosticsAnalysis.risks.map((r) => ({ tone: r.tone, t: r.text })),
    }));
    else localStorage.removeItem("mycoo_mgmt_profile");
    if (workspace.trialStartedAt) localStorage.setItem("mycoo_trial_start", String(Date.parse(workspace.trialStartedAt)));
    else localStorage.removeItem("mycoo_trial_start");
  } catch {}
}
