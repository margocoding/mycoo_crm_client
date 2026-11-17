import type { PlanId } from './billing.types';

export interface UsageLimits {
  budgetRub: number; users: number; tasks: number; storageBytes: number;
  audioSeconds: number; inputTokens: number | null; outputTokens: number | null;
}
interface Consumption {
  costRub: number; inputTokens: number; outputTokens: number; audioSeconds: number; storageBytes: number;
}
export interface CompanyUsage {
  plan: PlanId | 'TRIAL'; periodStart: string; periodEnd: string | null; limits: UsageLimits;
  used: Consumption & { users: number; tasks: number }; reserved: Consumption;
  storagePending: boolean; automaticCostRub: number; updatedAt: string;
  rankingScope: 'company' | 'departments' | 'personal';
  topEmployees: Array<{ id: string; name: string; inputTokens: number; outputTokens: number; totalTokens: number; costRub: number }>;
}
