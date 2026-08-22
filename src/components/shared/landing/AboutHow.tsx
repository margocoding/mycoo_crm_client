import { Reveal, useReducedMotion } from "../../../lib/motion";
import { Corners, SectionHeading } from "../../ui/Ambient";
import { IconArrow, IconCheck } from "../../icons";

/* ============ О СИСТЕМЕ ============ */

const CAPABILITIES = [
  "Анализировать информацию",
  "Выявлять проблемы",
  "Формировать решения",
  "Фиксировать договорённости",
  "Создавать задачи",
  "Назначать ответственность",
  "Контролировать исполнение",
  "Выявлять отклонения",
  "Сообщать руководителю о важном",
];

const LOOP_NODES = [
  { label: "Информация", a: -90 },
  { label: "Анализ", a: -30 },
  { label: "Решение", a: 30 },
  { label: "Задачи", a: 90 },
  { label: "Исполнение", a: 150 },
  { label: "Контроль", a: 210 },
];

function LoopDiagram() {
  const reduced = useReducedMotion();
  const C = 170;
  const R = 118;
  const pos = (a: number) => ({
    x: C + R * Math.cos((a * Math.PI) / 180),
    y: C + R * Math.sin((a * Math.PI) / 180),
  });
  return (
    <svg viewBox="0 0 340 340" className="mx-auto w-full max-w-[400px]" role="img" aria-label="Замкнутый операционный цикл MyCOO">
      <circle cx={C} cy={C} r={R} fill="none" stroke="#38bdf8" strokeOpacity="0.25" strokeDasharray="4 6" className="dash-flow" />
      <circle cx={C} cy={C} r={R - 34} fill="none" stroke="#8b85f8" strokeOpacity="0.15" strokeDasharray="2 8" />
      {!reduced && (
        <circle r="5" fill="#38bdf8" opacity="0.9">
          <animateMotion
            dur="16s"
            repeatCount="indefinite"
            path={`M ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C}`}
          />
        </circle>
      )}
      {LOOP_NODES.map((n, i) => {
        const p = pos(n.a);
        const lp = pos(n.a);
        const outward = n.a > -90 && n.a < 90;
        return (
          <g key={n.label}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#0b1226" stroke="#38bdf8" strokeWidth="1.4" />
            <text
              x={lp.x}
              y={lp.y + (outward ? 22 : -14)}
              textAnchor="middle"
              className="fill-[#c3d1e8] font-mono"
              style={{ fontSize: "11px", letterSpacing: "0.08em" }}
            >
              {String(i + 1).padStart(2, "0")} · {n.label}
            </text>
          </g>
        );
      })}
      <text x={C} y={C - 8} textAnchor="middle" className="fill-[#eaf1fc] font-display" style={{ fontSize: "14px", fontWeight: 600 }}>
        замкнутый
      </text>
      <text x={C} y={C + 12} textAnchor="middle" className="fill-[#8ea3c4] font-mono" style={{ fontSize: "10px", letterSpacing: "0.2em" }}>
        ОПЕРАЦИОННЫЙ ЦИКЛ
      </text>
    </svg>
  );
}

