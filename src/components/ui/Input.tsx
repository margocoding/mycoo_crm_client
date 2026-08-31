import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { StatusDot } from "./Ambient";
import { toneDot } from "../../lib/tone";

export const INPUT_CLS =
  "w-full rounded-md border border-line bg-hull/30 px-3.5 py-2.5 text-[13px] text-snow placeholder:text-fog/40 focus:border-ion/50 focus:outline-none focus:ring-1 focus:ring-ion/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: ReactNode;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      optional,
      error,
      hint,
      iconLeft,
      iconRight,
      wrapperClassName = "",
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? (typeof label === "string" ? `inp-${label}` : undefined);
    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={inputId} className="mono-label mb-2 flex items-center gap-2 text-fog/75">
            {label}
            {optional && (
              <span className="rounded border border-line px-1.5 py-0.5 text-[8.5px] tracking-[0.14em] text-fog/50">
                опционально
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog/50">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${INPUT_CLS} ${iconLeft ? "pl-9" : ""} ${iconRight ? "pr-9" : ""} ${
              error ? "border-crit/60 focus:border-crit focus:ring-crit/50" : ""
            }`}
            {...rest}
          />
          {iconRight && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fog/50">
              {iconRight}
            </span>
          )}
        </div>
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

Input.displayName = "Input";
export default Input;