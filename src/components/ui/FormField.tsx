import type { ReactNode } from "react";

interface FormFieldProps {
  children: ReactNode;
  optional?: boolean;
  htmlFor?: string;
}

export default function FormField({ children, optional, htmlFor }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="mono-label mb-2 flex items-center gap-2 text-fog/75">
      {children}
      {optional && (
        <span className="rounded border border-line px-1.5 py-0.5 text-[8.5px] tracking-[0.14em] text-fog/50">
          опционально
        </span>
      )}
    </label>
  );
}

export const INPUT_CLS =
  "w-full rounded-md border border-line bg-hull/30 px-3.5 py-2.5 text-[13px] text-snow placeholder:text-fog/40 focus:border-ion/50 focus:outline-none focus:ring-1 focus:ring-ion/50 transition-all duration-300";