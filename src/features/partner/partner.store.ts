import { create } from 'zustand';
import { addCalendarMonths, createDemoPartnerData, getPartnerBalance, isMoney, roundRub, validatePartnerData, validatePayoutDetails, validTerms } from './partner.model.ts';
import type { ActionResult, PartnerApplication, PartnerData, PartnerStore, PayoutDetails, ProgramTerms } from './partner.types.ts';

const STORAGE_VERSION = 1;
export const PARTNER_STORAGE_KEYS = {
  data: 'mycoo.partner-demo.v1.data', credentials: 'mycoo.partner-demo.v1.credentials', session: 'mycoo.partner-demo.v1.session',
} as const;
type TermsRevision = { effectiveAt: string; terms: ProgramTerms };
type DemoCredentials = { version: number; login: string; salt: string; hash: string; revision: string };
const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (id?: string): ActionResult => id ? { ok: true, id } : { ok: true };
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const timestamp = () => new Date().toISOString();

function readStorage(key: string, session = false): unknown {
  try {
    const raw = (session ? window.sessionStorage : window.localStorage).getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeStorage(key: string, value: unknown, session = false): void {
  try { (session ? window.sessionStorage : window.localStorage).setItem(key, JSON.stringify(value)); }
  catch { /* In private/restricted browsers the prototype continues in memory. */ }
}
function removeStorage(key: string, session = false): void {
  try { (session ? window.sessionStorage : window.localStorage).removeItem(key); } catch { /* Storage is optional. */ }
}
function readCredentials(): DemoCredentials | null {
  const value = readStorage(PARTNER_STORAGE_KEYS.credentials) as DemoCredentials | null;
  return value?.version === STORAGE_VERSION && typeof value.login === 'string' && value.login.trim().length >= 3 &&
    /^[a-f0-9]{32}$/.test(value.salt) && /^[a-f0-9]{64}$/.test(value.hash) && typeof value.revision === 'string'
    ? value : null;
}
function selectData(state: PartnerData): PartnerData {
  const { partners, referrals, payments, ledger, payouts, terms, currentPartnerId } = state;
  return { partners, referrals, payments, ledger, payouts, terms, currentPartnerId };
}

const stored = readStorage(PARTNER_STORAGE_KEYS.data) as { version?: number; data?: unknown; termsHistory?: TermsRevision[] } | null;
const validHistory = (history: unknown): history is TermsRevision[] => Array.isArray(history) && history.length > 0 &&
  history.every((item, index) => item && Number.isFinite(Date.parse(item.effectiveAt)) && validTerms(item.terms) &&
    (index === 0 || Date.parse(item.effectiveAt) >= Date.parse(history[index - 1].effectiveAt)));
const restored = stored?.version === STORAGE_VERSION && validatePartnerData(stored.data) && validHistory(stored.termsHistory);
const initialData = restored ? stored.data as PartnerData : createDemoPartnerData();
let termsHistory: TermsRevision[] = restored ? stored.termsHistory! : [{ effectiveAt: '2000-01-01T00:00:00.000Z', terms: { ...initialData.terms } }];
let credentials = readCredentials();
let credentialsPromise: Promise<DemoCredentials> | null = null;
let authGeneration = 0;
const initialSession = readStorage(PARTNER_STORAGE_KEYS.session, true);

async function passwordHash(password: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100_000 }, material, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function createCredentials(login: string, password: string): Promise<DemoCredentials> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  return { version: STORAGE_VERSION, login, salt, hash: await passwordHash(password, salt), revision: crypto.randomUUID() };
}
async function ensureCredentials(): Promise<DemoCredentials> {
  if (credentials) return credentials;
  if (!credentialsPromise) {
    const generation = authGeneration;
    const pending = createCredentials('admin', 'admin').then(value => {
      if (generation === authGeneration) {
        credentials = value;
        writeStorage(PARTNER_STORAGE_KEYS.credentials, value);
      }
      return value;
    }).finally(() => { if (credentialsPromise === pending) credentialsPromise = null; });
    credentialsPromise = pending;
  }
  return credentialsPromise;
}

function normalizeApplication(input: PartnerApplication): PartnerApplication | null {
  const value = Object.fromEntries(Object.entries(input).map(([key, item]) => [key, typeof item === 'string' ? item.trim() : ''])) as unknown as PartnerApplication;
  if (!value.name || !value.channel || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ||
    Object.values(value).some(item => item.length > 500)) return null;
  if (value.website) {
    try { if (!['https:', 'http:'].includes(new URL(value.website).protocol)) return null; }
    catch { return null; }
  }
  return { ...value, email: value.email.toLowerCase() };
}

// Today's date-only input means now; historical dates preserve their calendar day.
function parseEventDate(value: string, earliest: string, now = new Date()): Date | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(dateOnly ? `${value}T00:00:00` : value);
  if (!Number.isFinite(parsed.getTime())) return null;
  if (dateOnly) {
    const day = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    if (day !== value) return null;
    const first = new Date(earliest);
    if (parsed.toDateString() === now.toDateString()) parsed.setTime(now.getTime());
    else if (parsed.toDateString() === first.toDateString()) parsed.setTime(first.getTime());
  }
  return parsed.getTime() <= now.getTime() && parsed.getTime() >= Date.parse(earliest) ? parsed : null;
}

