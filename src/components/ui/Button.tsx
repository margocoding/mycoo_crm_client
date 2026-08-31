import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "pill";
type Tone = "flux" | "ion";

interface ButtonProps {
  variant?: Variant;
  tone?: Tone;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  mono?: boolean;
}

const primaryStyles: Record<Tone, string> = {
  flux: "bg-flux shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] hover:bg-ice hover:shadow-[0_0_44px_-8px_rgba(56,189,248,0.95)]",
  ion: "bg-ion shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] hover:brightness-110 hover:shadow-[0_0_44px_-8px_rgba(139,133,248,0.95)]",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "btn-primary rounded-md px-6 py-3.5 text-[14px] font-bold text-void transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none",
  secondary:
    "rounded-md border border-line px-6 py-3.5 text-[13.5px] font-semibold text-mist transition-all duration-300 hover:border-ion/50 hover:text-snow",
  ghost:
    "rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors enabled:hover:text-ion disabled:opacity-30",
  pill:
    "rounded-full border border-ion/30 bg-ion/5 px-3.5 py-1.5 text-[12px] text-mist transition-all duration-300 hover:-translate-y-0.5 hover:border-ion/70 hover:text-snow hover:shadow-[0_6px_18px_-8px_rgba(139,133,248,0.6)]",
};

export default function Button({
  variant = "primary",
  tone = "ion",
  iconLeft,
  iconRight,
  children,
  className = "",
  href,
  mono,
  ...rest
}: ButtonProps) {
  const base = variantStyles[variant];
  const toneStyle = variant === "primary" ? primaryStyles[tone] : "";
  const monoStyle = mono ? "mono-label" : "";
  const cls = `${base} ${toneStyle} ${monoStyle} inline-flex items-center justify-center gap-2.5 ${className}`;

  const inner = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}