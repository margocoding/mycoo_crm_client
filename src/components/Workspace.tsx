import { useEffect, useState } from "react";
import { Logo } from "./icons";
import { Starfield, StatusDot } from "./ambient";
import { useCountUp } from "../lib/motion";
import { useLaunch } from "../hooks";
import type { Profile } from "./Onboarding";

/* ================= helpers ================= */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface Risk {
  tone: "crit" | "warn" | "ok";
  t: string;
}

const DEFAULT_RISKS: Risk[] = [
  { tone: "crit", t: "Задачи часто зависят от собственника" },
  { tone: "warn", t: "Нет единой системы контроля" },
  { tone: "warn", t: "Договорённости после встреч не фиксируются" },
];

const toneVar: Record<Risk["tone"], string> = {
  crit: "var(--color-crit)",
  warn: "var(--color-warn)",
  ok: "var(--color-ok)",
};

function Stat({
  value,
  label,
  tone,
  delay,
  pulse,
}: {
  value: number;
  label: string;
  tone: string;
  delay: number;
  pulse?: boolean;
}) {
  const n = useCountUp(value, true, 1300);
  return (
    <div
      className="step-in group rounded-lg border border-line/70 bg-hull/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="flex items-center gap-2">
        <span className="font-display text-3xl font-bold" style={{ color: tone }}>
          {n}
        </span>
        {pulse && <StatusDot color={tone} />}
      </p>
      <p className="mono-label mt-1.5 text-fog/70">{label}</p>
    </div>
  );
}

