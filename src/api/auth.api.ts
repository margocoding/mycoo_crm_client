import axios from "axios";
import { api } from "./base.api";
import { AuthRdo, CheckEmailRdo, UserRdo } from "@/types/auth.types";


export const authApi = {
  checkEmail: (email: string) =>
    api
      .post<CheckEmailRdo>("/auth/check-email", { email })
      .then((r) => r.data),

  register: (email: string, password: string, code: string) =>
    api
      .post<AuthRdo>("/auth/register", { email, password, code })
      .then((r) => r.data),

  login: (email: string, password: string, code: string) =>
    api
      .post<AuthRdo>("/auth/login", { email, password, code })
      .then((r) => r.data),

  resendCode: (email: string) =>
    api
      .post<CheckEmailRdo>("/auth/resend-code", { email })
      .then((r) => r.data),

  me: (accessToken: string) =>
    api
      .get<UserRdo>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((r) => r.data),
};