export function WhatIs() {
  return (
    <section id="about" className="relative border-t border-line/50 py-24 md:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] max-w-[720px] -translate-x-1/2 rounded-full opacity-40"
        style={{ background: "radial-gradient(ellipse, rgba(139,133,248,0.14), transparent 70%)" }}
      />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="02"
          label="О системе"
          title={
            <>
              MyCOO — цифровой операционный директор{" "}
              <span className="text-flux">вашей компании</span>
            </>
          }
        >
          <p>
            MyCOO собирает информацию о работе компании, понимает её контекст и
            помогает превращать данные в конкретные управленческие действия — от
            договорённости на встрече до выполненной задачи.
          </p>
        </SectionHeading>

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="glass corner relative rounded-xl p-6 md:p-8">
              <Corners />
              <div className="mb-6 flex items-center justify-between">
                <span className="mono-label text-fog">системные функции</span>
                <span className="mono-label text-ok">9 / 9 ready</span>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {CAPABILITIES.map((c) => (
                  <li
                    key={c}
                    className="group flex items-center gap-3 rounded-md border border-line/60 bg-hull/40 px-3.5 py-3 transition-all duration-300 hover:border-flux/40 hover:bg-flux/5"
                  >
                    <span className="text-flux transition-transform duration-300 group-hover:scale-110">
                      <IconCheck className="h-4 w-4" />
                    </span>
                    <span className="text-[13.5px] font-medium text-mist">{c}</span>
                  </li>
                ))}
              </ul>
              <blockquote className="mt-7 border-l-2 border-flux pl-5">
                <p className="text-[15.5px] font-semibold leading-relaxed text-snow">
                  MyCOO не просто показывает данные. Он помогает замыкать
                  операционный цикл — от информации до результата.
                </p>
                <footer className="mono-label mt-3 text-fog">core thesis · v1.0</footer>
              </blockquote>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <LoopDiagram />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ КАК РАБОТАЕТ ============ */

const STEPS = [
  { n: "01", title: "Получает информацию", text: "MyCOO принимает данные из рабочих процессов компании — встречи, переписку, задачи, статусы." },
  { n: "02", title: "Анализирует", text: "AI разбирает контекст и определяет важные события, проблемы и отклонения от плана." },
  { n: "03", title: "Формирует решение", text: "Система предлагает, что необходимо сделать, и фиксирует варианты действий." },
  { n: "04", title: "Запускает действие", text: "Подтверждённое решение превращается в конкретные задачи с ответственными и сроками." },
  { n: "05", title: "Контролирует", text: "MyCOO отслеживает выполнение задач и состояние процессов в реальном времени." },
  { n: "06", title: "Эскалирует", text: "Если ситуация требует участия руководителя — система немедленно сообщает об этом." },
];

const CHAIN = ["Information", "Analysis", "Decision", "Action", "Control", "Result"];

export function HowWorks() {
  return (
    <section id="how" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="03"
          label="Протокол работы"
          title={
            <>
              Шесть тактов одного цикла:{" "}
              <span className="text-flux">от сигнала до результата</span>
            </>
          }
          meta="CYCLE / CONTINUOUS"
        />

        <div className="relative">
          {/* connecting line — horizontal on desktop */}
          <div className="absolute left-0 right-0 top-[26px] hidden h-px lg:block">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
              <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" className="dash-flow" />
            </svg>
          </div>
          {/* vertical line on mobile */}
          <div className="absolute bottom-4 left-[13px] top-4 w-px lg:hidden">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1 100">
              <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" className="dash-flow" />
            </svg>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="group relative pl-10 lg:pl-0">
                  <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center lg:relative lg:mb-5">
                    <span className="absolute inline-flex h-full w-full rounded-full border border-flux/40 bg-void transition-all duration-300 group-hover:border-flux group-hover:shadow-[0_0_18px_-2px_rgba(56,189,248,0.7)]" />
                    <span className="mono-label relative text-[9px] text-flux">{s.n}</span>
                  </div>
                  <h3 className="font-display text-[15px] font-semibold leading-snug text-snow">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-fog">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* chain */}
        <Reveal delay={160}>
          <div className="glass mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 rounded-xl px-6 py-5">
            <span className="mono-label mr-2 text-fog/60">pipeline:</span>
            {CHAIN.map((c, i) => (
              <span key={c} className="flex items-center gap-3">
                <span
                  className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                    i === CHAIN.length - 1
                      ? "border-ok/40 bg-ok/10 text-ok"
                      : "border-line/70 bg-hull/40 text-mist hover:border-flux/50 hover:text-ice"
                  }`}
                >
                  {c}
                </span>
                {i < CHAIN.length - 1 && <IconArrow className="h-3.5 w-3.5 text-flux/60" />}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
