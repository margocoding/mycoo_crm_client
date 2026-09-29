import { TOKEN_KEY } from '@/api/base.api';

const KEY = 'mycoo_referral';
export function captureReferral(search: string) {
  const code = new URLSearchParams(search).get('ref');
  try {
    if (code && /^[a-zA-Z0-9_-]{16,64}$/.test(code) && !localStorage.getItem(TOKEN_KEY))
      sessionStorage.setItem(KEY, JSON.stringify({ code, expires: Date.now() + 30 * 86400000 }));
  } catch { /* Registration remains available when browser storage is disabled. */ }
}
export function pendingReferral(): string | undefined {
  try {
    const item = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return item && item.expires > Date.now() && /^[a-zA-Z0-9_-]{16,64}$/.test(item.code) ? item.code : undefined;
  } catch { return undefined; }
}
export function clearReferral() { try { sessionStorage.removeItem(KEY); } catch { /* No stored link. */ } }
