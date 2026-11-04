import axios, { CanceledError } from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Opt in only when repeating this operation cannot duplicate its effects. */
    retrySafe?: boolean;
    _retryState?: { attempts: number; authenticated: boolean; session: string | null };
  }
}

const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);
const networkCodes = new Set(["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "ENOTFOUND"]);
// These services already consumed their retry budget inside the API.
const handledCodes = new Set(["UPSTREAM_RETRIES_EXHAUSTED", "UPSTREAM_REQUEST_FAILED", "GIGACHAT_UNAVAILABLE"]);
const maxRetries = 5;
const maxDelayMs = 10_000;

type Signal = AxiosRequestConfig["signal"];
type RetryOptions = {
  getSession: () => string | null;
  wait?: (ms: number, signal?: Signal) => Promise<void>;
  random?: () => number;
  now?: () => number;
};

export function retryDelay(attempt: number, retryAfter: unknown, now = Date.now(), random = Math.random) {
  const header = typeof retryAfter === "string" || typeof retryAfter === "number" ? String(retryAfter).trim() : "";
  const seconds = header ? Number(header) : NaN;
  const requested = Number.isFinite(seconds) ? seconds * 1000 : header ? Date.parse(header) - now : 0;
  const backoff = Math.min(500 * 2 ** attempt, 8000) + Math.floor(random() * 250);
  return Math.min(maxDelayMs, Math.max(backoff, Number.isFinite(requested) ? requested : 0));
}

export function waitForRetry(ms: number, signal?: Signal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new CanceledError());
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", cancel);
      reject(new CanceledError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener?.("abort", cancel);
      resolve();
    }, ms);
    signal?.addEventListener?.("abort", cancel);
  });
}

export function installApiRetry(api: AxiosInstance, options: RetryOptions) {
  const wait = options.wait ?? waitForRetry;
  // Register before the authorization interceptor: Axios runs request interceptors in reverse order.
  api.interceptors.request.use((config) => {
    config._retryState ??= {
      attempts: 0,
      authenticated: Boolean(config.headers.Authorization),
      session: options.getSession(),
    };
    return config;
  });
  api.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || axios.isCancel(error) || !error.config) throw error;
    const config = error.config;
    const state = config._retryState;
    const cancelled = () => config.signal?.aborted ||
      (state?.authenticated && state.session !== options.getSession());
    if (cancelled()) throw new CanceledError();
    const safe = ["get", "head"].includes((config.method ?? "get").toLowerCase()) || config.retrySafe === true;
    const status = error.response?.status;
    const data = error.response?.data as { code?: string } | undefined;
    const transient = status ? transientStatuses.has(status) : networkCodes.has(error.code ?? "");
    if (!safe || !transient || !state || state.attempts >= maxRetries || handledCodes.has(data?.code ?? "")) throw error;
    const delay = retryDelay(state.attempts, error.response?.headers?.["retry-after"], options.now?.(), options.random);
    state.attempts++;
    await wait(delay, config.signal);
    if (cancelled()) throw new CanceledError();
    return api.request(config);
  });
}
