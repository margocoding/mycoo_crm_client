import { useEffect, useState } from "react";
import { Decode, fmtTime, useNow } from "../lib/motion";
import { OrbitRings, StatusChip, StatusDot, CoordTag } from "./ambient";
import { IconArrow } from "./icons";
import { useLaunch } from "../hooks";

const STATUS_ROWS = [
  { key: "Operations", value: "Stable", tone: "ok" as const },
  { key: "Tasks", value: "Active", tone: "flux" as const },
  { key: "Team", value: "Normal", tone: "ok" as const },
  { key: "Risks", value: "03 detected", tone: "warn" as const },
  { key: "Decisions", value: "07 pending", tone: "ion" as const },
];

const AI_FEED = [
  "Проект задерживается — предлагаю перераспределить ресурсы",
  "Требуется согласование бюджета маркетинга",
  "Обнаружено отклонение: срок по задаче #128",
  "Назначить ответственному задачу по найму",
  "Договорённость со встречи не закрыта 3 дня",
];

const toneDot: Record<string, string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
  flux: "var(--color-flux)",
  ion: "var(--color-ion)",
};

function MissionConsole() {
  const now = useNow(1000);
  const [msg, setMsg] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsg((m) => (m + 1) % AI_FEED.length);
        setVisible(true);
      }, 350);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass corner relative overflow-hidden rounded-xl p-5 md:p-6">
      <span className="cx absolute inset-0 pointer-events-none" />
      <div className="scanline" />

      {/* console header */}
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-line/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-crit/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
        </div>
        <span className="mono-label text-fog">mission status</span>
        <span className="font-mono text-[11px] text-fog">
          SYNC {fmtTime(now)}
        </span>
      </div>

      {/* status rows */}
      <ul className="space-y-2.5">
        {STATUS_ROWS.map((r, i) => (
          <li
            key={r.key}
            className="flex items-center justify-between rounded-md border border-line/60 bg-hull/40 px-3 py-2"
            style={{ animation: `blink-soft 1s ease ${i * 0.12}s` }}
          >
            <span className="flex items-center gap-2.5">
              <StatusDot color={toneDot[r.tone]} />
              <span className="font-mono text-[12px] tracking-wide text-mist">
                {r.key}
              </span>
            </span>
            <span
              className="font-mono text-[12px] font-medium"
              style={{ color: toneDot[r.tone] }}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>

      {/* AI COO block */}
      <div className="mt-4 rounded-lg border border-ion/25 bg-ion/8 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="mono-label text-ion">AI COO</span>
          <StatusChip tone="ion">thinking</StatusChip>
        </div>
        <p className="text-[15px] font-semibold text-snow">
          3 решения требуют вашего внимания
        </p>
        <p
          className={`mt-1.5 min-h-[40px] text-[13px] leading-snug text-fog transition-all duration-350 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          }`}
        >
          <span className="mr-1.5 text-ion">→</span>
          {AI_FEED[msg]}
        </p>
      </div>

      {/* mini actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Согласовать", "Делегировать"].map((a) => (
          <button
            key={a}
            className="rounded-md border border-line bg-hull/50 px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-mist uppercase transition-all duration-300 hover:border-flux/60 hover:text-flux hover:shadow-[0_0_18px_-6px_rgba(56,189,248,0.6)]"
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const { open: openLaunch } = useLaunch();
  return (
    <section id="top" className="relative overflow-hidden pt-[72px]">
      {/* ambient */}
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -top-40 right-[-160px] -z-10 opacity-70 md:opacity-100">
        <OrbitRings size={720} />
      </div>
      {/* planet horizon */}
      <div
        className="horizon -z-10"
        style={{
          bottom: "-62vw",
          width: "150vw",
          height: "70vw",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(30,64,140,0.35) 0%, rgba(10,18,42,0.9) 34%, #05080f 60%)",
          boxShadow:
            "0 -1px 0 rgba(125,211,252,0.4), 0 -18px 60px -12px rgba(56,189,248,0.28), 0 -60px 140px -30px rgba(139,133,248,0.2)",
        }}
      />
      <CoordTag text="51.47°N · SECTOR 07 · ORBIT STABLE" className="absolute left-6 top-28 hidden xl:block" />
      <CoordTag text="ALT 408 KM · LINK 99.98%" className="absolute right-6 bottom-40 hidden xl:block" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-28 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* left */}
        <div>
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <StatusChip tone="ok">system online</StatusChip>
            <span className="mono-label text-fog">v1.0 · цифровой COO</span>
          </div>

          <h1 className="font-display text-[clamp(1.85rem,4.8vw,3.55rem)] font-bold leading-[1.08] tracking-tight text-snow">
            <Decode text="Ваш цифровой" delay={150} className="block" />
            <Decode
              text="операционный"
              delay={600}
              className="block text-flux text-glow"
            />
            <Decode text="директор" delay={1050} className="block" />
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-fog md:text-[17px]">
            AI превращает информацию компании в{" "}
            <span className="font-semibold text-mist">управленческие решения</span>,{" "}
            <span className="font-semibold text-mist">задачи</span>,{" "}
            <span className="font-semibold text-mist">контроль</span> и{" "}
            <span className="font-semibold text-mist">договорённости</span>.
          </p>

          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openLaunch}
              className="btn-primary group inline-flex items-center justify-center gap-3 rounded-md bg-flux px-6 py-4 text-[14px] font-bold text-void shadow-[0_0_36px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice hover:shadow-[0_0_52px_-8px_rgba(56,189,248,0.95)]"
            >
              Запустить своего цифрового операционного директора
              <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-4 text-[14px] font-semibold text-mist transition-all duration-300 hover:border-flux/50 hover:text-snow"
            >
              Как это работает
            </a>
          </div>

          {/* telemetry strip */}
          <div className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-line/70 border-y border-line/70">
            {[
              { k: "Циклов анализа", v: "24/7" },
              { k: "Сигналов в день", v: "100+" },
              { k: "Контекст компании", v: "∞" },
            ].map((t) => (
              <div key={t.k} className="px-4 py-4 first:pl-0">
                <div className="font-display text-lg font-semibold text-snow md:text-xl">
                  {t.v}
                </div>
                <div className="mono-label mt-1 text-fog/70 normal-case tracking-[0.14em]">
                  {t.k}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right — mission console */}
        <div className="drift relative">
          <MissionConsole />
          <div className="absolute -bottom-5 -left-5 hidden rounded-md border border-line bg-void/80 px-3 py-2 backdrop-blur md:block">
            <span className="mono-label text-fog/70">DEMO · концепт интерфейса</span>
          </div>
        </div>
      </div>
    </section>
  );
}
