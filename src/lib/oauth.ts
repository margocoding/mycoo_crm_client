export type OAuthProviderId = 'yandex' | 'vk';
const KEY = 'mycoo_oauth_attempt';
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function safeReturnTo(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    && !/[\u0000-\u001f]/.test(value) && !value.startsWith('/auth/oauth/') ? value : '/';
}

export async function beginOAuthAttempt(returnTo: string) {
  const codeVerifier = encode(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))));
  sessionStorage.setItem(KEY, JSON.stringify({ codeVerifier, returnTo: safeReturnTo(returnTo), createdAt: Date.now() }));
  return { codeChallenge, returnTo: safeReturnTo(returnTo) };
}

export function currentOAuthAttempt(): { codeVerifier: string; returnTo: string } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!value || typeof value.codeVerifier !== 'string' || !/^[\w-]{43}$/.test(value.codeVerifier)
      || typeof value.createdAt !== 'number' || Date.now() - value.createdAt > 10 * 60_000) return null;
    return { codeVerifier: value.codeVerifier, returnTo: safeReturnTo(value.returnTo) };
  } catch { return null; }
}

export function clearOAuthAttempt() { sessionStorage.removeItem(KEY); }
