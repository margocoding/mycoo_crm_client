import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { StatusDot } from "./Ambient";
import { toneDot } from "../../lib/tone";

export const TEXTAREA_CLS =
  "w-full resize-none rounded-md border border-line bg-hull/30 px-3.5 py-2.5 text-[13px] text-snow placeholder:text-fog/40 focus:border-ion/50 focus:outline-none focus:ring-1 focus:ring-ion/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: ReactNode;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  counter?: { current: number; max: number };
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      optional,
      error,
      hint,
      counter,
      wrapperClassName = "",
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? (typeof label === "string" ? `ta-${label}` : undefined);
    return (
      <div className={wrapperClassName}>
        {label && (
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor={inputId} className="mono-label flex items-center gap-2 text-fog/75">
              {label}
              {optional && (
                <span className="rounded border border-line px-1.5 py-0.5 text-[8.5px] tracking-[0.14em] text-fog/50">
                  опционально
                </span>
              )}
            </label>
            {counter && (
              <span className="font-mono text-[10.5px] text-fog/60">
                {counter.current} / {counter.max}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${TEXTAREA_CLS} ${
            error ? "border-crit/60 focus:border-crit focus:ring-crit/50" : ""
          }`}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] text-crit">
            <StatusDot color={toneDot.crit} /> {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-[11px] text-fog/60">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;