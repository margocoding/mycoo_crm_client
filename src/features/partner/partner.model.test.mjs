import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { addCalendarMonths, createDemoPartnerData, getPartnerBalance, validatePartnerData } from './partner.model.ts';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
const { usePartnerStore: store, PARTNER_STORAGE_KEYS: keys } = await import('./partner.store.ts');
const primary = 'partner-sfera';
const state = () => store.getState();
const balance = () => getPartnerBalance(state(), primary);
beforeEach(async () => {
  state().resetDemo();
  assert.equal((await state().loginAdmin('admin', 'admin')).ok, true);
});

test('seed has valid references, all statuses and reconciled balances', () => {
  const now = new Date('2026-11-06T12:00:00Z'), data = createDemoPartnerData(now);
  assert.equal(validatePartnerData(data), true);
  assert.deepEqual(getPartnerBalance(data, primary, now), {
    totalAccrued: 63_500, pending: 10_000, available: 28_500, reserved: 15_000, paid: 10_000, debt: 0,
  });
  assert.equal(new Set(data.payouts.map(item => item.status)).size, 5);
});

test('pending earnings mature exactly at their hold date', () => {
  const data = createDemoPartnerData(new Date('2026-11-06T12:00:00Z'));
  const held = data.ledger.find(item => item.paymentId === 'DEMO-1004');
  assert.equal(getPartnerBalance(data, primary, new Date(Date.parse(held.availableAt) - 1)).pending, 10_000);
  assert.equal(getPartnerBalance(data, primary, new Date(held.availableAt)).pending, 0);
  assert.equal(getPartnerBalance(data, primary, new Date(held.availableAt)).available, 38_500);
});

test('all live payout requests reserve funds immediately and prevent double spending', () => {
  assert.equal(state().requestPayout(primary, 20_000).ok, true);
  assert.equal(balance().available, 8_500);
  assert.equal(balance().reserved, 35_000);
  assert.equal(state().requestPayout(primary, 10_000).ok, false);
  assert.equal(balance().available, 8_500);
  assert.equal(state().requestPayout(primary, 8_500).ok, true);
  assert.equal(balance().available, 0);
});

test('payout requires approved partner, complete details, minimum and cent precision', () => {
  assert.equal(state().requestPayout('partner-vector', 5_000).ok, false);
  assert.equal(state().requestPayout(primary, 4_999.99).ok, false);
  assert.equal(state().requestPayout(primary, 5_000.001).ok, false);
  store.setState({ partners: state().partners.map(item => item.id === primary ? { ...item, payoutDetails: null } : item) });
  assert.equal(state().requestPayout(primary, 5_000).ok, false);
});

test('rejecting requires a reason and releases the reservation only once', () => {
  const before = balance().available;
  assert.equal(state().reviewPayout('payout-new', 'rejected').ok, false);
  assert.equal(state().reviewPayout('payout-new', 'rejected', 'Неверные реквизиты').ok, true);
  assert.equal(balance().available, before + 5_000);
  assert.equal(state().reviewPayout('payout-new', 'approved').ok, false);
  assert.equal(state().reviewPayout('payout-paid', 'rejected', 'Отмена').ok, false);
});

test('partial manual payout records actual paid amount and releases the unused reservation', () => {
  const ledger = state().ledger;
  assert.equal(state().markPaid('payout-approved', 6_000, new Date().toISOString()).ok, false);
  assert.equal(state().markPaid('payout-approved', 0, new Date().toISOString()).ok, false);
  assert.equal(state().markPaid('payout-approved', 4_000, '2099-01-01').ok, false);
  assert.equal(state().markPaid('payout-approved', 4_000, '2001-01-01').ok, false);
  assert.equal(state().markPaid('payout-approved', 4_000, new Date().toISOString()).ok, true);
  assert.equal(balance().paid, 14_000);
  assert.equal(balance().reserved, 10_000);
  assert.equal(balance().available, 29_500);
  assert.equal(state().markPaid('payout-approved', 4_000, new Date().toISOString()).ok, false);
  assert.equal(state().ledger, ledger);
});

test('a payout cannot consume funds reserved for another request after a correction', () => {
  assert.equal(state().adjustCommission(primary, -50_000, 'Сверка').ok, true);
  assert.equal(balance().available, 0);
  assert.equal(balance().debt, 21_500);
  assert.equal(state().markPaid('payout-approved', 1_000, new Date().toISOString()).ok, false);
  assert.equal(state().requestPayout(primary, 5_000).ok, false);
});

test('payment identifiers are globally deduplicated and past ledger entries remain immutable', () => {
  const entries = state().ledger, snapshot = structuredClone(entries);
  assert.equal(state().recordPayment('ref-atelier', 'UNIQUE-PAYMENT', 100_000).ok, true);
  assert.equal(state().recordPayment('ref-sever', 'UNIQUE-PAYMENT', 100_000).ok, false);
  assert.deepEqual(entries, snapshot);
  assert.deepEqual(state().ledger.slice(0, entries.length), snapshot);
  assert.equal(state().ledger.at(-1).amount, 20_000);
});

