import { api } from "./base.api";
import type { CompanyStepDto, OwnerStepDto, GoalsStepDto, Workspace, WorkspaceStatus, Question, DiagnosticAnswer } from "@/types/workspace.types";

export const workspaceApi = {
  remove: (id: string) => api.delete<{ success: boolean }>(`/workspace/${encodeURIComponent(id)}`).then((r) => r.data),
  leave: (id: string) => api.post<{ success: boolean }>(`/workspace/${encodeURIComponent(id)}/leave`).then((r) => r.data),
  status: () => api.get<WorkspaceStatus>("/workspace/status").then((r) => r.data),
  get: (id: string) => api.get<Workspace>(`/workspace/${id}`).then((r) => r.data),
  saveCompany: (dto: CompanyStepDto, id?: string) => (id
    ? api.patch<Workspace>(`/workspace/${id}/onboarding/company`, dto)
    : api.post<Workspace>("/workspace/onboarding/company", dto)).then((r) => r.data),
  saveOwner: (id: string, dto: OwnerStepDto) => api.patch<Workspace>(`/workspace/${id}/onboarding/owner`, dto).then((r) => r.data),
  saveGoals: (id: string, dto: GoalsStepDto) => api.patch<Workspace>(`/workspace/${id}/onboarding/goals`, dto).then((r) => r.data),
  questions: (signal?: AbortSignal) => api.get<Question[]>("/workspace/diagnostics/questions", { signal }).then((r) => r.data),
  completeDiagnostics: (workspaceId: string, answers: DiagnosticAnswer[]) =>
    api.post<Workspace>("/workspace/diagnostics/complete", { workspaceId, answers }, { timeout: 150_000 }).then((r) => r.data),
};
