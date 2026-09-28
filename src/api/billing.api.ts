import { api } from './base.api';
import type { BillingAccount, BillingCatalog, BillingPeriod, PlanId } from '@/types/billing.types';

export const billingApi = {
  plans: (signal?: AbortSignal) => api.get<BillingCatalog>('/billing/plans', { signal }).then(r => r.data),
  me: (signal?: AbortSignal) => api.get<BillingAccount>('/billing/me', { signal }).then(r => r.data),
  checkout: (plan: PlanId, period: BillingPeriod, idempotencyKey: string, workspaceId?: string) =>
    api.post<{ orderId: string; checkoutUrl: string }>('/billing/orders', { plan, period, idempotencyKey, workspaceId }).then(r => r.data),
};
