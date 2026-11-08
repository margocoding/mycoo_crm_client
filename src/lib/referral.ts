import { TOKEN_KEY } from '@/api/base.api';

const KEY = 'mycoo_referral';
const PARTNER_KEY = 'mycoo_partner_referral';
export function captureReferral(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get('ref');
  const partner = params.get('partner');
  try {
    if (code && /^[a-zA-Z0-9_-]{16,64}$/.test(code) && !localStorage.getItem(TOKEN_KEY))
      sessionStorage.setItem(KEY, JSON.stringify({ code, expires: Date.now() + 30 * 86400000 }));
    if (partner && /^[a-zA-Z0-9_-]{16,64}$/.test(partner) && !localStorage.getItem(TOKEN_KEY) && !pendingPartner())
      sessionStorage.setItem(PARTNER_KEY, JSON.stringify({ code: partner, expires: Date.now() + 30 * 86400000 }));
  } catch { /* Registration remains available when browser storage is disabled. */ }
}
export function pendingReferral(): string | undefined {
  try {
    const item = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return item && item.expires > Date.now() && /^[a-zA-Z0-9_-]{16,64}$/.test(item.code) ? item.code : undefined;
  } catch { return undefined; }
}
export function pendingPartner(): string | undefined {
  try {
    const item = JSON.parse(sessionStorage.getItem(PARTNER_KEY) || 'null');
    return item && item.expires > Date.now() && /^[a-zA-Z0-9_-]{16,64}$/.test(item.code) ? item.code : undefined;
  } catch { return undefined; }
}
export function clearReferral() {
  try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(PARTNER_KEY); } catch { /* No stored link. */ }
}
