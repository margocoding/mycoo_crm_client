import { useCountUp } from "../../lib/motion";

interface DialProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sub?: string;
  gradientFrom?: string;
  gradientTo?: string;
  animated?: boolean;
  id?: string;
}

export default function Dial({
  value,
  max = 100,
  size = 190,
  label,
  sub,
  gradientFrom = "var(--color-flux)",
  gradientTo = "var(--color-ion)",
  animated = true,
  id = "dial-grad",
}: DialProps) {
  const v = useCountUp(value, animated, 1600);
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - Math.min(value, max) / max);

  return (
    <div className="relative mx-auto" style={{ width: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-hull)" strokeWidth="9" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 0 8px rgba(139,133,248,0.5))",
          }}
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-snow">{v}</span>
        {label && <span className="mono-label mt-1 text-fog/60">{label}</span>}
        {sub && <span className="mono-label text-fog/50">{sub}</span>}
      </div>
    </div>
  );
}