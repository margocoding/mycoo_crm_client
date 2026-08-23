import { useState, FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface RegisterStepEmailProps {
  email: string;
  setEmail: (email: string) => void;
  emailErr: string;
  setEmailErr: (err: string) => void;
  onNext: () => void;
  onSocialLogin?: (provider: string) => void;
}

export function RegisterStepEmail({
  email,
  setEmail,
  emailErr,
  setEmailErr,
  onNext,
  onSocialLogin,
}: RegisterStepEmailProps) {
  const [attempt, setAttempt] = useState(0);
  const [socialNote, setSocialNote] = useState("");

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr("Формат email не распознан — проверьте адрес.");
      setAttempt((a) => a + 1);
      return;
    }
    setEmailErr("");
    setSocialNote("");
    onNext();
  };

  const handleSocialLogin = (provider: string) => {
    setSocialNote(`Вход через ${provider} будет реализован в демо-режиме`);
    onSocialLogin?.(provider);
  };

  const inputCls =
    "w-full rounded-md border border-line bg-void/70 px-4 py-3.5 text-[14.5px] text-snow placeholder:text-fog/45 outline-none transition-all duration-300 focus:border-flux/60 focus:shadow-[0_0_22px_-8px_rgba(56,189,248,0.65)]";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-[0.15em] text-snow">
          ИДЕНТИФИКАЦИЯ
        </h2>
        <p className="mt-1 text-sm text-fog/70">
          Введите email для начала регистрации
        </p>
      </div>

      <form onSubmit={submitEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-fog/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailErr("");
            }}
            className={inputCls}
            placeholder="name@example.com"
            autoFocus
          />
          {emailErr && (
            <p className="mt-1.5 text-xs text-crit">{emailErr}</p>
          )}
        </div>

        {socialNote && (
          <p className="text-xs text-warn">{socialNote}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-flux/90 py-3.5 text-sm font-semibold text-void shadow-[0_0_20px_-4px_rgba(56,189,248,0.5)] transition-all duration-300 hover:bg-flux hover:shadow-[0_0_28px_-2px_rgba(56,189,248,0.7)]"
        >
          Продолжить
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-hull/30 px-3 text-xs text-fog/60">или войдите через</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocialLogin("Яндекс")}
          className="flex items-center justify-center gap-2 rounded-md border border-line bg-void/50 py-2.5 text-sm font-medium text-snow transition-all duration-300 hover:border-line/80 hover:bg-hull/40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <rect width="24" height="24" rx="6" fill="#FC3F1D" />
            <text
              x="12"
              y="17.4"
              textAnchor="middle"
              fontSize="14"
              fontWeight="800"
              fill="#fff"
              fontFamily="inherit"
            >
              Я
            </text>
          </svg>
          Яндекс ID
        </button>
        <button
          onClick={() => handleSocialLogin("VK")}
          className="flex items-center justify-center gap-2 rounded-md border border-line bg-void/50 py-2.5 text-sm font-medium text-snow transition-all duration-300 hover:border-line/80 hover:bg-hull/40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <rect width="24" height="24" rx="6" fill="#0077FF" />
            <text
              x="12"
              y="16.4"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              letterSpacing="0.5"
              fill="#fff"
              fontFamily="inherit"
            >
              VK
            </text>
          </svg>
          VK ID
        </button>
      </div>

      <p className="text-center text-xs text-fog/50">
        Демо-режим: данные не покидают ваш браузер
      </p>
    </div>
  );
}
