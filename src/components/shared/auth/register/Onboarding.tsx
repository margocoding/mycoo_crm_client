import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconCheck } from "../../../icons";
import { StatusDot } from "../../../ui/Ambient";
import { Modal } from "../../../ui/Modal";

const PHASES = [
  { id: "00", code: "BRIEF", label: "Знакомство" },
  { id: "01", code: "COMPANY", label: "Компания" },
  { id: "02", code: "OWNER", label: "Собственник" },
  { id: "03", code: "GOALS", label: "Цели" },
  { id: "04", code: "SYNC", label: "Синхронизация" },
];

const INDUSTRIES = [
  "IT и SaaS",
  "Ритейл и e-commerce",
  "Производство",
  "Услуги и B2B",
  "Финансы",
  "Строительство",
  "Логистика",
  "Другое",
];

const STAGES = [
  { v: "startup", t: "Стартап", d: "ищем продукт и рынок" },
  { v: "growth", t: "Рост", d: "масштабируем продажи и команду" },
  { v: "mature", t: "Зрелость", d: "процессы стабильны — важна эффективность" },
  { v: "transform", t: "Трансформация", d: "меняем модель или выходим на новые рынки" },
];

const EMPLOYEES = ["1–5", "6–20", "21–50", "51–200", "200+"];
const MANAGERS = ["1", "2–3", "4–10", "10+"];
const REVENUE = [
  "до 50 млн ₽",
  "50–100 млн ₽",
  "100–500 млн ₽",
  "500 млн – 1 млрд ₽",
  "1 млрд ₽ +",
  "не указывать",
];
const ROLES = ["Собственник", "Основатель", "Генеральный директор", "Управляющий партнёр", "Другое"];

