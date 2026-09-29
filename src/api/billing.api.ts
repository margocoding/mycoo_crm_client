import { api } from './base.api';
import type {
  BillingAccount,
  BillingCatalog,
  BillingPeriod,
  PlanId,
} from '@/types/billing.types';

export const billingApi = {
  async plans(signal?: AbortSignal): Promise<BillingCatalog> {
    const { data } = await api.get<BillingCatalog>('/billing/plans', { signal });
    return data;
  },

  async me(signal?: AbortSignal): Promise<BillingAccount> {
    const { data } = await api.get<BillingAccount>('/billing/me', { signal });
    return data;
  },

  async checkout(
    plan: PlanId,
    period: BillingPeriod,
    idempotencyKey: string,
    workspaceId?: string,
  ): Promise<{ orderId: string; checkoutUrl: string }> {
    const { data } = await api.post<{ orderId: string; checkoutUrl: string }>(
      '/billing/orders',
      {
        plan,
        period,
        idempotencyKey,
        workspaceId,
      },
    );
    return data;
  },
};