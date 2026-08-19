import { useState } from "react";
import { Reveal } from "../lib/motion";
import { Corners, SectionHeading, StatusChip } from "./ambient";
import {
  IconAdvice,
  IconAnalysis,
  IconCheck,
  IconDecision,
  IconDeviation,
  IconProcess,
  IconTask,
} from "./icons";

const SYS = [
  {
    id: "SYS·01",
    icon: IconDecision,
    title: "Управление решениями",
    text: "Фиксация решений и договорённостей, превращение их в конкретные действия и контроль последующих шагов. Ни одна договорённость не теряется между встречей и исполнением.",
    foot: "decisions tracked · loop closed",
    tone: "flux",
  },
  {
    id: "SYS·02",
    icon: IconTask,
    title: "Управление задачами",
    text: "Создание задач, определение ответственных, сроков и статусов исполнения.",
    foot: "tasks · owners · deadlines",
    tone: "flux",
  },
  {
    id: "SYS·03",
    icon: IconProcess,
    title: "Контроль процессов",
    text: "Мониторинг текущего состояния операционных процессов компании.",
    foot: "telemetry · realtime",
    tone: "ok",
  },
  {
    id: "SYS·04",
    icon: IconAnalysis,
    title: "Анализ информации",
    text: "AI анализирует информацию компании и помогает выявлять важные события и проблемы.",
    foot: "context engine · active",
    tone: "ion",
  },
  {
    id: "SYS·05",
    icon: IconDeviation,
    title: "Контроль отклонений",
    text: "Система обращает внимание на ситуации, которые требуют вмешательства руководителя.",
    foot: "alerts · escalation",
    tone: "warn",
  },
  {
    id: "SYS·06",
    icon: IconAdvice,
    title: "Управленческие рекомендации",
    text: "MyCOO формирует рекомендации на основе контекста и накопленной информации компании.",
    foot: "advisory · context-aware",
    tone: "flux",
  },
];

const toneText: Record<string, string> = {
  flux: "text-flux",
  ok: "text-ok",
  ion: "text-ion",
  warn: "text-warn",
};
const toneChip: Record<string, "ok" | "warn" | "flux" | "ion"> = {
  flux: "flux",
  ok: "ok",
  ion: "ion",
  warn: "warn",
};

function DemoDecision() {
  const [items, setItems] = useState([
    { t: "Согласовать бюджет Q4", done: false },
    { t: "Назначить владельца проекта Atlas", done: false },
    { t: "Утвердить план найма", done: false },
  ]);
  const approve = (i: number) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, done: true } : it)));
  const pending = items.filter((i) => !i.done).length;

  return (
    <div className="mt-6 rounded-lg border border-line/70 bg-void/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono-label text-fog">decision queue</span>
        <span className={`mono-label ${pending ? "text-warn" : "text-ok"}`}>
          {pending} pending
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it.t}
            className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-hull/40 px-3 py-2.5"
          >
            <span
              className={`text-[13px] font-medium transition-colors ${
                it.done ? "text-fog/50 line-through" : "text-mist"
              }`}
            >
              {it.t}
            </span>
            {it.done ? (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ok">
                <IconCheck className="h-3.5 w-3.5" /> принято
              </span>
            ) : (
              <button
                onClick={() => approve(i)}
                className="rounded border border-flux/40 bg-flux/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-flux transition-all duration-300 hover:bg-flux hover:text-void hover:shadow-[0_0_16px_-4px_rgba(56,189,248,0.8)]"
              >
                Подтвердить
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mono-label mt-3 text-fog/50">интерактивная демонстрация · попробуйте</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="04"
          label="Бортовые системы"
          title={
            <>
              Возможности, собранные{" "}
              <span className="text-flux">в единый контур</span>
            </>
          }
          meta="6 SYSTEMS / 1 CORE"
        >
          <p>
            Каждая система — отдельный модуль Mission Control. Вместе они образуют
            непрерывный цикл управления компанией.
          </p>
        </SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {SYS.map((s, i) => {
            const big = i === 0;
            const Icon = s.icon;
            return (
              <Reveal
                key={s.id}
                delay={i * 80}
                className={
                  big
                    ? "sm:col-span-2 lg:col-span-4 lg:row-span-2"
                    : "lg:col-span-2"
                }
              >
                <article
                  className={`glass corner card-hover group relative flex h-full flex-col rounded-xl p-6 ${
                    big ? "lg:p-8" : ""
                  }`}
                >
                  <Corners />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-lg border border-line/80 bg-hull/60 ${toneText[s.tone]} transition-all duration-300 group-hover:border-current group-hover:shadow-[0_0_20px_-6px_currentColor]`}>
                        <Icon className="h-[22px] w-[22px]" />
                      </span>
                      <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-fog/70">
                        {s.id}
                      </span>
                    </div>
                    <StatusChip tone={toneChip[s.tone]}>active</StatusChip>
                  </div>

                  <h3 className={`font-display mt-5 font-semibold text-snow ${big ? "text-xl md:text-2xl" : "text-[16px]"}`}>
                    {s.title}
                  </h3>
                  <p className={`mt-3 leading-relaxed text-fog ${big ? "text-[14.5px] max-w-xl" : "text-[13.5px]"}`}>
                    {s.text}
                  </p>

                  {big && <DemoDecision />}

                  <div className="mt-auto pt-6">
                    <div className="flex items-center gap-2 border-t border-line/50 pt-4">
                      <span className="h-1 w-1 rounded-full bg-flux/70" />
                      <span className="mono-label text-fog/60">{s.foot}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
