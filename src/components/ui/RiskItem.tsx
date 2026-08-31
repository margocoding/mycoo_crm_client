import { StatusDot } from "./Ambient";
import { toneDot, toneName, type Tone } from "../../lib/tone";

interface RiskItemProps {
  tone: Tone;
  text: string;
  delay?: number;
  className?: string;
}

export default function RiskItem({ tone, text, delay = 0, className = "" }: RiskItemProps) {
  return (
    <li
      className={`log-in flex items-center gap-3 rounded-md border border-line/60 bg-hull/30 px-3.5 py-3 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <StatusDot color={toneDot[tone]} />
      <span className="text-[13.5px] font-medium text-mist">{text}</span>
      <span
        className="ml-auto font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: toneDot[tone] }}
      >
        {toneName[tone]}
      </span>
    </li>
  );
}