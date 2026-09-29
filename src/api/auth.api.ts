import { api } from "./base.api";
import type { AuthRdo, CheckEmailRdo, UserRdo } from "@/types/auth.types";
import { clearReferral, pendingReferral } from "@/lib/referral";

export const authApi = {
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