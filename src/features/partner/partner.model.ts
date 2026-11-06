import type { PartnerBalance, PartnerData, PayoutDetails, ProgramTerms } from './partner.types.ts';

export const DEFAULT_PARTNER_TERMS: ProgramTerms = {
  commissionPercent: 20, eligibleMonths: 12, holdDays: 14, minimumPayout: 5_000,
};

export const roundRub = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
export const isMoney = (amount: unknown): amount is number =>
  typeof amount === 'number' && Number.isFinite(amount) && Math.abs(amount) <= 1_000_000_000 &&
  Math.abs(amount - roundRub(amount)) < 0.0000001;

export function getPartnerBalance(data: PartnerData, partnerId: string, now = new Date()): PartnerBalance {
  let totalAccrued = 0, pending = 0, matured = 0, reserved = 0, paid = 0;
  for (const entry of data.ledger) {
    if (entry.partnerId !== partnerId) continue;
    totalAccrued += entry.amount;
    if (Date.parse(entry.availableAt) > now.getTime()) pending += entry.amount;
    else matured += entry.amount;
  }
  for (const payout of data.payouts) {
    if (payout.partnerId !== partnerId) continue;
    if (payout.status === 'paid') paid += payout.paidAmount ?? 0;
    else if (['new', 'review', 'approved'].includes(payout.status)) reserved += payout.amount;
  }
  const remaining = roundRub(matured - reserved - paid);
  return {
    totalAccrued: roundRub(totalAccrued), pending: roundRub(pending),
    available: Math.max(0, remaining), reserved: roundRub(reserved), paid: roundRub(paid),
    debt: Math.max(0, -remaining),
  };
}

