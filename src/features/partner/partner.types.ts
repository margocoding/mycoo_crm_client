export type ReferralStatus = "trial" | "active" | "overdue" | "cancelled";
export type PayoutStatus = "new" | "review" | "approved" | "paid" | "rejected";
export type LedgerKind = "commission" | "refund" | "adjustment";

// API amounts are expressed in RUB; calculations and authorization run on the server.
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
export type PartnerRegistration = Pick<Partner, "name" | "company" | "channel" | "website">;
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
  actor?: string;
}
export interface PartnerNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}
export interface PartnerPayoutEvent {
  id: string;
  status: PayoutStatus;
  note: string;
  actor: string;
  createdAt: string;
  amount: number | null;
}
export interface PartnerPage<T> { items: T[]; nextCursor: string | null }
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
  notificationUnreadCount?: number;
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
export type PartnerScope = 'public' | 'partner' | 'admin';
export interface PartnerStore extends PartnerData {
  scope: PartnerScope | null;
  loading: boolean;
  loaded: boolean;
  loadError: string;
  mutating: boolean;
  partnerAuthenticated: boolean;
  adminLogin: string;
  adminAuthenticated: boolean;
  load: (scope: PartnerScope) => Promise<void>;
  invalidate: (scope: PartnerScope) => void;
  logoutPartner: () => void;
  registerPartner: (input: PartnerRegistration) => Promise<ActionResult>;
  updateDetails: (id: string, details: PayoutDetails) => Promise<ActionResult>;
  requestPayout: (partnerId: string, amount: number) => Promise<ActionResult>;
  reviewPayout: (id: string, status: "review" | "approved" | "rejected", reason?: string) => Promise<ActionResult>;
  markPaid: (id: string, amount: number, date: string) => Promise<ActionResult>;
  adjustCommission: (partnerId: string, amount: number, description: string, paymentId?: string) => Promise<ActionResult>;
  recordPayment: (referralId: string, paymentId: string, amount: number, date?: string) => Promise<ActionResult>;
  refundPayment: (paymentId: string, amount: number, reason: string) => Promise<ActionResult>;
  updateTerms: (terms: ProgramTerms) => Promise<ActionResult>;
  loginAdmin: (login: string, password: string) => Promise<ActionResult>;
  logoutAdmin: () => Promise<void>;
  updateAdminCredentials: (currentPassword: string, login: string, password: string) => Promise<ActionResult>;
}
