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