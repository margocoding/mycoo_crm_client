import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Logo, IconCheck } from "./icons";
import { StatusChip, StatusDot } from "./ambient";

/* ================= context ================= */

const LaunchCtx = createContext<{ open: () => void }>({ open: () => {} });
export const useLaunch = () => useContext(LaunchCtx);

export function LaunchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <LaunchCtx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <RegisterOverlay open={open} onClose={() => setOpen(false)} />
    </LaunchCtx.Provider>
  );
}

/* ================= helpers ================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PHASES = [
  { id: "01", code: "IDENT", label: "Регистрация" },
  { id: "02", code: "CIPHER", label: "Пароль" },
  { id: "03", code: "VERIFY", label: "Подтверждение" },
  { id: "04", code: "LAUNCH", label: "Запуск" },
];

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ================= provider marks ================= */

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
      <path fill="#34A853" d="M12 21.5c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4H3.2v2.6A9.9 9.9 0 0 0 12 21.5Z" />
      <path fill="#FBBC05" d="M6.5 13.5a6 6 0 0 1 0-3.8V7.1H3.2a10 10 0 0 0 0 9l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6.4c1.5 0 2.8.5 3.8 1.5L18.7 5A9.7 9.7 0 0 0 12 2.5a9.9 9.9 0 0 0-8.8 4.6l3.3 2.6A5.9 5.9 0 0 1 12 6.4Z" />
    </svg>
  );
}
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M16.6 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8ZM14.3 5.6c.6-.8 1-1.9.9-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.3Z" />
    </svg>
  );
}
function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M21.7 3.3 2.9 10.6c-.9.3-.8 1.6.1 1.9l4.7 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.8-.7l2.3-15.6c.2-1-.7-1.7-1.2-1.4ZM9.4 13.6l8.4-7.5c.4-.3.8.2.5.5l-6.9 6.7-.3 3.2-1.7-2.9Z" />
    </svg>
  );
}

const SOCIALS = [
  { name: "Google", Mark: GoogleMark },
  { name: "Apple", Mark: AppleMark },
  { name: "Telegram", Mark: TelegramMark },
];

/* ================= overlay ================= */

function RegisterOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState(genCode);
  const [timer, setTimer] = useState(30);
  const [sent, setSent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const reqId = useMemo(() => `MC-${Math.floor(1000 + Math.random() * 9000)}`, []);

  /* body scroll lock + esc */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* reset on open */
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setEmail("");
    setPw("");
    setPw2("");
    setDigits(["", "", "", "", "", ""]);
    setEmailErr("");
    setPwErr("");
    setCodeErr("");
    setSocialNote("");
    setCode(genCode());
    setTimer(30);
    setSent(false);
    setTimeout(() => emailRef.current?.focus(), 120);
  }, [open]);

  /* resend countdown */
  useEffect(() => {
    if (!open || step !== 3 || timer <= 0) return;
    const t = setInterval(() => setTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [open, step, timer]);

  /* focus per step */
  useEffect(() => {
    if (!open) return;
    if (step === 2) setTimeout(() => pwRef.current?.focus(), 120);
    if (step === 3) setTimeout(() => boxRefs.current[0]?.focus(), 120);
  }, [step, open]);

  /* ---------- step 1: email ---------- */
  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr("Формат email не распознан — проверьте адрес.");
      setAttempt((a) => a + 1);
      return;
    }
    setEmailErr("");
    setSocialNote("");
    setStep(2);
  };

  /* ---------- step 2: password ---------- */
  const rules = [
    { ok: pw.length >= 8, label: "не менее 8 символов" },
    { ok: /\d/.test(pw) && /[a-zа-яё]/i.test(pw), label: "буквы и цифры" },
    { ok: /[A-ZА-ЯЁ]/.test(pw) && /[a-zа-яё]/.test(pw), label: "разный регистр букв" },
  ];
  const strength =
    rules.filter((r) => r.ok).length +
    (pw.length >= 12 ? 1 : 0) +
    (/[^a-zа-яё0-9]/i.test(pw) ? 1 : 0);
  const strengthMeta =
    strength <= 1
      ? { label: "слабый", color: "var(--color-crit)", w: "25%" }
      : strength === 2
        ? { label: "средний", color: "var(--color-warn)", w: "50%" }
        : strength === 4
          ? { label: "сильный", color: "var(--color-ok)", w: "78%" }
          : { label: "отличный", color: "var(--color-flux)", w: "100%" };
  const pwValid = rules.every((r) => r.ok) && pw2 === pw && pw2.length > 0;

  const submitPw = (e: FormEvent) => {
    e.preventDefault();
    if (!rules.every((r) => r.ok)) {
      setPwErr("Пароль не соответствует требованиям защиты контура.");
      setAttempt((a) => a + 1);
      return;
    }
    if (pw2 !== pw) {
      setPwErr("Пароли не совпадают.");
      setAttempt((a) => a + 1);
      return;
    }
    setPwErr("");
    setSent(true);
    setStep(3);
  };

  /* ---------- step 3: code ---------- */
  const onDigitChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setCodeErr("");
    if (d && i < 5) boxRefs.current[i + 1]?.focus();
    if (next.every((x) => x !== "")) verify(next.join(""));
  };
  const onDigitKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) boxRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) boxRefs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => text[i] ?? "");
    setDigits(next);
    if (text.length === 6) verify(text);
    else boxRefs.current[Math.min(text.length, 5)]?.focus();
  };
  const verify = (value: string) => {
    if (value === code) {
      setCodeErr("");
      setStep(4);
    } else {
      setCodeErr("Код не совпадает. Проверьте письмо и повторите ввод.");
      setAttempt((a) => a + 1);
      setTimeout(() => {
        setDigits(["", "", "", "", "", ""]);
        boxRefs.current[0]?.focus();
      }, 420);
    }
  };
  const resend = () => {
    setCode(genCode());
    setTimer(30);
    setSent(true);
    setCodeErr("");
    setDigits(["", "", "", "", "", ""]);
    boxRefs.current[0]?.focus();
  };

  if (!open) return null;

  const inputCls =
    "w-full rounded-md border border-line bg-void/70 px-4 py-3.5 text-[14.5px] text-snow placeholder:text-fog/45 outline-none transition-all duration-300 focus:border-flux/60 focus:shadow-[0_0_22px_-8px_rgba(56,189,248,0.65)]";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-void/85 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Регистрация MyCOO"
    >
      <div
        ref={panelRef}
        className="corner glass step-in relative my-4 w-full max-w-4xl rounded-xl shadow-[0_0_90px_-20px_rgba(56,189,248,0.35)]"
      >
        <span className="cx pointer-events-none absolute inset-0" />

        {/* panel header */}
        <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-7" />
            <div>
              <p className="font-display text-[13px] font-bold tracking-[0.18em] text-snow">
                MYCOO <span className="text-fog/60">/</span>{" "}
                <span className="text-flux">CREW REGISTRATION</span>
              </p>
              <p className="mono-label text-fog/50">
                ses {reqId} · mission start {Math.min(step * 25, 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block">
              <StatusChip tone={step === 4 ? "ok" : "flux"}>
                {step === 4 ? "onboard" : "secure channel"}
              </StatusChip>
            </span>
            <button
              onClick={onClose}
              aria-label="Закрыть регистрацию"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-fog transition-all duration-300 hover:border-crit/60 hover:text-crit"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* progress hairline */}
        <div className="h-0.5 w-full bg-hull/60">
          <div
            className="h-full bg-flux shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-all duration-700 ease-out"
            style={{ width: `${Math.min(step * 25, 100)}%` }}
          />
        </div>

        <div className="grid md:grid-cols-[240px_1fr]">
          {/* phase rail */}
          <aside className="hidden border-r border-line/60 p-6 md:block">
            <p className="mono-label mb-5 text-fog/60">фазы запуска</p>
            <ol className="relative space-y-6">
              <span className="absolute bottom-2 left-[11px] top-2 w-px bg-line/70" />
              {PHASES.map((p, i) => {
                const n = i + 1;
                const state = n < step ? "done" : n === step ? "active" : "idle";
                return (
                  <li key={p.code} className="relative flex items-center gap-3.5">
                    <span
                      className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                        state === "done"
                          ? "border-ok/60 bg-ok/10 text-ok"
                          : state === "active"
                            ? "border-flux bg-void text-flux shadow-[0_0_16px_-2px_rgba(56,189,248,0.8)]"
                            : "border-line bg-void text-fog/50"
                      }`}
                    >
                      {state === "done" ? <IconCheck className="h-3 w-3" /> : p.id}
                    </span>
                    <div>
                      <p
                        className={`font-mono text-[10px] font-bold tracking-[0.2em] ${
                          state === "active" ? "text-flux" : state === "done" ? "text-ok/80" : "text-fog/50"
                        }`}
                      >
                        T·{p.code}
                      </p>
                      <p className={`text-[12.5px] font-medium ${state === "idle" ? "text-fog/60" : "text-mist"}`}>
                        {p.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-9 rounded-md border border-line/60 bg-hull/30 p-3.5">
              <p className="mono-label text-fog/50">sys note</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog/80">
                Демо-режим: данные не покидают ваш браузер.
              </p>
            </div>
          </aside>

          {/* step content */}
          <div className="min-h-[420px] p-6 md:p-8">
            {/* -------- STEP 1 · EMAIL -------- */}
            {step === 1 && (
              <div key={`s1-${attempt}`} className={attempt ? "shake" : "step-in"}>
                <p className="mono-label text-flux">шаг 01 · идентификация</p>
                <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                  Регистрация по email
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                  Укажите рабочий email — на него придёт код подтверждения и план
                  запуска вашего цифрового операционного директора.
                </p>

                <form onSubmit={submitEmail} className="mt-6" noValidate>
                  <label htmlFor="reg-email" className="mono-label mb-2 block text-fog/70">
                    email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog/60">
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </span>
                    <input
                      id="reg-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailErr("");
                      }}
                      placeholder="you@company.ru"
                      className={`${inputCls} pl-11 ${emailErr ? "border-crit/60" : ""}`}
                    />
                    {EMAIL_RE.test(email.trim()) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ok">
                        <IconCheck className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  {emailErr && (
                    <p className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-crit">
                      <StatusDot color="var(--color-crit)" /> {emailErr}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary group mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-md bg-flux px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice hover:shadow-[0_0_44px_-8px_rgba(56,189,248,0.95)] sm:w-auto"
                  >
                    Продолжить
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h14M13 6.5 18.5 12 13 17.5" />
                    </svg>
                  </button>
                </form>

                {/* social */}
                <div className="mt-7">
                  <div className="flex items-center gap-4">
                    <span className="h-px flex-1 bg-line/60" />
                    <span className="mono-label text-fog/50">или через</span>
                    <span className="h-px flex-1 bg-line/60" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {SOCIALS.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setSocialNote(
                            `Вход через ${s.name} появится в следующем билде — используйте email.`
                          );
                          setEmailErr("");
                        }}
                        className="flex items-center justify-center gap-2.5 rounded-md border border-line bg-hull/30 px-3 py-3 text-[13px] font-semibold text-mist transition-all duration-300 hover:-translate-y-0.5 hover:border-flux/50 hover:text-snow hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.5)]"
                      >
                        <s.Mark />
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {socialNote && (
                    <p className="mt-3 flex items-start gap-2 rounded-md border border-warn/25 bg-warn/5 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-warn/90">
                      <StatusDot color="var(--color-warn)" />
                      {socialNote}
                    </p>
                  )}
                </div>

                <p className="mono-label mt-6 text-fog/40">
                  продолжая, вы принимаете условия обработки данных
                </p>
              </div>
            )}

            {/* -------- STEP 2 · PASSWORD -------- */}
            {step === 2 && (
              <div key={`s2-${attempt}`} className={attempt ? "shake" : "step-in"}>
                <p className="mono-label text-flux">шаг 02 · ключ доступа</p>
                <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                  Создайте пароль
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                  Ключ для аккаунта <span className="font-mono text-[12.5px] text-mist">{email}</span>.
                  Требования проверяются в реальном времени.
                </p>

                <form onSubmit={submitPw} className="mt-6" noValidate>
                  <label htmlFor="reg-pw" className="mono-label mb-2 block text-fog/70">
                    пароль
                  </label>
                  <div className="relative">
                    <input
                      id="reg-pw"
                      ref={pwRef}
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={(e) => {
                        setPw(e.target.value);
                        setPwErr("");
                      }}
                      placeholder="••••••••••"
                      className={`${inputCls} pr-12 ${pwErr ? "border-crit/60" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Скрыть пароль" : "Показать пароль"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fog/60 transition-colors hover:text-flux"
                    >
                      {showPw ? (
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4l16 16" />
                          <path d="M10.6 6.3A9.8 9.8 0 0 1 12 6.2c5 0 8.6 3.8 10 5.8-.6.8-1.6 2-3 3M6.4 8A11 11 0 0 0 2 12c1.4 2 5 5.8 10 5.8 1.2 0 2.3-.2 3.3-.6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.6-5.8 10-5.8S22 12 22 12s-3.6 5.8-10 5.8S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="2.6" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* strength */}
                  <div className="mt-3.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-hull/80">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: pw ? strengthMeta.w : "0%",
                          background: strengthMeta.color,
                          boxShadow: `0 0 10px ${strengthMeta.color}`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="mono-label text-fog/50">надёжность</span>
                      <span
                        className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
                        style={{ color: pw ? strengthMeta.color : "var(--color-fog)" }}
                      >
                        {pw ? strengthMeta.label : "—"}
                      </span>
                    </div>
                  </div>

                  {/* rules */}
                  <ul className="mt-4 space-y-2">
                    {rules.map((r) => (
                      <li key={r.label} className="flex items-center gap-2.5 text-[13px]">
                        <span
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all duration-300 ${
                            r.ok ? "border-ok/60 bg-ok/10 text-ok" : "border-line text-fog/40"
                          }`}
                        >
                          {r.ok && <IconCheck className="h-2.5 w-2.5" />}
                        </span>
                        <span className={r.ok ? "text-mist" : "text-fog/70"}>{r.label}</span>
                      </li>
                    ))}
                  </ul>

                  <label htmlFor="reg-pw2" className="mono-label mb-2 mt-5 block text-fog/70">
                    повторите пароль
                  </label>
                  <input
                    id="reg-pw2"
                    type={showPw ? "text" : "password"}
                    value={pw2}
                    onChange={(e) => {
                      setPw2(e.target.value);
                      setPwErr("");
                    }}
                    placeholder="••••••••••"
                    className={inputCls}
                  />
                  {pw2 && pw2 !== pw && (
                    <p className="mt-2 font-mono text-[11px] text-warn">пароли пока не совпадают</p>
                  )}
                  {pw2 && pw2 === pw && (
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-ok">
                      <IconCheck className="h-3 w-3" /> совпадает
                    </p>
                  )}
                  {pwErr && (
                    <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-crit">
                      <StatusDot color="var(--color-crit)" /> {pwErr}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={!pwValid}
                      className="btn-primary inline-flex items-center justify-center gap-2.5 rounded-md bg-flux px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 enabled:hover:bg-ice enabled:hover:shadow-[0_0_44px_-8px_rgba(56,189,248,0.95)] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
                    >
                      Отправить код подтверждения
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors hover:text-flux"
                    >
                      ← изменить email
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -------- STEP 3 · VERIFY -------- */}
            {step === 3 && (
              <div key={`s3-${attempt}`} className={attempt ? "shake" : "step-in"}>
                <p className="mono-label text-flux">шаг 03 · подтверждение email</p>
                <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                  Введите код из письма
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                  6-значный код отправлен на{" "}
                  <span className="font-mono text-[12.5px] text-mist">{email}</span>.
                </p>

                <div onPaste={onPaste} className="mt-7 flex justify-start gap-2 sm:gap-2.5">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        boxRefs.current[i] = el;
                      }}
                      value={d}
                      onChange={(e) => onDigitChange(i, e.target.value)}
                      onKeyDown={(e) => onDigitKey(i, e)}
                      inputMode="numeric"
                      maxLength={2}
                      aria-label={`Цифра кода ${i + 1}`}
                      className={`h-14 w-11 rounded-md border bg-void/70 text-center font-mono text-xl font-bold text-snow outline-none transition-all duration-300 focus:border-flux/70 focus:shadow-[0_0_18px_-6px_rgba(56,189,248,0.7)] sm:w-12 ${
                        codeErr ? "border-crit/60" : d ? "border-flux/50" : "border-line"
                      }`}
                    />
                  ))}
                </div>

                {codeErr && (
                  <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-crit">
                    <StatusDot color="var(--color-crit)" /> {codeErr}
                  </p>
                )}

                {/* demo console */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line/70 bg-void/60 px-4 py-3">
                  <p className="font-mono text-[11px] text-fog/70">
                    sys → demo code:{" "}
                    <span className="font-bold tracking-[0.3em] text-flux">{code}</span>
                  </p>
                  {sent && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ok/80">
                      transmitted
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {timer > 0 ? (
                    <span className="mono-label text-fog/55">
                      повторная отправка через 0:{String(timer).padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resend}
                      className="w-fit rounded-md border border-line px-4 py-2.5 text-[12.5px] font-semibold text-mist transition-all duration-300 hover:border-flux/60 hover:text-flux"
                    >
                      Отправить код повторно
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-md px-4 py-2.5 text-left text-[13px] font-semibold text-fog transition-colors hover:text-flux sm:ml-auto"
                  >
                    ← изменить пароль
                  </button>
                </div>
              </div>
            )}

            {/* -------- STEP 4 · SUCCESS -------- */}
            {step === 4 && (
              <div className="step-in">
                <div className="flex items-start gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ok/50 bg-ok/10 shadow-[0_0_30px_-6px_rgba(52,211,153,0.5)]">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="var(--color-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path className="draw-path" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="mono-label text-ok">mission start · complete</p>
                    <h3 className="font-display mt-1.5 text-xl font-bold text-snow md:text-2xl">
                      Операционный контур активен
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                      Аккаунт создан, email подтверждён. Оператор MyCOO свяжется с
                      вами для конфигурации и запуска.
                    </p>
                  </div>
                </div>

                {/* boot log */}
                <div className="mt-7 space-y-2 rounded-md border border-line/70 bg-void/60 p-4 font-mono text-[12px]">
                  {[
                    { t: "identity verified", d: 0.15 },
                    { t: "security key stored", d: 0.45 },
                    { t: "email confirmed", d: 0.75 },
                    { t: "mycoo core · online", d: 1.05 },
                  ].map((l) => (
                    <p key={l.t} className="log-in flex items-center gap-2.5 text-fog/85" style={{ animationDelay: `${l.d}s` }}>
                      <span className="text-ok">▸</span> {l.t}
                      {l.t.includes("online") && <StatusDot />}
                    </p>
                  ))}
                </div>

                {/* summary */}
                <div className="mt-5 grid gap-2.5 rounded-md border border-line/70 bg-hull/30 p-4 sm:grid-cols-2">
                  <div>
                    <p className="mono-label text-fog/55">аккаунт</p>
                    <p className="mt-1 truncate font-mono text-[13px] text-mist">{email}</p>
                  </div>
                  <div>
                    <p className="mono-label text-fog/55">метод доступа</p>
                    <p className="mt-1 font-mono text-[13px] text-mist">email + key · verified</p>
                  </div>
                  <div>
                    <p className="mono-label text-fog/55">req id</p>
                    <p className="mt-1 font-mono text-[13px] text-mist">{reqId}</p>
                  </div>
                  <div>
                    <p className="mono-label text-fog/55">статус</p>
                    <p className="mt-1 flex items-center gap-2 font-mono text-[13px] text-ok">
                      <StatusDot /> onboard
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onClose}
                    className="btn-primary inline-flex items-center justify-center gap-2.5 rounded-md bg-flux px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice"
                  >
                    Вернуться на борт
                  </button>
                  <a
                    href="mailto:hello@mycoo.ai"
                    className="inline-flex items-center justify-center rounded-md border border-line px-6 py-3.5 text-[13.5px] font-semibold text-mist transition-all duration-300 hover:border-flux/50 hover:text-snow"
                  >
                    Связаться с оператором
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