export const usePartnerStore = create<PartnerStore>((set, get) => ({
  ...initialData,
  adminLogin: credentials?.login ?? 'admin',
  adminAuthenticated: credentials !== null && initialSession === credentials.revision,

  selectPartner: id => {
    if (get().partners.some(partner => partner.id === id)) set({ currentPartnerId: id });
  },
  applyPartner: input => {
    const application = normalizeApplication(input);
    if (!application) return fail('Укажите имя, корректный email и канал привлечения. Сайт — полный адрес с https://.');
    if (get().partners.some(partner => partner.email.toLowerCase() === application.email)) return fail('Заявка с таким email уже существует. Откройте личный кабинет.');
    const id = makeId('partner');
    set(state => ({ partners: [...state.partners, { ...application, id, code: makeId('REF').slice(-12).toUpperCase(), status: 'pending', appliedAt: timestamp(), reviewNote: '', payoutDetails: null }], currentPartnerId: id }));
    return ok(id);
  },
  resubmitApplication: (id, input) => {
    const state = get(), partner = state.partners.find(item => item.id === id);
    if (!partner || partner.status !== 'rejected') return fail('Повторная подача доступна только для отклонённой заявки.');
    const application = normalizeApplication(input);
    if (!application) return fail('Проверьте имя, email, канал привлечения и адрес сайта.');
    if (state.partners.some(item => item.id !== id && item.email.toLowerCase() === application.email)) return fail('Этот email уже используется другой заявкой.');
    set({ partners: state.partners.map(item => item.id === id ? { ...item, ...application, status: 'pending', appliedAt: timestamp(), reviewNote: '' } : item) });
    return ok(id);
  },
  reviewPartner: (id, status, reason = '') => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    if (!['approved', 'rejected'].includes(status)) return fail('Недопустимый статус заявки.');
    if (!state.partners.some(item => item.id === id && item.status === 'pending')) return fail('Можно рассмотреть только новую заявку.');
    if (status === 'rejected' && !reason.trim()) return fail('Укажите причину отклонения заявки.');
    set({ partners: state.partners.map(item => item.id === id ? { ...item, status, reviewNote: reason.trim() } : item) });
    return ok(id);
  },
  updateDetails: (id, details) => {
    if (!get().partners.some(item => item.id === id)) return fail('Партнёр не найден.');
    const clean = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as unknown as PayoutDetails;
    if (!validatePayoutDetails(clean)) return fail('Заполните получателя и банк. ИНН: 10 цифр для ООО или 12 для ИП/самозанятого; счёт: 20 цифр; БИК: 9 цифр.');
    set(state => ({ partners: state.partners.map(item => item.id === id ? { ...item, payoutDetails: { ...clean } } : item) }));
    return ok(id);
  },
  requestPayout: (partnerId, amount) => {
    const state = get(), partner = state.partners.find(item => item.id === partnerId);
    if (!partner || partner.status !== 'approved') return fail('Запрос выплаты доступен после одобрения партнёра.');
    if (!validatePayoutDetails(partner.payoutDetails)) return fail('Сначала заполните корректные платёжные реквизиты.');
    if (!isMoney(amount) || amount < state.terms.minimumPayout) return fail(`Минимальная выплата — ${state.terms.minimumPayout.toLocaleString('ru-RU')} ₽. Укажите сумму с точностью до копейки.`);
    if (amount > getPartnerBalance(state, partnerId).available) return fail('Недостаточно доступных средств. Заявки в работе уже зарезервированы.');
    const id = makeId('payout');
    set({ payouts: [...state.payouts, { id, partnerId, amount: roundRub(amount), status: 'new', createdAt: timestamp(), reviewNote: '', paidAt: null, paidAmount: null, details: { ...partner.payoutDetails } }] });
    return ok(id);
  },
  reviewPayout: (id, status, reason = '') => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    const payout = state.payouts.find(item => item.id === id);
    const transitions: Record<string, string[]> = { new: ['review', 'approved', 'rejected'], review: ['approved', 'rejected'], approved: ['rejected'], paid: [], rejected: [] };
    if (!payout || !transitions[payout.status].includes(status)) return fail('Этот переход статуса выплаты недоступен.');
    if (status === 'rejected' && !reason.trim()) return fail('Укажите причину отклонения выплаты.');
    if (status === 'approved' && getPartnerBalance(state, payout.partnerId).debt > 0) return fail('После корректировок средств не хватает для всех заявок. Отклоните лишние заявки.');
    set({ payouts: state.payouts.map(item => item.id === id ? { ...item, status, reviewNote: reason.trim() || item.reviewNote } : item) });
    return ok(id);
  },
  markPaid: (id, amount, date) => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    const payout = state.payouts.find(item => item.id === id);
    if (!payout || payout.status !== 'approved') return fail('Отметить выплату можно только у одобренной заявки.');
    if (!isMoney(amount) || amount <= 0 || amount > payout.amount) return fail('Фактическая сумма должна быть больше нуля и не превышать сумму заявки.');
    const paidAt = parseEventDate(date, payout.createdAt);
    if (!paidAt) return fail('Укажите корректную дату: не раньше заявки и не позже сегодняшнего дня.');
    const balance = getPartnerBalance(state, payout.partnerId);
    if (roundRub(balance.available - balance.debt + payout.amount) < amount) return fail('Недостаточно средств с учётом возвратов и других заявок.');
    set({ payouts: state.payouts.map(item => item.id === id ? { ...item, status: 'paid', paidAmount: roundRub(amount), paidAt: paidAt.toISOString() } : item) });
    return ok(id);
  },
  adjustCommission: (partnerId, amount, description, paymentId) => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    if (!state.partners.some(item => item.id === partnerId)) return fail('Партнёр не найден.');
    if (!isMoney(amount) || amount === 0) return fail('Укажите ненулевую сумму корректировки с точностью до копейки.');
    if (!description.trim()) return fail('Укажите причину корректировки.');
    const payment = paymentId ? state.payments.find(item => item.id === paymentId.trim()) : undefined;
    const referral = payment ? state.referrals.find(item => item.id === payment.referralId) : undefined;
    if (paymentId && (!referral || referral.partnerId !== partnerId)) return fail('Оплата не найдена среди клиентов этого партнёра.');
    const id = makeId('ledger'), now = timestamp();
    set({ ledger: [...state.ledger, { id, partnerId, referralId: referral?.id ?? null, paymentId: payment?.id ?? null, kind: 'adjustment', amount: roundRub(amount), createdAt: now, availableAt: now, description: description.trim() }] });
    return ok(id);
  },
  recordPayment: (referralId, paymentId, amount, date = timestamp()) => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    const id = paymentId.trim(), referral = state.referrals.find(item => item.id === referralId);
    if (!referral) return fail('Клиент не найден.');
    if (!state.partners.some(item => item.id === referral.partnerId && item.status === 'approved')) return fail('Начисления доступны только одобренному партнёру.');
    if (!id || id.length > 100) return fail('Укажите ID оплаты длиной до 100 символов.');
    if (state.payments.some(payment => payment.id === id)) return fail('Оплата с этим ID уже учтена. Повторное начисление заблокировано.');
    if (!isMoney(amount) || amount <= 0) return fail('Укажите положительную сумму оплаты с точностью до копейки.');
    const paidAt = parseEventDate(date, referral.registeredAt);
    if (!paidAt) return fail('Дата оплаты должна быть не раньше регистрации клиента и не позже сегодняшнего дня.');
    const terms = [...termsHistory].reverse().find(item => Date.parse(item.effectiveAt) <= paidAt.getTime())?.terms ?? termsHistory[0].terms;
    const commission = paidAt < addCalendarMonths(referral.registeredAt, terms.eligibleMonths) ? roundRub(amount * terms.commissionPercent / 100) : 0;
    set({
      payments: [...state.payments, { id, referralId, amount: roundRub(amount), refundedAmount: 0, paidAt: paidAt.toISOString() }],
      ledger: commission > 0 ? [...state.ledger, { id: makeId('ledger'), partnerId: referral.partnerId, referralId, paymentId: id,
        kind: 'commission', amount: commission, createdAt: timestamp(),
        availableAt: new Date(paidAt.getTime() + terms.holdDays * 86_400_000).toISOString(),
        description: `Комиссия ${terms.commissionPercent}% по оплате ${id}`,
      }] : state.ledger,
    });
    return ok(id);
  },
  refundPayment: (paymentId, amount, reason) => {
    const state = get();
    if (!state.adminAuthenticated) return fail('Войдите в кабинет администратора.');
    const payment = state.payments.find(item => item.id === paymentId);
    if (!payment) return fail('Оплата не найдена.');
    if (!isMoney(amount) || amount <= 0 || amount > roundRub(payment.amount - payment.refundedAmount)) return fail('Возврат должен быть больше нуля и не превышать невозвращённую часть оплаты.');
    if (!reason.trim()) return fail('Укажите причину возврата.');
    const original = state.ledger.find(item => item.paymentId === paymentId && item.kind === 'commission');
    const refundedAmount = roundRub(payment.refundedAmount + amount);
    const previouslyReversed = -state.ledger.filter(item => item.paymentId === paymentId && item.kind === 'refund').reduce((sum, item) => sum + item.amount, 0);
    // Cumulative rounding ensures several partial refunds reverse exactly the original commission.
    const reversal = original ? roundRub(roundRub(original.amount * refundedAmount / payment.amount) - previouslyReversed) : 0;
    set({
      payments: state.payments.map(item => item.id === paymentId ? { ...item, refundedAmount } : item),
      ledger: original && reversal > 0 ? [...state.ledger, { id: makeId('ledger'), partnerId: original.partnerId, referralId: original.referralId, paymentId,
        kind: 'refund', amount: -reversal, createdAt: timestamp(), availableAt: original.availableAt, description: reason.trim(),
      }] : state.ledger,
    });
    return ok(paymentId);
  },
  updateTerms: terms => {
    if (!get().adminAuthenticated) return fail('Войдите в кабинет администратора.');
    if (!validTerms(terms)) return fail('Проверьте условия: комиссия 0–100%, срок 1–120 месяцев, холд 0–365 дней, положительная минимальная выплата.');
    termsHistory = [...termsHistory, { effectiveAt: timestamp(), terms: { ...terms } }];
    set({ terms: { ...terms } });
    return ok();
  },
  loginAdmin: async (login, password) => {
    const generation = authGeneration;
    try {
      const current = await ensureCredentials();
      const matches = login.trim() === current.login && await passwordHash(password, current.salt) === current.hash;
      if (generation !== authGeneration) return fail('Сессия изменилась. Войдите снова.');
      if (!matches) return fail('Неверный логин или пароль.');
      writeStorage(PARTNER_STORAGE_KEYS.session, current.revision, true);
      set({ adminAuthenticated: true, adminLogin: current.login });
      return ok();
    } catch { return fail('Не удалось войти. Откройте сайт через защищённое соединение и попробуйте снова.'); }
  },
  logoutAdmin: () => {
    authGeneration++;
    credentialsPromise = null;
    removeStorage(PARTNER_STORAGE_KEYS.session, true);
    set({ adminAuthenticated: false });
  },
  updateAdminCredentials: async (currentPassword, login, password) => {
    if (!get().adminAuthenticated) return fail('Войдите в кабинет администратора.');
    if (login.trim().length < 3 || login.trim().length > 100) return fail('Логин должен содержать от 3 до 100 символов.');
    if (password.length < 8 || password.length > 256) return fail('Новый пароль должен содержать от 8 до 256 символов.');
    const generation = authGeneration;
    try {
      const current = await ensureCredentials();
      if (await passwordHash(currentPassword, current.salt) !== current.hash) return fail('Текущий пароль указан неверно.');
      const next = await createCredentials(login.trim(), password);
      if (generation !== authGeneration || !get().adminAuthenticated) return fail('Сессия изменилась. Войдите снова.');
      authGeneration++;
      credentials = next;
      writeStorage(PARTNER_STORAGE_KEYS.credentials, next);
      writeStorage(PARTNER_STORAGE_KEYS.session, next.revision, true);
      set({ adminLogin: next.login });
      return ok();
    } catch { return fail('Не удалось изменить логин и пароль. Попробуйте ещё раз.'); }
  },
  resetDemo: () => {
    authGeneration++;
    credentials = null;
    credentialsPromise = null;
    removeStorage(PARTNER_STORAGE_KEYS.data);
    removeStorage(PARTNER_STORAGE_KEYS.credentials);
    removeStorage(PARTNER_STORAGE_KEYS.session, true);
    const fresh = createDemoPartnerData();
    termsHistory = [{ effectiveAt: '2000-01-01T00:00:00.000Z', terms: { ...fresh.terms } }];
    set({ ...fresh, adminLogin: 'admin', adminAuthenticated: false });
  },
}));

usePartnerStore.subscribe(state => {
  writeStorage(PARTNER_STORAGE_KEYS.data, { version: STORAGE_VERSION, data: selectData(state), termsHistory });
});

// Keep seed dates stable across reloads, even before the first user action.
if (!restored) writeStorage(PARTNER_STORAGE_KEYS.data, { version: STORAGE_VERSION, data: initialData, termsHistory });
