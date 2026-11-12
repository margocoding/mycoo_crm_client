import { api } from "./base.api";
import type { AuthRdo, CheckEmailRdo, UserRdo } from "@/types/auth.types";
import { clearReferral, pendingReferral, pendingPartner } from "@/lib/referral";
import type { OAuthProviderId } from '@/lib/oauth';

export interface OAuthProvider { id: OAuthProviderId; name: string; enabled: boolean; }
export type OAuthExchange = (AuthRdo & { returnTo?: string }) | { requiresEmail: true; email?: string };

export const authApi = {
  providers: (signal?: AbortSignal) => api.get<OAuthProvider[]>('/auth/oauth/providers', { signal }).then((r) => r.data),
  oauthStart: (provider: OAuthProviderId, input: { codeChallenge: string; returnTo: string }) =>
    api.post<{ authorizationUrl: string }>(`/auth/oauth/${provider}/start`, {
      ...input, partnerCode: pendingPartner(), referralCode: pendingReferral(),
    }).then((r) => r.data),
  oauthExchange: (input: { ticket: string; codeVerifier: string; email?: string; code?: string }) =>
    api.post<OAuthExchange>('/auth/oauth/exchange', input).then((r) => r.data),
  async checkEmail(email: string): Promise<CheckEmailRdo> {
    const { data } = await api.post<CheckEmailRdo>("/auth/check-email", {
      email,
    });
    return data;
  },

  async verifyCode(email: string, code: string): Promise<AuthRdo> {
    const { data } = await api.post<AuthRdo>("/auth/verify-code", {
      email,
      code,
    });
    return data;
  },

  async register(
    email: string,
    password: string,
    code: string,
  ): Promise<AuthRdo> {
    const { data } = await api.post<AuthRdo>("/auth/register", {
      email,
      password,
      code,
      referralCode: pendingReferral(),
      partnerCode: pendingPartner(),
    });
    clearReferral();
    return data;
  },

  async login(
    email: string,
    password: string,
    code: string,
  ): Promise<AuthRdo> {
    const { data } = await api.post<AuthRdo>("/auth/login", {
      email,
      password,
      code,
    });
    clearReferral();
    return data;
  },

  async resendCode(email: string): Promise<CheckEmailRdo> {
    const { data } = await api.post<CheckEmailRdo>("/auth/resend-code", {
      email,
    });
    return data;
  },

  /**
   * Используется только для восстановления сессии при старте приложения
   * или при обновлении токена.
   */
  async me(): Promise<UserRdo> {
    const { data } = await api.get<UserRdo>("/auth/me");
    return data;
  },
};
