import axios from 'axios';
import { api, ApiError } from './base.api';
import { installApiRetry } from './retry';
import { createOperationKeys, isDefinitiveOperationRejection } from '../features/partner/partner.requests';
import type { ActionResult, PartnerData, ProgramTerms } from '../features/partner/partner.types';

const ADMIN_TOKEN_KEY = 'mycoo.partner.admin-session';
let adminToken: string | null = null;
let partnerActor: string | null = null;
let adminActor: string | null = null;
export const setPartnerActor = (id: string | null) => { partnerActor = id; };
export const setAdminActor = (id: string | null) => { adminActor = id; };
export function getAdminToken() {
  try { return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? adminToken; } catch { return adminToken; }
}
export function saveAdminToken(token: string | null) {
  adminToken = token;
  try { if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token); else sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* Session remains in memory. */ }
}

// An administrator session must not enter the CRM authorization interceptor.
const adminApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', timeout: 20_000 });
installApiRetry(adminApi, { getSession: getAdminToken });
adminApi.interceptors.request.use(config => {
  const token = getAdminToken();
  if (token && config.url !== '/partner-admin/login') config.headers.Authorization = `Bearer ${token}`;
  return config;
});
adminApi.interceptors.response.use(response => response, error => {
  if (axios.isCancel(error)) return Promise.reject(error);
  const status = error.response?.status ?? 0;
  if (status === 401 && error.config?.url !== '/partner-admin/login' && error.config?.headers?.Authorization === `Bearer ${getAdminToken()}`) {
    saveAdminToken(null);
    window.dispatchEvent(new Event('mycoo:partner-admin-expired'));
  }
  const data = error.response?.data;
  const messages = Array.isArray(data?.errors) ? data.errors.flatMap((item: { messages?: string[] }) => item.messages ?? []) : [];
  const message = messages.length ? messages.join(' ') : Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
  return Promise.reject(new ApiError(typeof message === 'string' && message ? message : 'Не удалось связаться с сервером. Повторите попытку.', status));
});

const keys = createOperationKeys({
  getItem: key => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: key => sessionStorage.removeItem(key),
});

async function operationFingerprint(path: string, body: object, admin: boolean) {
  const actor = admin ? adminActor : partnerActor;
  if (!actor) throw new ApiError('Не удалось подтвердить сессию. Обновите кабинет.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([admin ? 'admin' : 'partner', actor, path, body])));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const partnerApi = {
  terms: async () => (await api.get<ProgramTerms>('/partners/terms')).data,
  data: async (admin: boolean) => (await (admin ? adminApi : api).get<PartnerData>(admin ? '/partner-admin/data' : '/partners/me')).data,
  adminSession: async () => (await adminApi.get<{ adminId: string; login: string }>('/partner-admin/session')).data,
  adminLogin: async (login: string, password: string) => (await adminApi.post<{ token: string; adminId: string; login: string }>('/partner-admin/login', { login, password })).data,
  adminLogout: async () => { await adminApi.post('/partner-admin/logout'); },
  adminCredentials: async (currentPassword: string, login: string, password: string) => (await adminApi.put<{ token: string; adminId: string; login: string }>('/partner-admin/credentials', { currentPassword, login, password })).data,
  async mutate(path: string, body: object, admin = false, method: 'post' | 'put' = 'post', idempotent = false): Promise<ActionResult> {
    const fingerprint = idempotent ? await operationFingerprint(path, body, admin) : null;
    const data = fingerprint ? { ...body, idempotencyKey: keys.get(fingerprint) } : body;
    try {
      const result = await (admin ? adminApi : api).request<ActionResult>({ url: path, method, data, retrySafe: idempotent });
      if (fingerprint) keys.complete(fingerprint);
      return result.data;
    } catch (error) {
      // An earlier accepted write may be followed by an expired session. Retain
      // its key through re-login, as with timeouts, throttling and server failures.
      if (fingerprint && error instanceof ApiError && isDefinitiveOperationRejection(error.status)) keys.complete(fingerprint);
      throw error;
    }
  },
};
