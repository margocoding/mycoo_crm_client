export type Tone = "crit" | "warn" | "ok" | "flux" | "ion" | "mist";

export const toneDot: Record<Tone, string> = {
  crit: "var(--color-crit)",
  warn: "var(--color-warn)",
  ok: "var(--color-ok)",
  flux: "var(--color-flux)",
  ion: "var(--color-ion)",
  mist: "var(--color-mist)",
};

export const toneName: Record<Tone, string> = {
  crit: "CRIT",
  warn: "WARN",
  ok: "OK",
  flux: "FLUX",
  ion: "ION",
  mist: "INFO",
};