const EXAMPLES = [
  "Увеличить выручку с 50 до 100 млн ₽",
  "Снизить зависимость бизнеса от собственника",
  "Настроить работу руководителей",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;

export interface Profile {
  company: string;
  industry: string;
  industryOther: string;
  site: string;
  employees: string;
  managers: string;
  revenue: string;
  stage: string;
  ownerName: string;
  ownerRole: string;
  roleOther: string;
  ownerEmail: string;
  goal: string;
  problem: string;
  p1: string;
  p2: string;
  p3: string;
}

const EMPTY: Profile = {
  company: "",
  industry: "",
  industryOther: "",
  site: "",
  employees: "",
  managers: "",
  revenue: "",
  stage: "",
  ownerName: "",
  ownerRole: "",
  roleOther: "",
  ownerEmail: "",
  goal: "",
  problem: "",
  p1: "",
  p2: "",
  p3: "",
};

const inputCls =
  "w-full rounded-md border border-line bg-hull/30 px-3.5 py-2.5 text-[13px] text-snow placeholder:text-fog/40 focus:border-ion/50 focus:outline-none focus:ring-1 focus:ring-ion/50 transition-all duration-300";

function Label({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <label className="mono-label mb-2 flex items-center gap-2 text-fog/75">
      {children}
      {optional && (
        <span className="rounded border border-line px-1.5 py-0.5 text-[8.5px] tracking-[0.14em] text-fog/50">
          опционально
        </span>
      )}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3.5 py-2.5 text-[13px] font-medium transition-all duration-300 ${
        active
          ? "border-flux/70 bg-flux/10 text-ice shadow-[0_0_18px_-6px_rgba(56,189,248,0.7)]"
          : "border-line bg-hull/30 text-fog hover:-translate-y-0.5 hover:border-flux/40 hover:text-mist"
      }`}
    >
      {children}
    </button>
  );
}

function Seg({
  options,
  value,
  onChange,
  label,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
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

export function OnboardingOverlay({
  open,
  onClose,
  regEmail,
  onFinish,
}: {
  open: boolean;
  onClose: () => void;
  regEmail: string;
  onFinish?: (p: Profile) => void;
}) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(EMPTY);
  const [err, setErr] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [synced, setSynced] = useState(false);

  const companyRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  const set = (k: keyof Profile) => (v: string) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setErr("");
  };

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setP({ ...EMPTY, ownerEmail: regEmail });
    setErr("");
    setSynced(false);
  }, [open, regEmail]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || step !== 4 || synced) return;
    const t = setTimeout(() => {
      setSynced(true);
      try {
        localStorage.setItem("mycoo_profile", JSON.stringify(p));
      } catch {
      }
    }, 2300);
    return () => clearTimeout(t);
  }, [step, open, synced]);

  const prioCount = [p.p1, p.p2, p.p3].filter((x) => x.trim()).length;

  const next = () => {
    if (step === 1) {
      if (!p.company.trim()) return fail("Укажите название компании — это первая точка контекста.");
      if (!p.industry) return fail("Выберите отрасль.");
      if (p.industry === "Другое" && !p.industryOther.trim())
        return fail("Опишите, чем занимается компания — вы выбрали «Другое».");
      if (!p.employees) return fail("Укажите количество сотрудников.");
      if (!p.managers) return fail("Укажите количество руководителей.");
      if (!p.stage) return fail("Выберите стадию бизнеса.");
      if (p.site.trim() && !SITE_RE.test(p.site.trim()))
        return fail("Похоже, адрес сайта некорректен — пример: company.ru");
    }
    if (step === 2) {
      if (!p.ownerName.trim()) return fail("Как к вам обращаться?");
      if (!p.ownerRole) return fail("Выберите вашу роль.");
      if (p.ownerRole === "Другое" && !p.roleOther.trim())
        return fail("Укажите вашу должность — вы выбрали «Другое».");
      if (!EMAIL_RE.test(p.ownerEmail.trim())) return fail("Email для связи не распознан.");
    }
    if (step === 3) {
      if (!p.goal.trim()) return fail("Сформулируйте главную цель компании.");
      if (!p.problem.trim()) return fail("Опишите главную проблему сейчас — без неё MyCOO слеп.");
      if (prioCount < 1) return fail("Добавьте хотя бы один приоритет.");
    }
    setErr("");
    setAttempt(0);
    setStep((s) => s + 1);
  };

  const fail = (m: string) => {
    setErr(m);
    setAttempt((a) => a + 1);
  };

  const insertExample = (text: string) => {
    setP((prev) => {
      if (!prev.goal.trim()) return { ...prev, goal: text };
      if (!prev.problem.trim()) return { ...prev, problem: text };
      if (!prev.p1.trim()) return { ...prev, p1: text };
      if (!prev.p2.trim()) return { ...prev, p2: text };
      if (!prev.p3.trim()) return { ...prev, p3: text };
      return prev;
    });
    setErr("");
  };

  const progress = useMemo(() => [6, 30, 55, 80, 100][step] ?? 6, [step]);

  const summary = useMemo<[string, string][]>(() => {
    const industryValue = p.industry === "Другое" && p.industryOther?.trim() ? p.industryOther.trim() : p.industry;
    const roleValue = p.ownerRole === "Другое" && p.roleOther?.trim() ? p.roleOther.trim() : p.ownerRole;
    const stageLabel = STAGES.find((s) => s.v === p.stage)?.t ?? p.stage;

    const items: [string, string][] = [
      ["Компания", p.company],
      ["Сайт", p.site || "—"],
      ["Отрасль", industryValue || "—"],
      ["Масштаб", `${p.employees || "—"} сотр. · ${p.managers || "—"} рук.`],
      ["Стадия", stageLabel],
      ["Оборот", p.revenue || "не указан"],
      ["Контакт", `${p.ownerName} (${roleValue || "—" })`],
      ["Email", p.ownerEmail],
      ["Главная цель", p.goal],
      ["Главная проблема", p.problem],
      ["Приоритеты", [p.p1, p.p2, p.p3].filter(Boolean).join(" · ") || "—"],
    ];

    return items.filter(([, value]) => value !== "—" && value !== "");
  }, [p]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      ariaLabel="Знакомство с компанией"
      title={
        <>
          MYCOO <span className="text-fog/60">/</span>{" "}
          <span className="text-ion">ONBOARDING</span>
        </>
      }
      subtitle={<>бриф компании · ~5 минут · {step + 1}/5</>}
      statusChip={{ tone: step === 4 ? "ok" : "ion", text: step === 4 ? "sync" : "data intake" }}
      showProgress
      progress={progress}
      progressColor="var(--color-ion)"
      maxWidth="max-w-5xl"
    >
      <div className="grid md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line/60 p-6 md:block">
          <p className="mono-label mb-5 text-fog/60">маршрут брифа</p>
          <ol className="relative space-y-6">
            <span className="absolute bottom-2 left-[11px] top-2 w-px bg-line/70" />
            {PHASES.map((ph, i) => {
              const state = i < step ? "done" : i === step ? "active" : "idle";
              return (
                <li key={ph.code} className="relative flex items-center gap-3.5">
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                      state === "done"
                        ? "border-ok/60 bg-ok/10 text-ok"
                        : state === "active"
                          ? "border-ion bg-void text-ion shadow-[0_0_16px_-2px_rgba(139,133,248,0.8)]"
                          : "border-line bg-void text-fog/50"
                    }`}
                  >
                    {state === "done" ? <IconCheck className="h-3 w-3" /> : ph.id}
                  </span>
                  <div>
                    <p
                      className={`font-mono text-[10px] font-bold tracking-[0.2em] ${
                        state === "active" ? "text-ion" : state === "done" ? "text-ok/80" : "text-fog/50"
                      }`}
                    >
                      T·{ph.code}
                    </p>
                    <p className={`text-[12.5px] font-medium ${state === "idle" ? "text-fog/60" : "text-mist"}`}>
                      {ph.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-9 rounded-md border border-line/60 bg-hull/30 p-3.5">
            <p className="mono-label text-fog/50">приватность</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog/80">
              Демо-режим: данные остаются в вашем браузере и не передаются.
            </p>
          </div>
        </aside>

        <div className="min-h-[460px] p-6 md:p-8">
          {step === 0 && (
            <div className="step-in">
              <div className="flex items-start gap-4">
                <span className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full border border-ion/30 [animation-duration:2.6s]" />
                  <span className="h-3 w-3 rounded-full bg-ion shadow-[0_0_14px_rgba(139,133,248,0.9)]" />
                </span>
                <div className="flex-1 rounded-lg rounded-tl-none border border-line/70 bg-hull/40 px-5 py-4">
                  <p className="mono-label text-ion">mycoo · говорит</p>
                  <p className="font-display mt-2 text-lg font-semibold leading-snug text-snow md:text-xl">
                    Давайте познакомимся с вашей компанией. Это займёт около 5 минут.
                  </p>
                  <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-fog">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-ok" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    Нужны только данные, которые действительно используются системой.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { t: "Компания", n: "7 полей", d: "масштаб, отрасль, стадия" },
                  { t: "Собственник", n: "3 поля", d: "кто принимает решения" },
                  { t: "Цели", n: "5 полей", d: "цель, проблема, приоритеты" },
                ].map((c, i) => (
                  <div
                    key={c.t}
                    className="rounded-lg border border-line/70 bg-hull/30 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-ion/40"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-[13.5px] font-semibold text-snow">{c.t}</p>
                      <span className="font-mono text-[10px] text-ion/80">{c.n}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-fog">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => setStep(1)}
                  className="btn-primary group inline-flex items-center gap-2.5 rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_44px_-8px_rgba(139,133,248,0.95)]"
                >
                  Начать знакомство
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h14M13 6.5 18.5 12 13 17.5" />
                  </svg>
                </button>
                <span className="mono-label text-fog/45">
                  оборот и сайт — по желанию
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div key={`c-${attempt}`} className={attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 01 · компания</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Расскажите о компании
              </h3>

              <div className="mt-6 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label>название</Label>
                    <input
                      ref={companyRef}
                      autoFocus
                      autoComplete="off"
                      value={p.company}
                      onChange={(e) => set("company")(e.target.value)}
                      placeholder="ООО «Вектор»"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label optional>сайт</Label>
                    <input
                      autoComplete="off"
                      value={p.site}
                      onChange={(e) => set("site")(e.target.value)}
                      placeholder="company.ru"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <Label>отрасль</Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <Chip key={ind} active={p.industry === ind} onClick={() => set("industry")(ind)}>
                        {ind}
                      </Chip>
                    ))}
                  </div>
                  {p.industry === "Другое" && (
                    <input
                      autoFocus
                      autoComplete="off"
                      value={p.industryOther}
                      onChange={(e) => set("industryOther")(e.target.value)}
                      placeholder="Чем занимается компания — опишите своими словами"
                      className={`${inputCls} mt-3`}
                    />
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label>сотрудников</Label>
                    <Seg label="Количество сотрудников" options={EMPLOYEES} value={p.employees} onChange={set("employees")} />
                  </div>
                  <div>
                    <Label>руководителей</Label>
                    <Seg label="Количество руководителей" options={MANAGERS} value={p.managers} onChange={set("managers")} />
                  </div>
                </div>

                <div>
                  <Label optional>примерный оборот</Label>
                  <div className="flex flex-wrap gap-2">
                    {REVENUE.map((r) => (
                      <Chip key={r} active={p.revenue === r} onClick={() => set("revenue")(r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>стадия бизнеса</Label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {STAGES.map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => set("stage")(s.v)}
                        className={`rounded-lg border p-3.5 text-left transition-all duration-300 ${
                          p.stage === s.v
                            ? "border-ion/70 bg-ion/10 shadow-[0_0_20px_-8px_rgba(139,133,248,0.7)]"
                            : "border-line bg-hull/30 hover:border-ion/40"
                        }`}
                      >
                        <p className={`font-display text-[13.5px] font-semibold ${p.stage === s.v ? "text-snow" : "text-mist"}`}>
                          {s.t}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-fog">{s.d}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {err && (
                <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-crit">
                  <StatusDot color="var(--color-crit)" /> {err}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                <button
                  onClick={next}
                  className="btn-primary rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 hover:brightness-110"
                >
                  Далее →
                </button>
                <button onClick={() => setStep(0)} className="rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors hover:text-ion">
                  ← назад
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key={`o-${attempt}`} className={attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 02 · собственник</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Кто принимает решения
              </h3>
              <p className="mt-2 text-[13.5px] text-fog">
                MyCOO эскалирует ключевые решения именно вам.
              </p>

              <div className="mt-6 grid gap-5">
                <div>
                  <Label>имя</Label>
                  <input
                    ref={ownerRef}
                    autoFocus
                    autoComplete="off"
                    value={p.ownerName}
                    onChange={(e) => set("ownerName")(e.target.value)}
                    placeholder="Как к вам обращаться"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>должность</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <Chip key={r} active={p.ownerRole === r} onClick={() => set("ownerRole")(r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                  {p.ownerRole === "Другое" && (
                    <input
                      autoFocus
                      autoComplete="off"
                      value={p.roleOther}
                      onChange={(e) => set("roleOther")(e.target.value)}
                      placeholder="Ваша должность — например, коммерческий директор"
                      className={`${inputCls} mt-3`}
                    />
                  )}
                </div>
                <div>
                  <Label>email</Label>
                  <input
                    type="email"
                    autoComplete="off"
                    value={p.ownerEmail}
                    onChange={(e) => set("ownerEmail")(e.target.value)}
                    placeholder="you@company.ru"
                    className={inputCls}
                  />
                  {regEmail && p.ownerEmail === regEmail && (
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-ok">
                      <IconCheck className="h-3 w-3" /> подставлен из регистрации
                    </p>
                  )}
                </div>
              </div>

              {err && (
                <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-crit">
                  <StatusDot color="var(--color-crit)" /> {err}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                <button
                  onClick={next}
                  className="btn-primary rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 hover:brightness-110"
                >
                  Далее →
                </button>
                <button onClick={() => setStep(1)} className="rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors hover:text-ion">
                  ← назад
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div key={`g-${attempt}`} className={attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 03 · цели</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Куда летим
              </h3>

              <div className="mt-6 grid gap-5">
                <div>
                  <Label>главная цель компании</Label>
                  <textarea
                    ref={goalRef}
                    rows={2}
                    autoFocus
                    value={p.goal}
                    onChange={(e) => set("goal")(e.target.value)}
                    placeholder="Например: увеличить выручку с 50 до 100 млн ₽"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <Label>главная проблема сейчас</Label>
                  <textarea
                    rows={2}
                    value={p.problem}
                    onChange={(e) => set("problem")(e.target.value)}
                    placeholder="Что мешает двигаться быстрее"
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>3 главных приоритета</Label>
                    <span className="font-mono text-[10.5px] text-fog/60">
                      заполнено {prioCount} / 3
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {(["p1", "p2", "p3"] as const).map((k, i) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${p[k].trim() ? "border-ok/50 text-ok" : "border-line text-fog/50"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <input
                          value={p[k]}
                          onChange={(e) => set(k)(e.target.value)}
                          placeholder={`Приоритет ${i + 1}`}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-line/70 bg-hull/30 p-4">
                  <p className="mono-label text-fog/60">примеры — нажмите, чтобы подставить</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => insertExample(ex)}
                        className="rounded-full border border-ion/30 bg-ion/5 px-3.5 py-1.5 text-[12px] text-mist transition-all duration-300 hover:-translate-y-0.5 hover:border-ion/70 hover:text-snow hover:shadow-[0_6px_18px_-8px_rgba(139,133,248,0.6)]"
                      >
                        «{ex}»
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {err && (
                <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-crit">
                  <StatusDot color="var(--color-crit)" /> {err}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                <button
                  onClick={next}
                  className="btn-primary rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 hover:brightness-110"
                >
                  Передать MyCOO →
                </button>
                <button onClick={() => setStep(2)} className="rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors hover:text-ion">
                  ← назад
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-in">
              <div className="flex items-start gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-700 ${synced ? "border-ok/50 bg-ok/10 shadow-[0_0_28px_-6px_rgba(52,211,153,0.5)]" : "border-ion/50 bg-ion/10"}`}>
                  {synced ? (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="var(--color-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path className="draw-path" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : (
                    <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-ion shadow-[0_0_16px_rgba(139,133,248,0.9)]" />
                  )}
                </span>
                <div>
                  <p className="mono-label text-ion">шаг 04 · синхронизация</p>
                  <h3 className="font-display mt-1.5 text-xl font-bold text-snow md:text-2xl">
                    {synced ? "Контекст принят. Контур собран." : "MyCOO принимает контекст…"}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-2 rounded-md border border-line/70 bg-void/60 p-4 font-mono text-[12px]">
                {[
                  { t: "контекст компании принят", d: 0.2 },
                  { t: `масштаб откалиброван · ${p.employees} сотрудников · ${p.managers} руководителей`, d: 0.6 },
                  { t: "цели и приоритеты зафиксированы в контуре", d: 1.0 },
                  { t: "операционная модель сформирована", d: 1.5 },
                  { t: "mycoo готов к первой телеметрии", d: 2.0 },
                ].map((l) => (
                  <p key={l.t} className="log-in flex items-center gap-2.5 text-fog/85" style={{ animationDelay: `${l.d}s` }}>
                    <span className="text-ion">▸</span> {l.t}
                    {l.t.includes("телеметрии") && <StatusDot />}
                  </p>
                ))}
              </div>

              {synced && (
                <div className="step-in mt-5">
                  <div className="rounded-md border border-line/70 bg-hull/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="mono-label text-fog/60">бриф · {p.company}</p>
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ok">
                        <StatusDot /> сохранён
                      </span>
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {summary.map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line/40 pb-1.5">
                          <dt className="mono-label shrink-0 text-fog/55">{k}</dt>
                          <dd className="text-right text-[12.5px] font-medium text-mist" title={v}>
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      onClick={() =>
                        onFinish?.({
                          ...p,
                          industry:
                            p.industry === "Другое" && p.industryOther.trim()
                              ? p.industryOther.trim()
                              : p.industry,
                          ownerRole:
                            p.ownerRole === "Другое" && p.roleOther.trim()
                              ? p.roleOther.trim()
                              : p.ownerRole,
                        })
                      }
                      className="btn-primary group inline-flex items-center justify-center gap-2.5 rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_44px_-8px_rgba(139,133,248,0.95)]"
                    >
                      Перейти к экспресс-диагностике
                      <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12h14M13 6.5 18.5 12 13 17.5" />
                      </svg>
                    </button>
                    <a
                      href={`mailto:hello@mycoo.ai?subject=MyCOO бриф · ${encodeURIComponent(p.company)}`}
                      className="inline-flex items-center justify-center rounded-md border border-line px-6 py-3.5 text-[13.5px] font-semibold text-mist transition-all duration-300 hover:border-ion/50 hover:text-snow"
                    >
                      Отправить бриф оператору
                    </a>
                    <button
                      onClick={onClose}
                      className="mono-label text-fog/50 transition-colors hover:text-flux sm:ml-auto"
                    >
                      позже
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}