function Card({
  title,
  code,
  delay,
  children,
  className = "",
}: {
  title: string;
  code: string;
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`step-in glass corner group/card relative rounded-xl p-5 transition-colors duration-300 hover:border-line ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
          {title}
        </h3>
        <span className="mono-label text-fog/45">{code}</span>
      </header>
      {children}
    </section>
  );
}

/* ================= workspace ================= */

export default function Workspace() {
  const { exitToSite, resetDemo } = useLaunch();
  const [ready, setReady] = useState(false);

  const profile = load<Profile | null>("mycoo_profile", null);
  const mgmt = load<{ score: number; risks: Risk[] } | null>("mycoo_mgmt_profile", null);

  const [trialStart] = useState(() => {
    const raw = localStorage.getItem("mycoo_trial_start");
    return raw ? Number(raw) : Date.now();
  });
  const daysLeft = Math.max(0, 10 - Math.floor((Date.now() - trialStart) / 86400000));

  const [rec, setRec] = useState<"idle" | "done" | "later">("idle");
  const [journal, setJournal] = useState([
    { t: "09:12", txt: "MyCOO принял контекст компании из брифа", tone: "var(--color-ok)" },
    { t: "09:14", txt: "Зафиксировано 27 активных задач", tone: "var(--color-flux)" },
    { t: "09:15", txt: "Обнаружено 8 просроченных задач", tone: "var(--color-crit)" },
    { t: "09:16", txt: "2 протокола встреч ожидают подтверждения", tone: "var(--color-warn)" },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const goalPct = useCountUp(63, ready, 1500);
  const score = useCountUp(mgmt?.score ?? 0, ready, 1500);
  const risks = (mgmt?.risks ?? DEFAULT_RISKS).slice(0, 3);
  const company = profile?.company || "Моя компания";
  const owner = profile?.ownerName || "капитан";
  const goal = profile?.goal || "Увеличить выручку с 50 до 100 млн ₽";
  const priorities = [profile?.p1, profile?.p2, profile?.p3].filter(Boolean) as string[];

  const now = () => new Date().toTimeString().slice(0, 5);
  const acceptRec = () => {
    setRec("done");
    setJournal((j) => [
      { t: now(), txt: "Рекомендация принята → задача назначена ответственному", tone: "var(--color-ok)" },
      ...j,
    ]);
  };
  const laterRec = () => {
    setRec("later");
    setJournal((j) => [
      { t: now(), txt: "Рекомендация отложена — MyCOO вернётся к ней", tone: "var(--color-warn)" },
      ...j,
    ]);
  };

  return (
    <div className="relative min-h-screen bg-void font-body text-mist">
      <Starfield />
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.09), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)",
        }}
      />
      <div className="noise-overlay" />

      {/* app bar */}
      <header className="header-solid sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="font-display text-[14px] font-bold tracking-[0.22em] text-snow">MYCOO</span>
            <span className="hidden h-4 w-px bg-line sm:block" />
            <span className="font-display hidden truncate text-[12px] font-semibold tracking-[0.14em] text-flux sm:block">
              МОЙ БИЗНЕС
            </span>
            <span className="hidden max-w-[180px] truncate rounded border border-line bg-hull/60 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-fog md:block">
              {company}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-2 rounded border border-flux/40 bg-flux/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-flux sm:inline-flex">
              <StatusDot />
              trial · {daysLeft} дн
            </span>
            <button
              onClick={exitToSite}
              className="rounded-md border border-line px-3.5 py-2 text-[12.5px] font-semibold text-fog transition-all duration-300 hover:border-flux/50 hover:text-snow"
            >
              На сайт
            </button>
            <button
              onClick={resetDemo}
              title="Стереть демо-данные и вернуться к началу"
              className="mono-label hidden rounded-md px-3 py-2 text-fog/50 transition-colors hover:text-crit sm:block"
            >
              сброс демо
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-8">
        {/* trial banner */}
        <section className="step-in glass corner relative overflow-hidden rounded-xl p-5 md:p-6">
          <span className="cx pointer-events-none absolute inset-0" />
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono-label text-flux">пробный период</p>
              <p className="mt-1.5 text-[15px] font-medium text-mist">
                До окончания пробного периода:{" "}
                <span className="font-display text-xl font-bold text-snow">
                  {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}
                </span>
              </p>
              <p className="mt-1 text-[12.5px] text-fog/70">
                Trial запущен после онбординга — MyCOO уже работает с контекстом {company}.
              </p>
            </div>
            <div className="w-full md:w-[300px]">
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-sm transition-all duration-700 ${
                      i < daysLeft
                        ? "bg-flux shadow-[0_0_8px_rgba(56,189,248,0.55)]"
                        : "bg-hull"
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="mono-label text-fog/45">день 0</span>
                <span className="mono-label text-fog/45">день 10</span>
              </div>
            </div>
          </div>
        </section>

        {/* greeting */}
        <div className="step-in mt-8 flex flex-wrap items-end justify-between gap-3" style={{ animationDelay: "0.1s" }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-snow md:text-3xl">
              Добро пожаловать, {owner}
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-fog">
              Операционный цикл запущен. Ниже — телеметрия компании в реальном
              времени: MyCOO обновляет её по мере поступления данных.
            </p>
          </div>
          {mgmt && (
            <div className="flex items-center gap-3 rounded-lg border border-ion/30 bg-ion/5 px-4 py-2.5">
              <span className="font-display text-xl font-bold text-ion">{score}</span>
              <span className="mono-label leading-tight text-fog/70">
                управляемость
                <br />
                по диагностике
              </span>
            </div>
          )}
        </div>

        {/* grid */}
        <div className="mt-7 grid gap-4 lg:grid-cols-12">
          {/* Цели */}
          <Card title="Цели" code="SYS·GOALS" delay={0.15} className="lg:col-span-5">
            <p className="mono-label text-fog/60">главная цель месяца</p>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-snow">{goal}</p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-flux">{goalPct}%</span>
              <span className="mono-label text-fog/60">выполнение</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hull/80">
              <div
                className="h-full rounded-full bg-flux shadow-[0_0_12px_rgba(56,189,248,0.6)] transition-all duration-[1500ms] ease-out"
                style={{ width: ready ? "63%" : "0%" }}
              />
            </div>
            {priorities.length > 0 && (
              <div className="mt-5">
                <p className="mono-label mb-2 text-fog/55">приоритеты</p>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((pr, i) => (
                    <span key={pr} className="rounded border border-line bg-hull/40 px-2.5 py-1.5 text-[12px] font-medium text-mist">
                      <span className="mr-1.5 font-mono text-[10px] text-ion">{String(i + 1).padStart(2, "0")}</span>
                      {pr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Задачи */}
          <Card title="Задачи" code="SYS·TASKS" delay={0.22} className="lg:col-span-7">
            <div className="grid grid-cols-3 max-md:grid-cols-1 gap-3">
              <Stat value={27} label="активных" tone="var(--color-flux)" delay={0.3} />
              <Stat value={8} label="просроченных" tone="var(--color-crit)" delay={0.38} pulse />
              <Stat value={14} label="выполнено" tone="var(--color-ok)" delay={0.46} />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { t: "Согласовать бюджет маркетинга", s: "просрочена · 2 дня", tone: "var(--color-crit)" },
                { t: "Подготовить отчёт по продажам", s: "сегодня · 18:00", tone: "var(--color-warn)" },
                { t: "Найм руководителя отдела", s: "в работе · ещё 3 дня", tone: "var(--color-flux)" },
              ].map((row) => (
                <div
                  key={row.t}
                  className="flex items-center gap-3 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 transition-colors duration-300 hover:border-line"
                >
                  <span>
                    <StatusDot color={row.tone} />
                  </span>
                  <span className=" text-[13px] font-medium text-mist">{row.t}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: row.tone }}>
                    {row.s}
                  </span>
                </div>
              ))}
            </div>
            <p className="mono-label mt-4 text-fog/40">обновлено только что · операционный цикл</p>
          </Card>

          {/* Команда */}
          <Card title="Команда" code="SYS·CREW" delay={0.28} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={12} label="сотрудников" tone="var(--color-mist)" delay={0.36} />
              <Stat value={5} label="руководителей" tone="var(--color-ion)" delay={0.44} />
            </div>
            {profile?.employees && profile?.managers && (
              <p className="mt-4 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 font-mono text-[11px] text-fog/70">
                по брифу: сотрудников {profile.employees} · руководителей {profile.managers}
              </p>
            )}
            <p className="mono-label mt-4 text-fog/40">состав синхронизирован из брифа</p>
          </Card>

          {/* Встречи */}
          <Card title="Встречи" code="SYS·MEET" delay={0.34} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={3} label="предстоящих" tone="var(--color-flux)" delay={0.42} />
              <Stat value={2} label="протокола ждут" tone="var(--color-warn)" delay={0.5} pulse />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { d: "Пн · 10:00", t: "Планёрка по операциям" },
                { d: "Ср · 12:30", t: "Продажи: план недели" },
                { d: "Пт · 15:00", t: "Финансовый срез" },
              ].map((m) => (
                <div key={m.t} className="flex items-center gap-3 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5">
                  <span className="font-mono text-[10.5px] font-bold tracking-[0.08em] text-flux">{m.d}</span>
                  <span className="truncate text-[13px] font-medium text-mist">{m.t}</span>
                </div>
              ))}
            </div>
            <p className="mono-label mt-4 text-warn/80">2 протокола требуют подтверждения</p>
          </Card>

          {/* Риски */}
          <Card title="Риски" code="SYS·RISK" delay={0.4} className="lg:col-span-4">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-warn">
                {risks.filter((r) => r.tone !== "ok").length || 3}
              </span>
              <span className="mono-label text-fog/60">требуют внимания</span>
            </p>
            <ul className="mt-4 space-y-2">
              {risks.map((r) => (
                <li
                  key={r.t}
                  className="flex items-center gap-3 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 transition-colors duration-300 hover:border-line"
                >
                  <StatusDot color={toneVar[r.tone]} />
                  <span className="text-[13px] font-medium leading-snug text-mist">{r.t}</span>
                </li>
              ))}
            </ul>
            <p className="mono-label mt-4 text-fog/40">источник: экспресс-диагностика + телеметрия</p>
          </Card>

          {/* AI-рекомендация */}
          <section
            className="step-in glass corner relative overflow-hidden rounded-xl p-5 lg:col-span-7"
            style={{ animationDelay: "0.46s" }}
          >
            <span className="cx pointer-events-none absolute inset-0" />
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                  <span className="pulse-glow h-2.5 w-2.5 rounded-full bg-ion" />
                </span>
                <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
                  AI-рекомендация
                </h3>
              </div>
              <span className="mono-label text-fog/45">mycoo advisory</span>
            </header>

            <blockquote className="border-l-2 border-ion pl-4">
              <p className="text-[14.5px] font-medium leading-relaxed text-snow">
                «У вас 4 просроченные задачи, связанные с одним руководителем.
                Рекомендую проверить загрузку и приоритеты.»
              </p>
            </blockquote>

            {rec === "idle" ? (
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={acceptRec}
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-md bg-flux px-5 py-3 text-[13px] font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice"
                >
                  Принять к исполнению
                </button>
                <button
                  onClick={laterRec}
                  className="inline-flex items-center justify-center rounded-md border border-line px-5 py-3 text-[13px] font-semibold text-fog transition-all duration-300 hover:border-warn/50 hover:text-warn"
                >
                  Позже
                </button>
              </div>
            ) : (
              <p
                className={`log-in mt-5 flex items-center gap-2.5 rounded-md border px-4 py-3 font-mono text-[12px] ${
                  rec === "done"
                    ? "border-ok/30 bg-ok/5 text-ok"
                    : "border-warn/30 bg-warn/5 text-warn"
                }`}
              >
                <StatusDot color={rec === "done" ? "var(--color-ok)" : "var(--color-warn)"} />
                {rec === "done"
                  ? "задача создана · назначена ответственному · контроль активен"
                  : "отложено · mycoo вернётся к рекомендации завтра"}
              </p>
            )}
          </section>

          {/* Журнал */}
          <Card title="Операционный журнал" code="SYS·LOG" delay={0.52} className="lg:col-span-5">
            <ul className="space-y-2">
              {journal.slice(0, 6).map((j, i) => (
                <li
                  key={`${j.t}-${j.txt}-${i}`}
                  className="log-in flex items-start gap-3 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5"
                  style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  <span className="shrink-0 font-mono text-[10.5px] font-bold text-fog/60">{j.t}</span>
                  <span className="text-[12.5px] leading-snug text-mist">{j.txt}</span>
                  <span className="ml-auto mt-1 shrink-0">
                    <StatusDot color={j.tone} />
                  </span>
                </li>
              ))}
            </ul>
            <p className="mono-label mt-4 text-fog/40">журнал пополняется автоматически</p>
          </Card>
        </div>

        <p className="mono-label mt-10 text-center text-fog/35">
          mycoo workspace · демо-данные · телеметрия обновляется в реальном продукте
        </p>
      </main>
    </div>
  );
}
