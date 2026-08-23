import { useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { Logo, IconCheck } from "./icons";
import { StatusChip } from "./ambient";
import {
  RegisterStepEmail,
  RegisterStepPassword,
  RegisterStepCode,
  RegisterStepLaunch,
} from "./Register/index";
import { OnboardingModal, type Profile } from "./ui";
import { DiagnosticsModal } from "./ui";
import { useNavigate } from "react-router-dom";

const PHASES = [
  { id: "01", code: "IDENT", label: "Регистрация" },
  { id: "02", code: "CIPHER", label: "Пароль" },
  { id: "03", code: "VERIFY", label: "Подтверждение" },
  { id: "04", code: "LAUNCH", label: "Запуск" },
];

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface RegisterProps {
  children?: ReactNode;
}

export function Register({ children }: RegisterProps) {
  const navigate = useNavigate();
  
  // Состояние регистрации
  const [regOpen, setRegOpen] = useState(false);
  const [obOpen, setObOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [timer, setTimer] = useState(30);
  const [sent, setSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(genCode());
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const reqId = useMemo(() => `MC-${Math.floor(1000 + Math.random() * 9000)}`, []);

  // Проверка онбординга при загрузке
  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    const savedProfile = localStorage.getItem("user_profile");
    if (savedEmail) setEmail(savedEmail);
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  // Обработчик события открытия регистрации из Header
  useEffect(() => {
    const handleOpenRegistration = () => {
      if (!onboardingComplete) {
        setRegOpen(true);
      }
    };
    
    window.addEventListener("open-registration", handleOpenRegistration);
    return () => window.removeEventListener("open-registration", handleOpenRegistration);
  }, [onboardingComplete]);

  // Редирект на дашборд если онбординг завершен
  useEffect(() => {
    if (onboardingComplete) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboardingComplete, navigate]);

  // body scroll lock + esc
  useEffect(() => {
    if (!regOpen && !obOpen && !diagOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [regOpen, obOpen, diagOpen]);

  // reset on open
  useEffect(() => {
    if (!regOpen) return;
    setStep(1);
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setEmailErr("");
    setPasswordErr("");
    setCodeErr("");
    setGeneratedCode(genCode());
    setTimer(30);
    setSent(false);
  }, [regOpen]);

  // resend countdown
  useEffect(() => {
    if (!regOpen || step !== 3 || timer <= 0) return;
    const t = setInterval(() => setTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [regOpen, step, timer]);

  const handleOpen = () => {
    if (onboardingComplete) {
      navigate("/dashboard");
    } else {
      setRegOpen(true);
    }
  };

  const handleClose = () => {
    setRegOpen(false);
    setObOpen(false);
    setDiagOpen(false);
  };

  const handleEmailNext = () => {
    setStep(2);
  };

  const handlePasswordNext = () => {
    setSent(true);
    setStep(3);
  };

  const handleCodeVerify = (code: string) => {
    if (code === generatedCode || code.length === 6) {
      setCodeErr("");
      setStep(4);
    } else {
      setCodeErr("Код не совпадает. Проверьте письмо и повторите ввод.");
      setTimeout(() => {
        setCodeErr("");
      }, 2000);
    }
  };

  const handleResendCode = () => {
    setGeneratedCode(genCode());
    setTimer(30);
    setSent(true);
    setCodeErr("");
  };

  const handleRegistrationComplete = () => {
    setRegOpen(false);
    setObOpen(true);
  };

  const handleOnboardingComplete = (userData: Profile) => {
    setProfile(userData);
    setObOpen(false);
    setDiagOpen(true);
    // Сохраняем данные
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_profile", JSON.stringify(userData));
  };

  const handleDiagnosticsComplete = () => {
    setDiagOpen(false);
    setOnboardingComplete(true);
    localStorage.setItem("onboarding_complete", "true");
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      {children}

      {/* Register Overlay */}
      {regOpen && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto bg-void/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Регистрация MyCOO"
        >
          <div
            className="flex min-h-full items-center justify-center p-4"
            onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
          >
            <div
              ref={panelRef}
              className="corner glass step-in relative w-full max-w-4xl rounded-xl shadow-[0_0_90px_-20px_rgba(56,189,248,0.35)]"
            >
              <span className="cx pointer-events-none absolute inset-0" />

              {/* panel header */}
              <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 md:px-7">
                <div className="flex items-center gap-3">
                  <Logo className="h-7 w-7 shrink-0" />
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
                    onClick={handleClose}
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
                  {step === 1 && (
                    <RegisterStepEmail
                      email={email}
                      setEmail={setEmail}
                      emailErr={emailErr}
                      setEmailErr={setEmailErr}
                      onNext={handleEmailNext}
                    />
                  )}
                  {step === 2 && (
                    <RegisterStepPassword
                      password={password}
                      setPassword={setPassword}
                      passwordConfirm={passwordConfirm}
                      setPasswordConfirm={setPasswordConfirm}
                      passwordErr={passwordErr}
                      setPasswordErr={setPasswordErr}
                      onNext={handlePasswordNext}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {step === 3 && (
                    <RegisterStepCode
                      email={email}
                      codeErr={codeErr}
                      setCodeErr={setCodeErr}
                      onVerify={handleCodeVerify}
                      onResend={handleResendCode}
                      timer={timer}
                    />
                  )}
                  {step === 4 && (
                    <RegisterStepLaunch
                      email={email}
                      onComplete={handleRegistrationComplete}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {obOpen && (
        <OnboardingModal
          open={obOpen}
          onClose={() => setObOpen(false)}
          regEmail={email}
          onFinish={handleOnboardingComplete}
        />
      )}

      {/* Diagnostics Modal */}
      {diagOpen && (
        <DiagnosticsModal
          open={diagOpen}
          onClose={() => setDiagOpen(false)}
          onLaunch={handleDiagnosticsComplete}
          profile={profile}
        />
      )}
    </>
  );
}
