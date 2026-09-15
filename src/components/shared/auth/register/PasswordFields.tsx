import { useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { passwordRules, passwordStrength } from '@/lib/password';

interface Props {
  mode: 'login' | 'register';
  password: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  idPrefix?: string;
}

export default function PasswordFields({
  mode, password, confirmation, onPasswordChange, onConfirmationChange,
  error, disabled, idPrefix = 'auth',
}: Props) {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(password);
  return <>
    <Input id={idPrefix + '-pw'} label="пароль" type={visible ? 'text' : 'password'} autoFocus
      autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={128}
      value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="••••••••••"
      disabled={disabled} iconLeft={<FiLock className="h-4 w-4" />} error={error}
      addonRight={<Button type="button" variant="ghost" onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'} className="!p-0 !text-fog/60 hover:!text-flux">
        {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </Button>}
    />
    {mode === 'register' && <>
      <div className="mt-3.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-hull/80">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: password ? strength.w : '0%', background: strength.color }} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="mono-label text-fog/50">надёжность</span>
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: password ? strength.color : 'var(--color-fog)' }}>{password ? strength.label : '—'}</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {passwordRules(password).map((rule) => <li key={rule.label} className="flex items-center gap-2.5 text-[13px]">
          <span className={'flex h-4.5 w-4.5 items-center justify-center rounded-full border ' +
            (rule.ok ? 'border-ok/60 bg-ok/10 text-ok' : 'border-line text-fog/40')}>
            {rule.ok && <FiCheck className="h-2.5 w-2.5" />}
          </span>
          <span className={rule.ok ? 'text-mist' : 'text-fog/70'}>{rule.label}</span>
        </li>)}
      </ul>
      <div className="mt-5">
        <Input id={idPrefix + '-pw2'} label="повторите пароль" type={visible ? 'text' : 'password'}
          autoComplete="new-password" value={confirmation} disabled={disabled} maxLength={128}
          onChange={(e) => onConfirmationChange(e.target.value)} placeholder="••••••••••"
          warn={confirmation && confirmation !== password ? 'пароли пока не совпадают' : undefined}
          ok={confirmation && confirmation === password ? 'совпадает' : undefined} />
      </div>
    </>}
  </>;
}
