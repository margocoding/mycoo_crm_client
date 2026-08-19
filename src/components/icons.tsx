type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Управление решениями — узел с расходящимися ветвями */
export function IconDecision({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="5.5" r="2.4" />
      <circle cx="5" cy="18.5" r="2.4" />
      <circle cx="19" cy="18.5" r="2.4" />
      <path d="M10.8 7.6 6.2 16.4M13.2 7.6l4.6 8.8M7.4 18.5h9.2" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

/* Управление задачами — чекбокс на орбите */
export function IconTask({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="4" width="13" height="13" rx="2" />
      <path d="m7.5 10.5 2.4 2.4 4.6-5" />
      <path d="M20.5 8.5v6M17.5 20.5h-6" opacity="0.55" strokeDasharray="2 2.4" />
    </svg>
  );
}

/* Контроль процессов — кольцо с импульсом */
export function IconProcess({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M8.5 12h1.6l1.2-2.4 1.6 4.6 1.2-2.2h1.4" />
    </svg>
  );
}

/* Анализ информации — линза с сигнатурой сигнала */
export function IconAnalysis({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 4.6 4.6" />
      <path d="M7 11.5h1.4l1-2 1.4 3.4 1.1-1.4H14" />
    </svg>
  );
}

/* Контроль отклонений — треугольник с разрывом траектории */
export function IconDeviation({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.6" r="0.4" fill="currentColor" />
      <path d="M19 5.5h3M20.5 4v3" opacity="0.6" />
    </svg>
  );
}

/* Управленческие рекомендации — вектор курса */
export function IconAdvice({ className = "w-6 h-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3.4" />
      <path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

/* Стрелка-шевроны для цепочек */
export function IconArrow({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12h14M13 6.5 18.5 12 13 17.5" />
    </svg>
  );
}

export function IconCheck({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconX({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/* Логотип: орбита + ядро + спутник */
export function Logo({ className = "w-7 h-7" }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <ellipse cx="16" cy="16" rx="13" ry="13" stroke="#38bdf8" strokeWidth="1.6" opacity="0.85" />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        stroke="#8b85f8"
        strokeWidth="1.1"
        opacity="0.6"
        transform="rotate(-24 16 16)"
      />
      <circle cx="16" cy="16" r="3.6" fill="#eaf1fc" />
      <circle cx="26.6" cy="9.4" r="2" fill="#38bdf8" />
    </svg>
  );
}
