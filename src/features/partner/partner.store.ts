import { create } from 'zustand';
import { authApi } from '../../api/auth.api';
import { ApiError, errorMessage, TOKEN_KEY } from '../../api/base.api';
import { getAdminToken, partnerApi, saveAdminToken, setAdminActor, setPartnerActor } from '../../api/partner.api';
import { useAuthStore } from '../../store/auth.store';
import type { ActionResult, PartnerData, PartnerScope, PartnerStore } from './partner.types';

const emptyData = (): PartnerData => ({ partners: [], referrals: [], payments: [], ledger: [], payouts: [], currentPartnerId: '', terms: { commissionPercent: 0, eligibleMonths: 0, holdDays: 0, minimumPayout: 0 } });
let revision = 0;
let mutationRevision = 0;
let pendingLoad: { scope: PartnerScope; promise: Promise<void> } | null = null;
const fail = (error: string): ActionResult => ({ ok: false, error });

export const usePartnerStore = create<PartnerStore>((set, get) => {
  const clear = (scope: PartnerScope | null = null) => {
    revision++;
    mutationRevision++;
    pendingLoad = null;
    set({ ...emptyData(), scope, loaded: false, loading: false, loadError: '', mutating: false });
  };
  const mutate = async (path: string, body: object, admin = false, method: 'post' | 'put' = 'post', idempotent = false): Promise<ActionResult> => {
    if (get().mutating) return fail('Предыдущая операция ещё выполняется.');
    if (!get().loaded || get().loadError) return fail('Сначала обновите данные кабинета.');
    if (get().scope !== (admin ? 'admin' : 'partner') || !(admin ? get().adminAuthenticated : get().partnerAuthenticated)) return fail('Войдите в кабинет заново.');
    const current = revision;
    const operation = ++mutationRevision;
    set({ mutating: true });
    try {
      const result = await partnerApi.mutate(path, body, admin, method, idempotent);
      if (current !== revision) return fail('Сессия изменилась. Обновите кабинет, чтобы проверить результат.');
      if (!result.ok) return result;
      // A focus refresh may have started before the write. Fetch a new snapshot
      // after confirmation instead of reusing that older in-flight GET.
      pendingLoad = null;
      await get().load(admin ? 'admin' : 'partner');
      return result;
    } catch (error) { return fail(errorMessage(error)); }
    finally { if (operation === mutationRevision) set({ mutating: false }); }
  };
  return {
    ...emptyData(), scope: null, loading: false, loaded: false, loadError: '', mutating: false,
    partnerAuthenticated: false, adminAuthenticated: false, adminLogin: '',
    invalidate: scope => {
      clear(scope);
      if (scope === 'admin') { setAdminActor(null); set({ adminAuthenticated: false, adminLogin: '' }); }
      if (scope === 'partner') { setPartnerActor(null); set({ partnerAuthenticated: false }); }
    },
    load: scope => {
      if (pendingLoad?.scope === scope) return pendingLoad.promise;
      const changed = get().scope !== scope;
      const current = ++revision;
      if (changed) set({ ...emptyData(), loaded: false, scope, loadError: '' });
      set({ loading: !get().loaded, loadError: '' });
      const promise = (async () => {
        try {
          if (scope === 'public') {
            const terms = await partnerApi.terms();
            if (current === revision) set({ terms, loaded: true });
          } else if (scope === 'admin') {
            if (!getAdminToken()) { if (current === revision) set({ ...emptyData(), adminAuthenticated: false, adminLogin: '', loaded: true }); return; }
            const [session, data] = await Promise.all([partnerApi.adminSession(), partnerApi.data(true)]);
            if (current === revision) { setAdminActor(session.adminId); set({ ...data, currentPartnerId: '', adminLogin: session.login, adminAuthenticated: true, loaded: true }); }
          } else {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) { if (current === revision) set({ ...emptyData(), partnerAuthenticated: false, loaded: true }); return; }
            const [user, data] = await Promise.all([authApi.me(), partnerApi.data(false)]);
            if (current === revision && token === localStorage.getItem(TOKEN_KEY)) {
              useAuthStore.getState().saveSession(token, user);
              setPartnerActor(user.id);
              set({ ...data, partnerAuthenticated: true, loaded: true });
            }
          }
        } catch (error) {
          if (current !== revision) return;
          if (error instanceof ApiError && error.status === 401) {
            if (scope === 'partner') useAuthStore.getState().clearSession();
            else saveAdminToken(null);
            set({ ...emptyData(), loaded: true, ...(scope === 'admin' ? { adminAuthenticated: false, adminLogin: '' } : { partnerAuthenticated: false }) });
          } else set({ loadError: errorMessage(error) });
        } finally {
          if (current === revision) set({ loading: false });
        }
      })().finally(() => { if (pendingLoad?.promise === promise) pendingLoad = null; });
      pendingLoad = { scope, promise };
      return promise;
    },
    logoutPartner: () => { useAuthStore.getState().clearSession(); setPartnerActor(null); clear('partner'); set({ partnerAuthenticated: false, loaded: true }); },
    registerPartner: input => mutate('/partners/register', input),
    updateDetails: (_id, details) => mutate('/partners/me/details', details, false, 'put'),
    requestPayout: (_partnerId, amount) => mutate('/partners/me/payouts', { amount }, false, 'post', true),
    reviewPayout: (id, status, reason = '') => mutate(`/partner-admin/payouts/${encodeURIComponent(id)}/review`, { status, reason }, true),
    markPaid: (id, amount, date) => mutate(`/partner-admin/payouts/${encodeURIComponent(id)}/pay`, { amount, date }, true, 'post', true),
    adjustCommission: (partnerId, amount, description, paymentId) => mutate('/partner-admin/adjustments', { partnerId, amount, description, ...(paymentId ? { paymentId } : {}) }, true, 'post', true),
    recordPayment: (referralId, paymentId, amount, date) => mutate('/partner-admin/payments', { referralId, paymentId, amount, ...(date ? { date } : {}) }, true, 'post', true),
    refundPayment: (paymentId, amount, reason) => mutate(`/partner-admin/payments/${encodeURIComponent(paymentId)}/refunds`, { amount, reason }, true, 'post', true),
    updateTerms: terms => mutate('/partner-admin/terms', terms, true, 'put'),
    loginAdmin: async (login, password) => {
      try {
        const session = await partnerApi.adminLogin(login, password);
        saveAdminToken(session.token);
        setAdminActor(session.adminId);
        clear();
        set({ adminLogin: session.login, adminAuthenticated: true });
        await get().load('admin');
        return get().loadError ? fail(get().loadError) : { ok: true };
      } catch (error) { return fail(errorMessage(error)); }
    },
    logoutAdmin: async () => {
      try { await partnerApi.adminLogout(); }
      finally { saveAdminToken(null); setAdminActor(null); clear('admin'); set({ adminAuthenticated: false, adminLogin: '', loaded: true }); }
    },
    updateAdminCredentials: async (currentPassword, login, password) => {
      if (get().mutating) return fail('Предыдущая операция ещё выполняется.');
      set({ mutating: true });
      try {
        const session = await partnerApi.adminCredentials(currentPassword, login, password);
        saveAdminToken(session.token);
        setAdminActor(session.adminId);
        set({ adminLogin: session.login, adminAuthenticated: true });
        return { ok: true };
      } catch (error) { return fail(errorMessage(error)); }
      finally { set({ mutating: false }); }
    },
  };
});
