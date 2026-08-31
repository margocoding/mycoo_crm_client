interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}

export default function Segmented({ options, value, onChange, label }: SegmentedProps) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-md border px-2 py-2.5 text-center text-[12.5px] font-semibold transition-all duration-300 ${
            value === o
              ? "border-flux/70 bg-flux/10 text-ice shadow-[0_0_16px_-6px_rgba(56,189,248,0.7)]"
              : "border-line bg-hull/30 text-fog hover:border-flux/40 hover:text-mist"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}