import axios from "axios";
import { installApiRetry } from "./retry";

export const TOKEN_KEY = "mycoo_access_token";

export class ApiError extends Error {
  constructor(message: string, readonly status = 0, readonly code?: string, readonly data?: unknown) {
    super(message);
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось сохранить данные. Повторите попытку.";
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 20_000,
});

const publicMeeting = (url = "") => /^\/meetings\/join\//.test(url);
installApiRetry(api, { getSession: () => localStorage.getItem(TOKEN_KEY) });

api.interceptors.request.use((config) => {
  const publicAuth = /^\/auth\/(check-email|verify-code|resend-code|login|register|oauth\/)/.test(config.url ?? "");
  const publicInvitation = /^\/invitations\//.test(config.url ?? "") && !config.url?.endsWith('/accept');
  const passwordInvitation = /^\/invitations\/[^/]+\/accept$/.test(config.url ?? '') && Boolean(config.data?.password);
  if (!publicAuth && !publicInvitation && !passwordInvitation && !publicMeeting(config.url) && !config.headers.Authorization) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (axios.isCancel(error) || error instanceof ApiError) return Promise.reject(error);
  const status = error.response?.status ?? 0;
  const currentToken = localStorage.getItem(TOKEN_KEY);
  if (status === 401 && !publicMeeting(error.config?.url) && currentToken && error.config?.headers?.Authorization === `Bearer ${currentToken}`) {
    window.dispatchEvent(new Event("mycoo:session-expired"));
  }
  const data = error.response?.data;
  if (status === 402 && !publicMeeting(error.config?.url) && data?.code === 'SUBSCRIPTION_EXPIRED') {
    window.dispatchEvent(new Event('mycoo:subscription-expired'));
  }
  if (status === 404 && /^\/workspace\//.test(error.config?.url ?? '') && data?.code === 'WORKSPACE_UNAVAILABLE') {
    window.dispatchEvent(new Event('mycoo:workspace-unavailable'));
  }
  const details = Array.isArray(data?.errors)
    ? data.errors.flatMap((item: { messages?: string[] }) => item.messages ?? []) : [];
  const message = details?.length ? details.join(" ")
    : Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
  return Promise.reject(new ApiError((typeof message === "string" && message) || (status
    ? "Сервер не смог выполнить запрос. Повторите попытку."
    : "Не удалось связаться с сервером. Проверьте подключение и повторите попытку."), status, data?.code, data));
});
