export interface CompleteOnboardingDto {
  company: string;
  industry: string;
  industryOther?: string;
  site?: string;
  employees: string;
  managers: string;
  revenue?: string;
  stage: string;
  ownerName: string;
  ownerRole: string;
  roleOther?: string;
  ownerEmail: string;
  goal: string;
  problem: string;
  priority1?: string;
  priority2?: string;
  priority3?: string;
}

export type CompanyStepDto = Pick<CompleteOnboardingDto, "company" | "industry" | "industryOther" | "site" | "employees" | "managers" | "revenue" | "stage">;
export type OwnerStepDto = Pick<CompleteOnboardingDto, "ownerName" | "ownerRole" | "roleOther" | "ownerEmail">;
export type GoalsStepDto = Pick<CompleteOnboardingDto, "goal" | "problem" | "priority1" | "priority2" | "priority3">;

export interface Analysis {
  score: number;
  risks: Array<{ tone: "crit" | "warn" | "ok"; text: string }>;
  summary: string;
}
export interface DiagnosticAnswer { questionId: string; opt?: number | null; text?: string | null; skip?: boolean; }
export interface Question { id: string; question: string; options: Array<{ text: string; score: number }>; }
export interface Workspace {
  id: string; ownerId: string; onboardingStep: number;
  onboardingComplete: boolean; diagnosticsComplete: boolean; isActive: boolean;
  company?: string | null; industry?: string | null; industryOther?: string | null; site?: string | null;
  employees?: string | null; managers?: string | null; revenue?: string | null; stage?: string | null;
  ownerName?: string | null; ownerRole?: string | null; roleOther?: string | null; ownerEmail?: string | null;
  goal?: string | null; problem?: string | null; priority1?: string | null; priority2?: string | null; priority3?: string | null;
  trialStartedAt?: string | null; diagnosticsAnalysis?: Analysis | null; diagnosticsAnswers?: DiagnosticAnswer[];
}
export interface WorkspaceStatus { workspaceId: string | null; onboardingStep: number; canAccessWorkspace: boolean; }
