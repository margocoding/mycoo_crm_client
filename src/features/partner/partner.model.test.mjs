import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPartnerBalance, partnerDateInput } from './partner.model.ts';
import { createOperationKeys, isDefinitiveOperationRejection } from './partner.requests.ts';
const now = new Date('2026-11-08T12:00:00Z');
test('financial date inputs change day at Moscow midnight rather than UTC midnight', () => {
  assert.equal(partnerDateInput(new Date('2026-11-08T20:59:59Z')), '2026-11-08');
  assert.equal(partnerDateInput(new Date('2026-11-08T21:00:00Z')), '2026-11-09');
  assert.equal(partnerDateInput(new Date('2026-11-08T22:30:00Z')), '2026-11-09');
});
test('financial calendar date is independent of the source timezone offset', () => {
  assert.equal(partnerDateInput(new Date('2026-11-08T16:30:00-05:00')), '2026-11-09');
  assert.equal(partnerDateInput(new Date('2026-11-09T06:30:00+09:00')), '2026-11-09');
});
function data() {
  return { ledger: [
    { partnerId: 'one', amount: 100, availableAt: '2026-11-01T00:00:00Z' },
    { partnerId: 'one', amount: 20, availableAt: '2026-11-09T00:00:00Z' },
    { partnerId: 'two', amount: 900, availableAt: '2026-11-01T00:00:00Z' },
  ], payouts: [] };
}
test('balance excludes other partners and separates held commission', () => {
  assert.deepEqual(getPartnerBalance(data(), 'one', now), { totalAccrued: 120, pending: 20, available: 100, reserved: 0, paid: 0, debt: 0 });
});
test('new, reviewed and approved requests reserve balance; rejections release it', () => {
  const value = data();
  value.payouts = ['new','review','approved','rejected'].map(status => ({ partnerId: 'one', amount: 10, status }));
  assert.equal(getPartnerBalance(value, 'one', now).available, 70);
  assert.equal(getPartnerBalance(value, 'one', now).reserved, 30);
});
test('partial actual payout releases its unused reservation', () => {
  const value = data();
  value.payouts = [{ partnerId: 'one', amount: 70, paidAmount: 50, status: 'paid' }];
  assert.equal(getPartnerBalance(value, 'one', now).available, 50);
  assert.equal(getPartnerBalance(value, 'one', now).paid, 50);
});
test('refunds and adjustments can produce debt without a negative available balance', () => {
  const value = data();
  value.ledger.push({ partnerId: 'one', amount: -150, availableAt: '2026-11-01T00:00:00Z' });
  const balance = getPartnerBalance(value, 'one', now);
  assert.equal(balance.available, 0);
  assert.equal(balance.debt, 50);
  assert.equal(balance.pending, 20);
});
test('held entries mature at the exact availability timestamp', () => {
  assert.equal(getPartnerBalance(data(), 'one', new Date('2026-11-09T00:00:00Z')).available, 120);
});
test('cent arithmetic displays without floating point dust', () => {
  const value = { ledger: [0.1, 0.2].map(amount => ({ partnerId: 'one', amount, availableAt: now.toISOString() })), payouts: [] };
  assert.equal(getPartnerBalance(value, 'one', now).available, 0.3);
});
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
test('unknown operation result reuses the same key after page reload', () => {
  const disk = storage();
  const first = createOperationKeys(disk, () => 'request-one');
  assert.equal(first.get('fingerprint'), 'request-one');
  assert.equal(first.get('fingerprint'), 'request-one');
  const reopened = createOperationKeys(disk, () => 'request-two');
  assert.equal(reopened.get('fingerprint'), 'request-one');
});
test('confirmed completion permits a distinct new operation with the same amount', () => {
  const disk = storage(); let counter = 0;
  const keys = createOperationKeys(disk, () => `request-${++counter}`);
  assert.equal(keys.get('fingerprint'), 'request-1');
  keys.complete('fingerprint');
  assert.equal(keys.get('fingerprint'), 'request-2');
});
test('keys are independent for different actor, operation or payload fingerprints', () => {
  let counter = 0;
  const keys = createOperationKeys(storage(), () => `request-${++counter}`);
  assert.notEqual(keys.get('actor-a-operation'), keys.get('actor-b-operation'));
  assert.notEqual(keys.get('actor-a-operation'), keys.get('actor-a-changed-amount'));
});
test('restricted storage retains retries within the active page', () => {
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  let counter = 0;
  const keys = createOperationKeys(blocked, () => `request-${++counter}`);
  assert.equal(keys.get('fingerprint'), keys.get('fingerprint'));
  keys.complete('fingerprint');
  assert.equal(keys.get('fingerprint'), 'request-2');
});
test('authorization expiry after a lost response retains the operation key for re-login', () => {
  const disk = storage();
  const keys = createOperationKeys(disk, () => 'original-request');
  keys.get('same-user-and-operation');
  for (const status of [0, 401, 403, 408, 429, 500, 502, 503, 504]) {
    assert.equal(isDefinitiveOperationRejection(status), false);
  }
  const relogged = createOperationKeys(disk, () => 'must-not-be-used');
  assert.equal(relogged.get('same-user-and-operation'), 'original-request');
  for (const status of [400, 404, 409, 422]) assert.equal(isDefinitiveOperationRejection(status), true);
});
