import type { ReactNode } from "react";

interface ChipProps {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Chip({ active, onClick, children, className = "", disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3.5 py-2.5 text-[13px] w-full font-medium transition-all disabled:opacity-80 duration-300 ${
        active
          ? "border-flux/70 bg-flux/10 text-ice shadow-[0_0_18px_-6px_rgba(56,189,248,0.7)]"
          : "border-line bg-hull/30 text-fog hover:-translate-y-0.5 hover:border-flux/40 hover:text-mist"
      } ${className}`}
    >
      {children}
    </button>
  );
}