import { Reveal, useReducedMotion } from "../lib/motion";
import { Corners, SectionHeading, StatusChip } from "./ambient";
import { IconArrow } from "./icons";

/* ============ ЦЕННОСТЬ ============ */

function Chain({
  items,
  tone,
}: {
  items: string[];
  tone: "dim" | "flux";
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5">
      {items.map((c, i) => (
        <span key={c} className="flex items-center gap-2.5">
          <span
            className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] ${
              tone === "dim"
                ? "border-line/60 bg-hull/30 text-fog/70"
                : i === items.length - 1
                ? "border-ok/45 bg-ok/10 text-ok"
                : "border-flux/35 bg-flux/5 text-ice"
            }`}
          >
            {c}
          </span>
          {i < items.length - 1 && (
            <IconArrow
              className={`h-3.5 w-3.5 ${tone === "dim" ? "text-fog/40" : "text-flux/70"}`}
            />
          )}
        </span>
      ))}
    </div>
  );
}

function ReturnArc() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mt-3 h-12">
      <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="h-full w-full">
        <path
          d="M 965 8 C 965 52, 35 52, 35 8"
          fill="none"
          stroke="#8b85f8"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeDasharray="5 6"
          className={reduced ? "" : "dash-flow"}
          vectorEffect="non-scaling-stroke"
        />
        <path d="M 28 14 L 35 2 L 43 13" fill="none" stroke="#8b85f8" strokeOpacity="0.75" strokeWidth="1.5" />
      </svg>
      <span className="mono-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-void px-3 text-ion/90">
        обратная связь · контекст растёт
      </span>
    </div>
  );
}

export function Value() {
  return (
    <section
      id="value"
      className="relative border-t border-line/50 py-24 md:py-32"
      style={{ background: "linear-gradient(180deg, rgba(11,18,38,0.55), rgba(4,7,15,0) 85%)" }}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="06"
          label="Операционный контур"
          title={
            <>
              Не ещё один dashboard.{" "}
              <span className="text-ion">Операционный контур компании.</span>
            </>
          }
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* classic */}
          <Reveal>
            <div className="relative flex h-full flex-col rounded-xl border border-dashed border-line/80 bg-hull/20 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="mono-label text-fog/70">классический подход</span>
                <StatusChip tone="warn">обрывается на отчёте</StatusChip>
              </div>
              <Chain items={["Данные", "Графики", "Отчёты", "Руководитель"]} tone="dim" />
              <div className="mt-8 flex-1">
                <p className="max-w-md text-[14px] leading-relaxed text-fog/80">
                  Обычные системы помогают <em className="not-italic text-mist">увидеть</em>{" "}
                  происходящее. Дальше — вручную: выводы, напоминания, контроль,
                  потерянные договорённости.
                </p>
              </div>
              <div className="mt-6 border-t border-line/50 pt-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog/50">
                  loop: <span className="text-crit/80">open · действия не замыкаются</span>
                </span>
              </div>
            </div>
          </Reveal>

          {/* mycoo */}
          <Reveal delay={130}>
            <div className="glass corner relative flex h-full flex-col rounded-xl p-6 shadow-[0_0_60px_-20px_rgba(56,189,248,0.35)] md:p-8">
              <Corners />
              <div className="mb-6 flex items-center justify-between">
                <span className="mono-label text-flux">MyCOO</span>
                <StatusChip tone="ok">контур замкнут</StatusChip>
              </div>
              <Chain
                items={["Данные", "AI-анализ", "Решение", "Задача", "Исполнение", "Контроль", "Результат"]}
                tone="flux"
              />
              <ReturnArc />
              <div className="mt-4 flex-1">
                <p className="max-w-md text-[14px] leading-relaxed text-fog">
                  MyCOO помогает <span className="font-semibold text-mist">превращать происходящее</span>{" "}
                  в конкретные управленческие действия — и возвращает результат обратно
                  в систему как новый контекст.
                </p>
              </div>
              <div className="mt-6 border-t border-line/50 pt-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog/50">
                  loop: <span className="text-ok">closed · mission control</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ ДЛЯ КОГО ============ */

const PERSONAS = [
  {
    id: "TARGET·01",
    title: "Собственники бизнеса",
    text: "Когда руководитель больше не хочет лично контролировать каждую операционную деталь и ищет способ выйти из ручного управления.",
    accent: "var(--color-flux)",
  },
  {
    id: "TARGET·02",
    title: "Руководители компаний",
    text: "Когда необходимо держать под контролем большое количество процессов, задач и команд — без потери качества решений.",
    accent: "var(--color-ion)",
  },
  {
    id: "TARGET·03",
    title: "Руководители отделов",
    text: "Когда важно синхронизировать команду, решения и исполнение, чтобы ничего не зависало между встречами.",
    accent: "var(--color-ice)",
  },
  {
    id: "TARGET·04",
    title: "Растущие компании",
    text: "Когда старые способы управления перестают масштабироваться вместе с бизнесом — и появляется операционный хаос.",
    accent: "var(--color-ok)",
  },
];

export function Audience() {
  return (
    <section id="audience" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="07"
          label="Экипаж"
          title={
            <>
              Для кого построен <span className="text-flux">MyCOO</span>
            </>
          }
          meta="4 PROFILES"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((p, i) => (
            <Reveal key={p.id} delay={i * 100}>
              <article
                className="glass corner card-hover group relative h-full rounded-xl p-6"
                style={{ borderTopColor: `color-mix(in srgb, ${p.accent} 40%, transparent)` }}
              >
                <Corners />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-fog/60">
                    {p.id}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full transition-shadow duration-300 group-hover:shadow-[0_0_12px_1px_currentColor]"
                    style={{ backgroundColor: p.accent, color: p.accent }}
                  />
                </div>
                <h3 className="font-display mt-5 text-[16px] font-semibold leading-snug text-snow">
                  {p.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fog">{p.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="font-display mx-auto mt-14 max-w-3xl text-center text-[clamp(1.15rem,2.6vw,1.7rem)] font-semibold leading-snug text-snow">
            Чем сложнее становится компания,{" "}
            <span className="text-flux">тем важнее единый операционный контур</span>{" "}
            управления.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
