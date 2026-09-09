import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import type { AuthStep } from "@/hooks/useModalRouter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;
const EMPTY_DIGITS = ["", "", "", "", "", ""];

const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

const createRequestId = () =>
  `MC-${Math.floor(1000 + Math.random() * 9000)}`;

interface ModalState {
  modal: "auth" | "onboarding" | "diagnostics" | "subscription" | null;
  authStep: AuthStep | null;
  authMode: "login" | "register" | null;
  email: string | null;
  provider: string | null;
}

export function useAuthFlow(
  open: boolean,
  onClose: () => void,
  modalState: ModalState,
  updateAuthStep: (step: AuthStep, params?: Record<string, string>) => void
) {
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmailState] = useState("");
  const [pw, setPwState] = useState("");
  const [pw2, setPw2State] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [digits, setDigits] = useState<string[]>(EMPTY_DIGITS);
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [sent, setSent] = useState(false);

  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const failTimeoutRef = useRef<number | null>(null);

  const mode = modalState.authMode;
  const setAuthEmail = useAuthStore((s) => s.setAuthEmail);
  const setAuthMode = useAuthStore((s) => s.setAuthMode);
  const saveSession = useAuthStore((s) => s.saveSession);

  const requestId = useMemo(createRequestId, []);

  const setEmail = (value: string) => {
    setEmailState(value);
    setEmailErr("");
  };

  const setPw = (value: string) => {
    setPwState(value);
    setPwErr("");
  };

  const setPw2 = (value: string) => {
    setPw2State(value);
    setPwErr("");
  };

  const showSocialNote = (providerName: string) => {
    setSocialNote(`Вход через ${providerName} появится в следующем билде — используйте email.`);
    setEmailErr("");
  };

  const backToEmail = () => {
    updateAuthStep("email");
    setAuthMode(null as unknown as "login" | "register");
    setSent(false);
    setDigits(EMPTY_DIGITS);
    setCodeErr("");
    setPwErr("");
  };

  useEffect(() => {
    if (!open) return;

    if (modalState.authStep === "code") setStep(2);
    else if (modalState.authStep === "password") setStep(3);
    else if (modalState.authStep === "complete") setStep(4);
    else setStep(1);

    if (modalState.email) setEmailState(modalState.email);
    if (modalState.authMode) setAuthMode(modalState.authMode);
  }, [open, modalState, setAuthMode]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    setChecking(false);
    setSubmitting(false);
    setPwState("");
    setPw2State("");
    setShowPw(false);
    setDigits(EMPTY_DIGITS);
    setEmailErr("");
    setPwErr("");
    setCodeErr("");
    setSocialNote("");
    setAttempt(0);
    setTimer(RESEND_SECONDS);
    setSent(false);

    if (failTimeoutRef.current) {
      window.clearTimeout(failTimeoutRef.current);
      failTimeoutRef.current = null;
    }
  }, [open]);

  useEffect(
    () => () => {
      if (failTimeoutRef.current) {
        window.clearTimeout(failTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!open || step !== 2 || timer <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimer((value) => value - 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [open, step, timer]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();

    if (checking) return;

    if (!isValidEmail(email)) {
      setEmailErr("Формат email не распознан — проверьте адрес.");
      setAttempt((current) => current + 1);
      return;
    }

    setEmailErr("");
    setSocialNote("");
    setChecking(true);

    try {
      const { success } = await authApi.checkEmail(email.trim());

      const newMode = success ? "login" : "register";
      setAuthEmail(email.trim());
      setAuthMode(newMode);
      updateAuthStep("code", { mode: newMode, email: email.trim() });
      setSent(true);
      setTimer(RESEND_SECONDS);
      setDigits(EMPTY_DIGITS);
      setStep(2);
    } catch (err) {
      setEmailErr(err instanceof Error ? err.message : "Ошибка при проверке email");
      setAttempt((current) => current + 1);
    } finally {
      setChecking(false);
    }
  };

  const rules = [
    { ok: pw.length >= 8, label: "не менее 8 символов" },
    { ok: /\d/.test(pw) && /[a-zа-яё]/i.test(pw), label: "буквы и цифры" },
    { ok: /[A-ZА-ЯЁ]/.test(pw) && /[a-zа-яё]/.test(pw), label: "разный регистр букв" },
  ];

  const strength =
    rules.filter((rule) => rule.ok).length +
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

  const pwValid = rules.every((rule) => rule.ok) && pw2 === pw && pw2.length > 0;

  const submitPw = async (event: FormEvent) => {
    event.preventDefault();

    if (submitting) return;

    const code = digits.join("");

    if (mode === "login") {
      if (pw.length === 0) {
        setPwErr("Введите пароль от аккаунта.");
        setAttempt((current) => current + 1);
        return;
      }

      setSubmitting(true);

      try {
        const { accessToken, user } = await authApi.login(email, pw, code);
        saveSession(accessToken, user);
        onClose();
      } catch (err) {
        setPwErr(err instanceof Error ? err.message : "Неверный пароль или код");
        setAttempt((current) => current + 1);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!rules.every((rule) => rule.ok)) {
      setPwErr("Пароль не соответствует требованиям защиты контура.");
      setAttempt((current) => current + 1);
      return;
    }

    if (pw2 !== pw) {
      setPwErr("Пароли не совпадают.");
      setAttempt((current) => current + 1);
      return;
    }

    setSubmitting(true);

    try {
      const { accessToken, user } = await authApi.register(email, pw, code);
      saveSession(accessToken, user);
      updateAuthStep("complete", { mode: "register", email });
      setStep(4);
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "Ошибка при регистрации");
      setAttempt((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const verify = useCallback((value: string) => {
    if (value.length === 6) {
      setCodeErr("");
      updateAuthStep("password", { mode: mode || "login", email });
      setStep(3);
      return;
    }

    setCodeErr("Код должен состоять из 6 цифр.");
    setAttempt((current) => current + 1);

    if (failTimeoutRef.current) {
      window.clearTimeout(failTimeoutRef.current);
    }

    failTimeoutRef.current = window.setTimeout(() => {
      setDigits(EMPTY_DIGITS);
      boxRefs.current[0]?.focus();
    }, 420);
  }, [mode, email, updateAuthStep]);

  const onDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    const next = [...digits];
    const wasEmpty = digits[index] === "";

    if (clean.length === 0) {
      next[index] = "";
      setDigits(next);
      setCodeErr("");
      return;
    }

    next[index] = clean.slice(-1);
    setDigits(next);
    setCodeErr("");

    if (wasEmpty && index < 5) {
      boxRefs.current[index + 1]?.focus();
    }

    if (next.every((digit) => digit !== "")) {
      verify(next.join(""));
    }
  };

  const onDigitKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      boxRefs.current[index + 1]?.focus();
    }
  };

  const onDigitPaste = (event: ClipboardEvent<HTMLElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!text) return;

    event.preventDefault();

    const next = Array.from({ length: 6 }, (_, index) => text[index] ?? "");
    setDigits(next);

    if (text.length === 6) {
      verify(text);
      return;
    }

    boxRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const resend = async () => {
    try {
      await authApi.resendCode(email);
      setTimer(RESEND_SECONDS);
      setSent(true);
      setCodeErr("");
      setDigits(EMPTY_DIGITS);
      boxRefs.current[0]?.focus();
    } catch (err) {
      setCodeErr(err instanceof Error ? err.message : "Ошибка при отправке кода");
    }
  };

  return {
    step,
    mode,
    checking,
    submitting,
    email,
    emailValid: isValidEmail(email),
    emailErr,
    pw,
    pw2,
    showPw,
    pwErr,
    rules,
    strengthMeta,
    pwValid,
    digits,
    codeErr,
    timer,
    sent,
    socialNote,
    attempt,
    requestId,
    boxRefs,
    setEmail,
    setPw,
    setPw2,
    setShowPw,
    showSocialNote,
    submitEmail,
    submitPw,
    backToEmail,
    onDigitChange,
    onDigitKey,
    onDigitPaste,
    resend,
  };
}