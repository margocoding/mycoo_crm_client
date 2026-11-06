export type ReferralStatus = "trial" | "active" | "overdue" | "cancelled";
export type PayoutStatus = "new" | "review" | "approved" | "paid" | "rejected";
export type LedgerKind = "commission" | "refund" | "adjustment";

// Prototype amounts are expressed in RUB; no external payments are performed.
export interface ProgramTerms {
  commissionPercent: number;
  eligibleMonths: number;
  holdDays: number;
  minimumPayout: number;
}
export interface PayoutDetails {
  recipient: string;
  taxId: string;
  bank: string;
  account: string;
  bic: string;
  legalForm: "self-employed" | "entrepreneur" | "company";
}
export interface Partner {
  id: string;
  code: string;
  name: string;
  email: string;
  company: string;
  channel: string;
  website: string;
  registeredAt: string;
  payoutDetails: PayoutDetails | null;
}
export type PartnerRegistration = Pick<Partner, "name" | "email" | "company" | "channel" | "website">;
export interface Referral {
  id: string;
  partnerId: string;
  company: string;
  registeredAt: string;
  status: ReferralStatus;
}
export interface ClientPayment {
  id: string;
  referralId: string;
  amount: number;
  refundedAmount: number;
  paidAt: string;
}
export interface LedgerEntry {
  id: string;
  partnerId: string;
  referralId: string | null;
  paymentId: string | null;
  kind: LedgerKind;
  amount: number;
  createdAt: string;
  availableAt: string;
  description: string;
}
export interface PartnerPayout {
  id: string;
  partnerId: string;
  amount: number;
  status: PayoutStatus;
  createdAt: string;
  reviewNote: string;
  paidAt: string | null;
  paidAmount: number | null;
  details: PayoutDetails;
}
export interface PartnerData {
  partners: Partner[];
  referrals: Referral[];
  payments: ClientPayment[];
  ledger: LedgerEntry[];
  payouts: PartnerPayout[];
  terms: ProgramTerms;
  currentPartnerId: string;
}
export interface PartnerBalance {
  totalAccrued: number;
  pending: number;
  available: number;
  reserved: number;
  paid: number;
  debt: number;
}
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
export interface PartnerStore extends PartnerData {
  adminLogin: string;
  adminAuthenticated: boolean;
  selectPartner: (id: string) => void;
  registerPartner: (input: PartnerRegistration) => ActionResult;
  updateDetails: (id: string, details: PayoutDetails) => ActionResult;
  requestPayout: (partnerId: string, amount: number) => ActionResult;
  reviewPayout: (id: string, status: "review" | "approved" | "rejected", reason?: string) => ActionResult;
  markPaid: (id: string, amount: number, date: string) => ActionResult;
  adjustCommission: (partnerId: string, amount: number, description: string, paymentId?: string) => ActionResult;
  recordPayment: (referralId: string, paymentId: string, amount: number, date?: string) => ActionResult;
  refundPayment: (paymentId: string, amount: number, reason: string) => ActionResult;
  updateTerms: (terms: ProgramTerms) => ActionResult;
  loginAdmin: (login: string, password: string) => Promise<ActionResult>;
  logoutAdmin: () => void;
  updateAdminCredentials: (currentPassword: string, login: string, password: string) => Promise<ActionResult>;
  resetDemo: () => void;
}
