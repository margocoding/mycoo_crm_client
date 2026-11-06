import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';

export function AdminLogin() {
  const { adminAuthenticated, loginAdmin } = usePartnerStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (adminAuthenticated) return <Navigate to="/admin" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const result = await loginAdmin(login.trim(), password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from?.startsWith('/admin') && from !== '/admin/login' ? from : '/admin', { replace: true });
    } catch {
      setError('Не удалось войти. Повторите попытку.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-auth p-panel">
      <div className="p-page-head" style={{ marginBottom: 24 }}>
        <div>
          <span className="p-kicker">Управление программой</span>
          <h1>Вход администратора</h1>
          <p>Партнёры, начисления и заявки на выплату — в одном кабинете.</p>
        </div>
      </div>
        <form onSubmit={submit} className="p-form">
          <label className="p-field"><span>Логин</span><input name="username" autoComplete="username" autoCapitalize="none" value={login} onChange={event => setLogin(event.target.value)} required autoFocus /></label>
          <label className="p-field"><span>Пароль</span><input name="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          {error && <p className="p-notice warning" role="alert">{error}</p>}
          <button className="p-button primary" type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти в кабинет'}<LuArrowRight aria-hidden="true" /></button>
        </form>
      <p className="p-muted" style={{ marginTop: 20 }}><Link to="/partner">Вернуться к партнёрской программе</Link></p>
    </div>
  );
}

export default AdminLogin;
