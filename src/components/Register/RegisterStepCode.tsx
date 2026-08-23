import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";

export interface RegisterStepCodeProps {
  email: string;
  codeErr: string;
  setCodeErr: (err: string) => void;
  onVerify: (code: string) => void;
  onResend?: () => void;
  timer?: number;
}

export function RegisterStepCode({
  email,
  codeErr,
  setCodeErr,
  onVerify,
  onResend,
  timer = 30,
}: RegisterStepCodeProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [attempt, setAttempt] = useState(0);

  const onDigitChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    const next = [...digits];
    const wasEmpty = digits[i] === "";
    if (clean.length === 0) {
      next[i] = "";
      setDigits(next);
      setCodeErr("");
      return;
    }
    next[i] = clean.slice(-1);
    setDigits(next);
    setCodeErr("");
    if (wasEmpty && i < 5) boxRefs.current[i + 1]?.focus();
    if (next.every((x) => x !== "")) {
      // Auto-verify when all digits are filled
      // Verification will be handled by parent
    }
  };

  const onDigitKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      boxRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) {
      boxRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowRight" && i < 5) {
      boxRefs.current[i + 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => text[i] ?? "");
    setDigits(next);
    if (text.length === 6) {
      // Auto-verify when pasted
    } else {
      boxRefs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length === 6) {
      onVerify(code);
    }
  };

  // Auto-submit when all digits are filled
  if (digits.every((d) => d !== "") && !codeErr) {
    setTimeout(() => handleSubmit(), 100);
  }

  const inputCls =
    "w-full rounded-md border border-line bg-void/70 px-4 py-3.5 text-center text-[18px] font-mono text-snow placeholder:text-fog/45 outline-none transition-all duration-300 focus:border-flux/60 focus:shadow-[0_0_22px_-8px_rgba(56,189,248,0.65)]";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-[0.15em] text-snow">
          ПОДТВЕРЖДЕНИЕ
        </h2>
        <p className="mt-1 text-sm text-fog/70">
          Введите код из письма, отправленного на <span className="text-flux">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (boxRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => onDigitChange(i, e.target.value)}
              onKeyDown={(e) => onDigitKey(i, e)}
              onPaste={onPaste}
              className={`${inputCls} h-12 w-10 sm:h-14 sm:w-12`}
              aria-label={`Цифра ${i + 1}`}
            />
          ))}
        </div>

        {codeErr && (
          <p className="text-center text-xs text-crit">{codeErr}</p>
        )}

        <div className="flex items-center justify-center gap-4 pt-4">
          {timer > 0 ? (
            <p className="text-xs text-fog/60">
              Отправить код повторно через {timer} сек.
            </p>
          ) : (
            <button
              onClick={onResend}
              className="text-xs font-medium text-flux hover:text-flux/80"
            >
              Отправить код повторно
            </button>
          )}
        </div>

        <p className="text-center text-xs text-fog/50">
          Демо-код: 123456 (или любой другой)
        </p>
      </div>
    </div>
  );
}