export function addCalendarMonths(value: string, months: number): Date {
  const date = new Date(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

export function validTerms(value: unknown): value is ProgramTerms {
  if (!isRecord(value)) return false;
  return isMoney(value.commissionPercent) && value.commissionPercent >= 0 && value.commissionPercent <= 100 &&
    isIntegerWithin(value.eligibleMonths, 1, 120) && isIntegerWithin(value.holdDays, 0, 365) &&
    isMoney(value.minimumPayout) && value.minimumPayout > 0;
}

export function validatePayoutDetails(value: unknown): value is PayoutDetails {
  if (!isRecord(value)) return false;
  return isText(value.recipient) && isText(value.bank) &&
    typeof value.taxId === 'string' && /^\d{10}(\d{2})?$/.test(value.taxId) &&
    typeof value.account === 'string' && /^\d{20}$/.test(value.account) &&
    typeof value.bic === 'string' && /^\d{9}$/.test(value.bic) &&
    ['self-employed', 'entrepreneur', 'company'].includes(String(value.legalForm)) &&
    (value.legalForm === 'company' ? value.taxId.length === 10 : value.taxId.length === 12);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isString = (value: unknown): value is string => typeof value === 'string';
const isDate = (value: unknown): value is string => isText(value) && Number.isFinite(Date.parse(value));
const isIntegerWithin = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const hasUniqueIds = (rows: { id: string }[]) => new Set(rows.map(row => row.id)).size === rows.length;

// Reject the entire local snapshot if it is incomplete or contains broken references.
export function validatePartnerData(value: unknown): value is PartnerData {
  if (!isRecord(value) || !validTerms(value.terms) || !isText(value.currentPartnerId)) return false;
  if (![value.partners, value.referrals, value.payments, value.ledger, value.payouts].every(Array.isArray)) return false;
  const { partners, referrals, payments, ledger, payouts } = value as unknown as PartnerData;
  if (!partners.length || !partners.every(p => isRecord(p) && isText(p.id) && isText(p.code) &&
    isText(p.name) && isText(p.email) && isString(p.company) && isText(p.channel) && isString(p.website) &&
    ['pending', 'approved', 'rejected'].includes(p.status) && isDate(p.appliedAt) && isString(p.reviewNote) &&
    (p.payoutDetails === null || validatePayoutDetails(p.payoutDetails)))) return false;
  if (!partners.some(p => p.id === value.currentPartnerId) || new Set(partners.map(p => p.code)).size !== partners.length) return false;
  if (!referrals.every(r => isRecord(r) && isText(r.id) && partners.some(p => p.id === r.partnerId) &&
    isText(r.company) && isDate(r.registeredAt) && ['trial', 'active', 'overdue', 'cancelled'].includes(r.status))) return false;
  if (!payments.every(p => isRecord(p) && isText(p.id) && referrals.some(r => r.id === p.referralId) &&
    isMoney(p.amount) && p.amount > 0 && isMoney(p.refundedAmount) && p.refundedAmount >= 0 &&
    p.refundedAmount <= p.amount && isDate(p.paidAt))) return false;
  if (!ledger.every(e => isRecord(e) && isText(e.id) && partners.some(p => p.id === e.partnerId) &&
    (e.referralId === null || referrals.some(r => r.id === e.referralId && r.partnerId === e.partnerId)) &&
    (e.paymentId === null || payments.some(p => p.id === e.paymentId && p.referralId === e.referralId)) &&
    ['commission', 'refund', 'adjustment'].includes(e.kind) && isMoney(e.amount) && e.amount !== 0 &&
    (e.kind !== 'commission' || (e.amount > 0 && e.paymentId !== null)) &&
    (e.kind !== 'refund' || (e.amount < 0 && e.paymentId !== null)) &&
    isDate(e.createdAt) && isDate(e.availableAt) && isText(e.description))) return false;
  if (!payouts.every(p => isRecord(p) && isText(p.id) && partners.some(partner => partner.id === p.partnerId) &&
    isMoney(p.amount) && p.amount > 0 && ['new', 'review', 'approved', 'paid', 'rejected'].includes(p.status) &&
    isDate(p.createdAt) && isString(p.reviewNote) && validatePayoutDetails(p.details) &&
    (p.status === 'paid'
      ? isMoney(p.paidAmount) && p.paidAmount > 0 && p.paidAmount <= p.amount && isDate(p.paidAt) && Date.parse(p.paidAt) >= Date.parse(p.createdAt)
      : p.paidAmount === null && p.paidAt === null))) return false;
  if (![partners, referrals, payments, ledger, payouts].every(hasUniqueIds)) return false;
  const commissions = ledger.filter(e => e.kind === 'commission');
  if (new Set(commissions.map(e => e.paymentId)).size !== commissions.length) return false;
  return payments.every(p => {
    const original = commissions.find(e => e.paymentId === p.id)?.amount ?? 0;
    const reversed = -ledger.filter(e => e.kind === 'refund' && e.paymentId === p.id).reduce((sum, e) => sum + e.amount, 0);
    return roundRub(reversed) === roundRub(original * p.refundedAmount / p.amount);
  });
}

export function createDemoPartnerData(now = new Date()): PartnerData {
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const details: PayoutDetails = {
    recipient: 'ООО «Бюро Сфера»', taxId: '7700000000', bank: 'Банк «Пример»',
    account: '40702810000000000001', bic: '044000000', legalForm: 'company',
  };
  const primary = 'partner-sfera';
  const data: PartnerData = {
    terms: { ...DEFAULT_PARTNER_TERMS }, currentPartnerId: primary,
    partners: [
      { id: primary, code: 'SFERA', name: 'Анна Смирнова', email: 'anna@sfera.example', company: 'Бюро Сфера', channel: 'Внедрение CRM и консалтинг', website: 'https://sfera.example', status: 'approved', appliedAt: ago(190), reviewNote: 'Заявка одобрена.', payoutDetails: details },
      { id: 'partner-vector', code: 'VECTOR', name: 'Михаил Орлов', email: 'mikhail@vector.example', company: 'Вектор Диджитал', channel: 'Маркетинговое агентство', website: 'https://vector.example', status: 'pending', appliedAt: ago(2), reviewNote: '', payoutDetails: null },
      { id: 'partner-praktika', code: 'PRAKTIKA', name: 'Елена Волкова', email: 'elena@praktika.example', company: 'Практика', channel: 'Образовательный канал', website: '', status: 'rejected', appliedAt: ago(9), reviewNote: 'Уточните тематику канала и план привлечения клиентов.', payoutDetails: null },
    ],
    referrals: [
      { id: 'ref-atelier', partnerId: primary, company: 'ООО «Ателье Пространства»', registeredAt: ago(170), status: 'active' },
      { id: 'ref-sever', partnerId: primary, company: 'ООО «Северный Маршрут»', registeredAt: ago(130), status: 'active' },
      { id: 'ref-liniya', partnerId: primary, company: 'Студия «Линия»', registeredAt: ago(80), status: 'overdue' },
      { id: 'ref-raketa', partnerId: primary, company: 'ООО «Ракета Проект»', registeredAt: ago(3), status: 'trial' },
      { id: 'ref-bereg', partnerId: primary, company: 'ООО «Тихий Берег»', registeredAt: ago(160), status: 'cancelled' },
    ],
    payments: [
      { id: 'DEMO-1001', referralId: 'ref-atelier', amount: 120_000, refundedAmount: 0, paidAt: ago(120) },
      { id: 'DEMO-1002', referralId: 'ref-sever', amount: 90_000, refundedAmount: 10_000, paidAt: ago(75) },
      { id: 'DEMO-1003', referralId: 'ref-liniya', amount: 70_000, refundedAmount: 0, paidAt: ago(30) },
      { id: 'DEMO-1004', referralId: 'ref-atelier', amount: 50_000, refundedAmount: 0, paidAt: ago(4) },
      { id: 'DEMO-1005', referralId: 'ref-bereg', amount: 25_000, refundedAmount: 25_000, paidAt: ago(95) },
    ],
    ledger: [],
    payouts: [
      { id: 'payout-paid', partnerId: primary, amount: 10_000, status: 'paid', createdAt: ago(90), reviewNote: 'Выплата подтверждена.', paidAt: ago(85), paidAmount: 10_000, details: { ...details } },
      { id: 'payout-review', partnerId: primary, amount: 5_000, status: 'review', createdAt: ago(5), reviewNote: 'Проверяем реквизиты.', paidAt: null, paidAmount: null, details: { ...details } },
      { id: 'payout-approved', partnerId: primary, amount: 5_000, status: 'approved', createdAt: ago(3), reviewNote: 'Готово к ручной выплате.', paidAt: null, paidAmount: null, details: { ...details } },
      { id: 'payout-new', partnerId: primary, amount: 5_000, status: 'new', createdAt: ago(1), reviewNote: '', paidAt: null, paidAmount: null, details: { ...details } },
      { id: 'payout-rejected', partnerId: primary, amount: 7_000, status: 'rejected', createdAt: ago(20), reviewNote: 'В заявке были устаревшие реквизиты. Создайте новую заявку.', paidAt: null, paidAmount: null, details: { ...details } },
    ],
  };
  data.ledger = data.payments.map((payment, index) => ({
    id: `ledger-commission-${index}`, partnerId: primary, referralId: payment.referralId, paymentId: payment.id,
    kind: 'commission', amount: roundRub(payment.amount * 0.2), createdAt: payment.paidAt,
    availableAt: new Date(Date.parse(payment.paidAt) + 14 * 86_400_000).toISOString(),
    description: `Комиссия 20% по оплате ${payment.id}`,
  }));
  for (const payment of data.payments.filter(p => p.refundedAmount > 0)) {
    data.ledger.push({ id: `ledger-refund-${payment.id}`, partnerId: primary, referralId: payment.referralId, paymentId: payment.id,
      kind: 'refund', amount: -roundRub(payment.refundedAmount * 0.2), createdAt: ago(25),
      availableAt: data.ledger.find(e => e.paymentId === payment.id)!.availableAt,
      description: `Возврат по оплате ${payment.id}: корректировка комиссии`,
    });
  }
  data.ledger.push({ id: 'ledger-adjustment', partnerId: primary, referralId: null, paymentId: null,
    kind: 'adjustment', amount: -500, createdAt: ago(18), availableAt: ago(18), description: 'Исправление суммы по акту сверки' });
  return data;
}