test('refund is capped, requires a reason and reverses the original rate', () => {
  const original = structuredClone(state().ledger);
  assert.equal(state().updateTerms({ ...state().terms, commissionPercent: 35 }).ok, true);
  assert.equal(state().refundPayment('DEMO-1004', 60_000, 'Возврат').ok, false);
  assert.equal(state().refundPayment('DEMO-1004', 10_000, '').ok, false);
  assert.equal(state().refundPayment('DEMO-1004', 10_000, 'Частичный возврат').ok, true);
  assert.equal(state().ledger.at(-1).amount, -2_000);
  assert.equal(balance().pending, 8_000);
  assert.equal(balance().available, 28_500);
  assert.deepEqual(state().ledger.slice(0, original.length), original);
  assert.equal(state().refundPayment('DEMO-1004', 40_000, 'Остаток').ok, true);
  assert.equal(state().refundPayment('DEMO-1004', 0.01, 'Сверх оплаты').ok, false);
  assert.equal(balance().pending, 0);
  assert.equal(validatePartnerData(state()), true);
});

test('multiple small refunds use cumulative rounding to reverse exactly one commission', () => {
  assert.equal(state().recordPayment('ref-atelier', 'SMALL', 0.03).ok, true);
  assert.equal(state().ledger.at(-1).amount, 0.01);
  for (let n = 0; n < 3; n++) assert.equal(state().refundPayment('SMALL', 0.01, 'Возврат').ok, true);
  assert.equal(state().ledger.filter(item => item.paymentId === 'SMALL').reduce((sum, item) => sum + item.amount, 0), 0);
  assert.equal(validatePartnerData(state()), true);
});

test('new terms apply to new payment dates and never rewrite existing accruals', () => {
  const ledger = structuredClone(state().ledger);
  assert.equal(state().updateTerms({ commissionPercent: 30, eligibleMonths: 12, holdDays: 7, minimumPayout: 6_000 }).ok, true);
  assert.deepEqual(state().ledger, ledger);
  assert.equal(state().recordPayment('ref-atelier', 'OLD-DATE', 10_000, new Date(Date.now() - 20 * 86_400_000).toISOString()).ok, true);
  assert.equal(state().ledger.at(-1).amount, 2_000);
  assert.equal(state().recordPayment('ref-atelier', 'NEW-DATE', 10_000).ok, true);
  assert.equal(state().ledger.at(-1).amount, 3_000);
  const payment = state().payments.at(-1), entry = state().ledger.at(-1);
  assert.equal(Date.parse(entry.availableAt) - Date.parse(payment.paidAt), 7 * 86_400_000);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.equal(state().recordPayment('ref-atelier', 'UI-TODAY', 10_000, today).ok, true);
  assert.equal(state().ledger.at(-1).amount, 3_000);
});

test('eligibility uses calendar months and payments after expiry earn no commission', () => {
  assert.equal(addCalendarMonths('2024-01-31T12:00:00Z', 1).toISOString(), '2024-02-29T12:00:00.000Z');
  store.setState({ referrals: state().referrals.map(item => item.id === 'ref-atelier' ? { ...item, registeredAt: new Date(Date.now() - 400 * 86_400_000).toISOString() } : item) });
  const count = state().ledger.length;
  assert.equal(state().recordPayment('ref-atelier', 'EXPIRED', 10_000).ok, true);
  assert.equal(state().ledger.length, count);
  assert.equal(state().refundPayment('EXPIRED', 10_000, 'Возврат без комиссии').ok, true);
  assert.equal(state().ledger.length, count);
});

test('payout snapshots preserve details after a partner edits their bank account', () => {
  const result = state().requestPayout(primary, 5_000);
  const original = state().payouts.find(item => item.id === result.id).details;
  const changed = { ...state().partners[0].payoutDetails, bank: 'Другой демо банк' };
  assert.equal(state().updateDetails(primary, changed).ok, true);
  assert.equal(state().payouts.find(item => item.id === result.id).details.bank, original.bank);
  assert.notEqual(state().partners[0].payoutDetails.bank, original.bank);
});

test('application rejection and resubmission preserve identity and validate duplicate email', () => {
  assert.equal(state().reviewPartner('partner-vector', 'rejected').ok, false);
  assert.equal(state().reviewPartner('partner-vector', 'rejected', 'Уточните источник').ok, true);
  const input = { name: 'Михаил Орлов', email: 'mikhail@vector.example', company: 'Вектор', channel: 'Сайт', website: 'https://vector.example' };
  assert.equal(state().resubmitApplication('partner-vector', input).ok, true);
  assert.equal(state().partners.find(item => item.id === 'partner-vector').status, 'pending');
  assert.equal(state().applyPartner(input).ok, false);
  assert.equal(state().reviewPartner('partner-vector', 'approved').ok, true);
  assert.equal(state().resubmitApplication('partner-vector', input).ok, false);
});

