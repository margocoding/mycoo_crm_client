import { StatusDot } from "./Ambient";
import { toneDot, toneName, type Tone } from "../../lib/tone";

interface RiskItemProps {
  tone: Tone;
  text: string;
  delay?: number;
  className?: string;
}

export default function RiskItem({
  tone,
  text,
  delay = 0,
  className = "",
}: RiskItemProps) {
  return (
    <li
      className={`log-in flex min-w-0 items-start gap-2.5 rounded-md border border-line/60 bg-hull/30 px-3 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mt-1 shrink-0">
        <StatusDot color={toneDot[tone]} />
      </div>

      <span className="min-w-0 flex-1 break-words text-[13px] font-medium leading-snug text-mist sm:text-[13.5px]">
        {text}
      </span>

      <span
        className="shrink-0 pt-0.5 text-right font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] sm:text-[9.5px] sm:tracking-[0.18em]"
        style={{ color: toneDot[tone] }}
      >
        {toneName[tone]}
      </span>
    </li>
  );
}