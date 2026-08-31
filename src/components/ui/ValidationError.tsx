import { StatusDot } from "./Ambient";
import { toneDot } from "../../lib/tone";

interface ValidationErrorProps {
  message: string;
}

export default function ValidationError({ message }: ValidationErrorProps) {
  if (!message) return null;
  return (
    <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-crit">
      <StatusDot color={toneDot.crit} /> {message}
    </p>
  );
}