test('admin mutations require local authentication', () => {
  state().logoutAdmin();
  assert.equal(state().updateTerms(state().terms).ok, false);
  assert.equal(state().adjustCommission(primary, 500, 'Причина').ok, false);
  assert.equal(state().refundPayment('DEMO-1004', 100, 'Причина').ok, false);
  assert.equal(state().recordPayment('ref-atelier', 'NO-AUTH', 100).ok, false);
  assert.equal(state().reviewPartner('partner-vector', 'approved').ok, false);
  assert.equal(state().reviewPayout('payout-new', 'approved').ok, false);
  assert.equal(state().markPaid('payout-approved', 100, new Date().toISOString()).ok, false);
});

test('credentials verify current password, persist hashes and invalidate old login', async () => {
  assert.equal((await state().updateAdminCredentials('wrong', 'demo-admin', 'new-password')).ok, false);
  assert.equal((await state().updateAdminCredentials('admin', 'demo-admin', 'short')).ok, false);
  assert.equal((await state().updateAdminCredentials('admin', 'demo-admin', 'new-password')).ok, true);
  const stored = JSON.parse(window.localStorage.getItem(keys.credentials));
  assert.equal(stored.login, 'demo-admin');
  assert.equal(stored.hash.length, 64);
  assert.equal(JSON.stringify(stored).includes('new-password'), false);
  assert.equal('password' in stored, false);
  state().logoutAdmin();
  assert.equal(window.sessionStorage.getItem(keys.session), null);
  assert.equal((await state().loginAdmin('admin', 'admin')).ok, false);
  assert.equal((await state().loginAdmin('demo-admin', 'new-password')).ok, true);
});

test('logout invalidates an in-flight first login without losing a subsequent session', async () => {
  state().resetDemo();
  const staleLogin = state().loginAdmin('admin', 'admin');
  state().logoutAdmin();
  const newLogin = state().loginAdmin('admin', 'admin');
  assert.equal((await staleLogin).ok, false);
  assert.equal((await newLogin).ok, true);
  assert.equal(state().adminAuthenticated, true);
  const credentials = JSON.parse(window.localStorage.getItem(keys.credentials));
  assert.equal(JSON.parse(window.sessionStorage.getItem(keys.session)), credentials.revision);
});

test('persistence restores data and same-browser session, reset touches only partner keys', async () => {
  window.localStorage.setItem('crm-auth-token', 'untouched');
  window.sessionStorage.setItem('crm-session', 'untouched');
  assert.equal(state().requestPayout(primary, 5_000).ok, true);
  const { usePartnerStore: reloaded } = await import(`./partner.store.ts?restore=${crypto.randomUUID()}`);
  assert.equal(reloaded.getState().payouts.length, 6);
  assert.equal(reloaded.getState().adminAuthenticated, true);
  state().resetDemo();
  assert.equal(state().payouts.length, 5);
  assert.equal(state().adminAuthenticated, false);
  assert.equal(window.localStorage.getItem(keys.credentials), null);
  assert.equal(window.localStorage.getItem('crm-auth-token'), 'untouched');
  assert.equal(window.sessionStorage.getItem('crm-session'), 'untouched');
  assert.equal((await state().loginAdmin('admin', 'admin')).ok, true);
});

test('malformed, incomplete or broken storage snapshots fall back to valid demo data', async () => {
  const damaged = createDemoPartnerData();
  damaged.ledger[0].partnerId = 'missing-partner';
  assert.equal(validatePartnerData(damaged), false);
  for (const value of ['{broken-json', JSON.stringify({ version: 1, data: { partners: [] } }), JSON.stringify({ version: 1, data: damaged })]) {
    window.localStorage.setItem(keys.data, value);
    const { usePartnerStore: restoredStore } = await import(`./partner.store.ts?corrupt=${crypto.randomUUID()}`);
    assert.equal(validatePartnerData(restoredStore.getState()), true);
    assert.equal(restoredStore.getState().partners.length, 3);
  }
});

test('unavailable browser storage still permits an in-memory demo', async () => {
  const original = globalThis.window;
  globalThis.window = Object.defineProperties({}, {
    localStorage: { get() { throw new Error('Storage disabled'); } },
    sessionStorage: { get() { throw new Error('Storage disabled'); } },
  });
  try {
    const { usePartnerStore: volatile } = await import(`./partner.store.ts?blocked=${crypto.randomUUID()}`);
    assert.equal((await volatile.getState().loginAdmin('admin', 'admin')).ok, true);
    assert.equal(volatile.getState().requestPayout(primary, 5_000).ok, true);
    volatile.getState().resetDemo();
    assert.equal(volatile.getState().adminAuthenticated, false);
  } finally { globalThis.window = original; }
});
