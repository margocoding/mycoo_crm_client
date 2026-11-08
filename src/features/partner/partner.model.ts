import type { PartnerBalance, PartnerData } from './partner.types.ts';

const moscowCalendar = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
export const partnerDateInput = (value = new Date()) => moscowCalendar.format(value);

export const roundRub = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
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
