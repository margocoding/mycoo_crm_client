import { useState, FormEvent } from "react";

export interface RegisterStepPasswordProps {
  password: string;
  setPassword: (pw: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (pw2: string) => void;
  passwordErr: string;
  setPasswordErr: (err: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function RegisterStepPassword({
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  passwordErr,
  setPasswordErr,
  onNext,
  onBack,
}: RegisterStepPasswordProps) {
  const [showPw, setShowPw] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const rules = [
    { ok: password.length >= 8, label: "не менее 8 символов" },
    { ok: /\d/.test(password) && /[a-zа-яё]/i.test(password), label: "буквы и цифры" },
    { ok: /[A-ZА-ЯЁ]/.test(password) && /[a-zа-яё]/.test(password), label: "разный регистр букв" },
  ];
  
  const strength =
    rules.filter((r) => r.ok).length +
    (password.length >= 12 ? 1 : 0) +
    (/[^a-zа-яё0-9]/i.test(password) ? 1 : 0);
    
  const strengthMeta =
    strength <= 1
      ? { label: "слабый", color: "var(--color-crit)", w: "25%" }
      : strength === 2
        ? { label: "средний", color: "var(--color-warn)", w: "50%" }
        : strength === 4
          ? { label: "сильный", color: "var(--color-ok)", w: "78%" }
          : { label: "отличный", color: "var(--color-flux)", w: "100%" };
          
  const pwValid = rules.every((r) => r.ok) && passwordConfirm === password && passwordConfirm.length > 0;

  const submitPw = (e: FormEvent) => {
    e.preventDefault();
    if (!rules.every((r) => r.ok)) {
      setPasswordErr("Пароль не соответствует требованиям защиты контура.");
      setAttempt((a) => a + 1);
      return;
    }
    if (passwordConfirm !== password) {
      setPasswordErr("Пароли не совпадают.");
      setAttempt((a) => a + 1);
      return;
    }
    setPasswordErr("");
    onNext();
  };

  const inputCls =
    "w-full rounded-md border border-line bg-void/70 px-4 py-3.5 text-[14.5px] text-snow placeholder:text-fog/45 outline-none transition-all duration-300 focus:border-flux/60 focus:shadow-[0_0_22px_-8px_rgba(56,189,248,0.65)]";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-[0.15em] text-snow">
          ПАРОЛЬ
        </h2>
        <p className="mt-1 text-sm text-fog/70">
          Создайте надежный пароль для защиты аккаунта
        </p>
      </div>

      <form onSubmit={submitPw} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-fog/70">
            Пароль
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordErr("");
              }}
              className={inputCls}
              placeholder="••••••••"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fog/50 hover:text-fog"
            >
              {showPw ? (
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
                  <circle cx="8" cy="8" r="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
                  <circle cx="8" cy="8" r="2" />
                  <path d="M1 1l14 14" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-fog/60">Надежность пароля</span>
            <span className="text-xs font-medium" style={{ color: strengthMeta.color }}>
              {strengthMeta.label}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-hull/50">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: strengthMeta.w, backgroundColor: strengthMeta.color }}
            />
          </div>
          <ul className="space-y-1">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    rule.ok ? "bg-ok/20 text-ok" : "bg-hull/30 text-fog/40"
                  }`}
                >
                  {rule.ok && (
                    <svg viewBox="0 0 8 8" className="h-2 w-2" fill="currentColor">
                      <path d="M2.5 4L4 5.5 6.5 2" stroke="currentColor" strokeWidth="1" fill="none" />
                    </svg>
                  )}
                </span>
                <span className={rule.ok ? "text-fog/70" : "text-fog/40"}>{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="mb-1.5 block text-xs font-medium text-fog/70">
            Подтвердите пароль
          </label>
          <input
            id="passwordConfirm"
            type={showPw ? "text" : "password"}
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setPasswordErr("");
            }}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>

        {passwordErr && (
          <p className="text-xs text-crit">{passwordErr}</p>
        )}

        <div className="flex gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-md border border-line bg-void/50 py-3.5 text-sm font-medium text-snow transition-all duration-300 hover:bg-hull/40"
            >
              Назад
            </button>
          )}
          <button
            type="submit"
            disabled={!pwValid}
            className="flex-1 rounded-md bg-flux/90 py-3.5 text-sm font-semibold text-void shadow-[0_0_20px_-4px_rgba(56,189,248,0.5)] transition-all duration-300 hover:bg-flux hover:shadow-[0_0_28px_-2px_rgba(56,189,248,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Продолжить
          </button>
        </div>
      </form>
    </div>
  );
}
