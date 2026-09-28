export type PlanId = 'START' | 'MISSION' | 'ENTERPRISE';
export type BillingPeriod = 'MONTH' | 'YEAR';
export interface Subscription {
  status: 'NOT_STARTED' | 'TRIAL' | 'PAID' | 'EXPIRED';
  plan: PlanId | null; planName: string | null;
  activeUntil: string | null; hasAccess: boolean; daysRemaining: number;
}
export interface BillingCatalog {
  plans: Array<{ id: PlanId; name: string; outcome: string; tagline: string; description: string;
    promise: string; recommended: boolean; features: string[]; monthKopecks: number; yearKopecks: number }>;
  currency: string; trialDays: number; paymentsAvailable: boolean;
}
export interface BillingAccount {
  subscription: Subscription;
  referral: { url: string; registrations: number; earnedDays: number; pendingDays: number; daysPerRegistration: number };
}
