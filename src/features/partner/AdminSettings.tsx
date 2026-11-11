import { useState, type FormEvent } from 'react';
import { LuLockKeyhole, LuSave, LuSlidersHorizontal } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';

export function AdminSettings() {
  const store = usePartnerStore();
  const [percent, setPercent] = useState(String(store.terms.commissionPercent));
  const [months, setMonths] = useState(String(store.terms.eligibleMonths));
  const [days, setDays] = useState(String(store.terms.holdDays));
  const [minimum, setMinimum] = useState(String(store.terms.minimumPayout));
  const [termsError, setTermsError] = useState('');
  const [termsNotice, setTermsNotice] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [login, setLogin] = useState(store.adminLogin);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsNotice, setCredentialsNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveTerms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (store.mutating) return;
    setTermsError('');
    setTermsNotice('');
    if ([percent, months, days, minimum].some(value => value.trim() === '')) { setTermsError('Заполните все условия программы.'); return; }
    const terms = { commissionPercent: Number(percent), eligibleMonths: Number(months), holdDays: Number(days), minimumPayout: Number(minimum) };
    if (!Number.isInteger(terms.eligibleMonths) || !Number.isInteger(terms.holdDays)) { setTermsError('Срок начислений и удержания указываются целым числом.'); return; }
    const result = await store.updateTerms(terms);
    if (!result.ok) { setTermsError(result.error); return; }
    setTermsNotice('Условия программы сохранены.');
  }

  async function saveCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setCredentialsError('');
    setCredentialsNotice('');
    if (password !== confirmation) { setCredentialsError('Новый пароль и подтверждение не совпадают.'); return; }
    if (!login.trim()) { setCredentialsError('Укажите новый логин.'); return; }
    setBusy(true);
    try {
      const result = await store.updateAdminCredentials(currentPassword, login.trim(), password);
      if (!result.ok) { setCredentialsError(result.error); return; }
      setCurrentPassword('');
      setPassword('');
      setConfirmation('');
      setCredentialsNotice('Данные для входа обновлены. При следующем входе используйте новый логин и пароль.');
    } catch {
      setCredentialsError('Не удалось сохранить данные. Повторите попытку.');
    } finally { setBusy(false); }
  }

  return <>
    <div className="p-page-head"><div><span className="p-kicker">Управление программой</span><h1>Настройки</h1><p>Условия для партнёров и доступ к кабинету администратора.</p></div></div>
    <div className="p-grid-2" style={{ alignItems: 'start' }}>
      <section className="p-panel">
        <div className="p-panel-head"><div><h2><LuSlidersHorizontal aria-hidden="true" /> Условия программы</h2><p className="p-muted">Изменения применяются к новым начислениям. Уже сохранённые операции остаются в истории.</p></div></div>
        <form onSubmit={saveTerms} className="p-form">
          <div className="p-grid-2"><label className="p-field"><span>Комиссия партнёра, %</span><input type="number" min="0" max="100" step="1" value={percent} onChange={event => { setPercent(event.target.value); setTermsNotice(''); }} required /></label><label className="p-field"><span>Период начислений, мес.</span><input type="number" min="1" max="120" step="1" value={months} onChange={event => { setMonths(event.target.value); setTermsNotice(''); }} required /></label></div>
          <div className="p-grid-2"><label className="p-field"><span>Удержание после оплаты, дней</span><input type="number" min="0" max="365" step="1" value={days} onChange={event => { setDays(event.target.value); setTermsNotice(''); }} required /></label><label className="p-field"><span>Минимальная выплата, ₽</span><input type="number" min="0.01" step="0.01" value={minimum} onChange={event => { setMinimum(event.target.value); setTermsNotice(''); }} required /></label></div>
          <p className="p-muted">Период начислений отсчитывается от регистрации привлечённого клиента. После удержания комиссия становится доступна к выплате.</p>
          {termsError && <p className="p-notice warning" role="alert">{termsError}</p>}
          {termsNotice && <p className="p-notice success" role="status">{termsNotice}</p>}
          <button className="p-button primary" type="submit" disabled={store.mutating}><LuSave aria-hidden="true" /> Сохранить условия</button>
        </form>
      </section>
      <section className="p-panel">
        <div className="p-panel-head"><div><h2><LuLockKeyhole aria-hidden="true" /> Данные для входа</h2><p className="p-muted">Текущий логин: <strong>{store.adminLogin}</strong></p></div></div>
        <form onSubmit={saveCredentials} className="p-form">
          <label className="p-field"><span>Текущий пароль</span><input type="password" name="current-password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required /></label>
          <label className="p-field"><span>Новый логин</span><input name="username" autoComplete="username" autoCapitalize="none" minLength={3} maxLength={100} value={login} onChange={event => setLogin(event.target.value)} required /></label>
          <label className="p-field"><span>Новый пароль</span><input type="password" name="new-password" autoComplete="new-password" minLength={8} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} required /><small className="p-muted">От 8 до 256 символов.</small></label>
          <label className="p-field"><span>Повторите новый пароль</span><input type="password" name="confirm-password" autoComplete="new-password" minLength={8} maxLength={256} value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label>
          {credentialsError && <p className="p-notice warning" role="alert">{credentialsError}</p>}
          {credentialsNotice && <p className="p-notice success" role="status">{credentialsNotice}</p>}
          <button className="p-button primary" type="submit" disabled={busy || store.mutating}><LuSave aria-hidden="true" /> {busy ? 'Сохраняем…' : 'Сохранить данные для входа'}</button>
        </form>
      </section>
    </div>
  </>;
}

export default AdminSettings;
