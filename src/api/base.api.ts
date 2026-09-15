import axios from "axios";

export const TOKEN_KEY = "mycoo_access_token";

export class ApiError extends Error {
  constructor(message: string, readonly status = 0, readonly code?: string) {
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

api.interceptors.request.use((config) => {
  const publicAuth = /^\/auth\/(check-email|verify-code|resend-code|login|register)$/.test(config.url ?? "");
  const publicInvitation = /^\/invitations\//.test(config.url ?? "");
  if (!publicAuth && !publicInvitation && !config.headers.Authorization) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (axios.isCancel(error)) return Promise.reject(error);
  const status = error.response?.status ?? 0;
  if (status === 401 && error.config?.headers?.Authorization) {
    window.dispatchEvent(new Event("mycoo:session-expired"));
  }
  const data = error.response?.data;
  const details = Array.isArray(data?.errors)
    ? data.errors.flatMap((item: { messages?: string[] }) => item.messages ?? []) : [];
  const message = details?.length ? details.join(" ")
    : Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
  return Promise.reject(new ApiError((typeof message === "string" && message) || (status
    ? "Сервер не смог выполнить запрос. Повторите попытку."
    : "Не удалось связаться с сервером. Проверьте подключение и повторите попытку."), status, data?.code));
});
