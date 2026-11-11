import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { beginOAuthAttempt, currentOAuthAttempt, clearOAuthAttempt, safeReturnTo } from './oauth.ts';

const values = new Map();
globalThis.sessionStorage = { setItem: (key, value) => values.set(key, value), getItem: (key) => values.get(key) ?? null, removeItem: (key) => values.delete(key) };
afterEach(() => values.clear());

test('OAuth only returns to an internal path', () => {
  for (const value of ['https://other.example', '//other.example', '/\\other.example', '/\n/other.example', '/auth/oauth/callback?ticket=old', null]) assert.equal(safeReturnTo(value), '/');
  assert.equal(safeReturnTo('/invite/invitation-token'), '/invite/invitation-token');
  assert.equal(safeReturnTo('/partner/account?tab=payouts'), '/partner/account?tab=payouts');
});

test('OAuth challenge binds the exchange to a fresh verifier in this tab', async () => {
  const first = await beginOAuthAttempt('/partner/account');
  const stored = currentOAuthAttempt();
  assert.match(stored.codeVerifier, /^[\w-]{43}$/);
  assert.equal(first.codeChallenge, Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stored.codeVerifier))).toString('base64url'));
  assert.equal(stored.returnTo, '/partner/account');
  assert.equal('codeVerifier' in first, false);
  await beginOAuthAttempt('/');
  assert.notEqual(currentOAuthAttempt().codeVerifier, stored.codeVerifier);
  clearOAuthAttempt();
  assert.equal(currentOAuthAttempt(), null);
});

test('Expired and malformed OAuth attempts cannot be exchanged', async () => {
  await beginOAuthAttempt('/');
  const [key, raw] = [...values][0];
  values.set(key, JSON.stringify({ ...JSON.parse(raw), createdAt: Date.now() - 601_000 }));
  assert.equal(currentOAuthAttempt(), null);
  values.set(key, 'not-json');
  assert.equal(currentOAuthAttempt(), null);
});
