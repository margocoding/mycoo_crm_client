export const TRIAL_STORAGE_KEY = "mycoo_trial_start";

export const DEMO_STORAGE_KEYS = [
  "mycoo_profile",
  "mycoo_mgmt_profile",
  "mycoo_trial_start",
];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const RESEND_SECONDS = 30;

export const AUTH_PHASES = [
  { id: "01", code: "IDENT", label: "Почта" },
  { id: "02", code: "VERIFY", label: "Код" },
  { id: "03", code: "CIPHER", label: "Пароль" },
  { id: "04", code: "LAUNCH", label: "Запуск" },
];