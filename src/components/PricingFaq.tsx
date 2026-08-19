import { useState } from "react";
import { Reveal } from "../lib/motion";
import { Corners, SectionHeading, StatusChip } from "./ambient";
import { IconCheck } from "./icons";

/* ============ ТАРИФЫ ============ */

const PLANS = [
  {
    id: "START",
    name: "Пуск",
    desc: "Базовый операционный контур для небольшой команды.",
    features: [
      "Управление решениями и договорённостями",
      "Управление задачами и ответственными",
      "Контроль отклонений и alerts",
      "До 5 пользователей",
      "Базовая операционная сводка",
    ],
    limits: ["Интеграции и объём данных — уточняются"],
    recommended: false,
  },
  {
    id: "MISSION",
    name: "Миссия",
    desc: "Полный цикл управления для растущей компании.",
    features: [
      "Всё из тарифа «Пуск»",
      "AI-анализ информации компании",
      "Управленческие рекомендации",
      "Контроль процессов в реальном времени",
      "До 25 пользователей",
      "Приоритетная поддержка запуска",
    ],
    limits: ["Расширения контура — по запросу"],
    recommended: true,
  },
  {
    id: "ENTERPRISE",
    name: "Флот",
    desc: "Несколько компаний или крупные операционные структуры.",
    features: [
      "Всё из тарифа «Миссия»",
      "Несколько операционных контуров",
      "Индивидуальная конфигурация",
      "Пользователи — без фиксированного лимита",
      "Сопровождение внедрения командой MyCOO",
    ],
    limits: ["Условия формируются индивидуально"],
    recommended: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative border-t border-line/50 py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-50"
        style={{ background: "radial-gradient(ellipse 55% 60% at 50% 0%, rgba(139,133,248,0.1), transparent 70%)" }}
      />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="10"
          label="Планы подключения"
          title={
            <>
              Тарифы: <span className="text-flux">выберите свою орбиту</span>
            </>
          }
          meta="3 TIERS"
        >
          <p>
            Структура тарифов зафиксирована. Точные условия и стоимость
            предоставляет команда MyCOO на этапе запуска — мы не публикуем цифры,
            которые не готовы подтвердить.
          </p>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 110}>
              <article
                className={`corner card-hover relative flex h-full flex-col rounded-xl p-7 ${
                  p.recommended
                    ? "glass border-flux/40 shadow-[0_0_60px_-18px_rgba(56,189,248,0.5)]"
                    : "glass"
                }`}
              >
                <Corners />
                {p.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full border border-flux/50 bg-void px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flux shadow-[0_0_20px_-4px_rgba(56,189,248,0.7)]">
                      рекомендуемый
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-[0.24em] text-fog/60">
                    TIER·{p.id}
                  </span>
                  <StatusChip tone={p.recommended ? "flux" : "ok"}>
                    {p.recommended ? "core" : "available"}
                  </StatusChip>
                </div>
                <h3 className="font-display mt-4 text-2xl font-bold text-snow">{p.name}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fog">{p.desc}</p>

                {/* price */}
                <div className="my-6 rounded-lg border border-line/70 bg-hull/30 px-5 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-snow">—</span>
                    <span className="font-mono text-[12px] text-fog">₽ / мес</span>
                  </div>
                  <span className="mono-label mt-1.5 block text-fog/55">
                    стоимость уточняется при подключении
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-mist">
                      <span className={`mt-0.5 ${p.recommended ? "text-flux" : "text-ok"}`}>
                        <IconCheck className="h-4 w-4" />
                      </span>
                      {f}
                    </li>
                  ))}
                  {p.limits.map((l) => (
                    <li key={l} className="flex items-start gap-2.5 text-[13px] text-fog/70">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-fog/50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                        <path d="M9 12h6" />
                      </svg>
                      {l}
                    </li>
                  ))}
                </ul>

                <a
                  href="#launch"
                  className={`btn-primary mt-8 block rounded-md px-5 py-3.5 text-center text-[13.5px] font-bold transition-all duration-300 ${
                    p.recommended
                      ? "bg-flux text-void shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] hover:bg-ice"
                      : "border border-line text-mist hover:border-flux/60 hover:text-flux"
                  }`}
                >
                  Запустить MyCOO
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ FAQ ============ */

const FAQ = [
  {
    q: "Что такое MyCOO?",
    a: "MyCOO — цифровой операционный директор компании. Система собирает информацию о работе компании, понимает её контекст и помогает превращать данные в управленческие решения, задачи, контроль и договорённости.",
  },
  {
    q: "Чем MyCOO отличается от обычного AI-ассистента?",
    a: "Ассистент отвечает на вопросы. MyCOO замыкает операционный цикл: фиксирует договорённости, превращает решения в задачи с ответственными и сроками, контролирует исполнение и эскалирует руководителю ситуации, требующие внимания.",
  },
  {
    q: "Чем MyCOO отличается от ChatGPT?",
    a: "ChatGPT — универсальный диалоговый интерфейс без контекста вашей компании и без управления исполнением. MyCOO работает с информацией ваших рабочих процессов и доводит дело до конкретных действий, статусов и результата.",
  },
  {
    q: "Какие данные использует система?",
    a: "MyCOO работает с информацией рабочих процессов компании: встречи, договорённости, задачи, статусы, переписка по рабочим вопросам. Конкретный состав источников определяется вместе с вами на этапе запуска.",
  },
  {
    q: "Как MyCOO работает с информацией компании?",
    a: "Система получает информацию из рабочих процессов, анализирует контекст, определяет важные события, проблемы и отклонения, формирует решения и рекомендации. Детальный порядок обработки данных предоставляется командой MyCOO.",
  },
  {
    q: "Может ли MyCOO самостоятельно принимать решения?",
    a: "MyCOO формирует решения и рекомендации, готовит задачи и действия. Подтверждение ключевых решений остаётся за руководителем — система не подменяет управление, а усиливает его.",
  },
  {
    q: "Где требуется подтверждение руководителя?",
    a: "В точках, которые вы определяете: согласование решений, приоритеты, чувствительные изменения. Конфигурация точек подтверждения настраивается при запуске под вашу модель управления.",
  },
  {
    q: "Нужно ли менять текущие процессы компании?",
    a: "MyCOO встраивается в существующую операционную модель: сценарий запуска формируется исходя из ваших процессов, а не наоборот. Объём необходимых изменений обсуждается индивидуально.",
  },
  {
    q: "Как быстро можно начать работу?",
    a: "Запуск проходит вместе с командой MyCOO. Сроки подключения и первого операционного цикла подтверждаются индивидуально — оставьте заявку, и мы обозначим конкретный план старта.",
  },
  {
    q: "Какие тарифы доступны?",
    a: "Три уровня: «Пуск» — базовый операционный контур, «Миссия» — полный цикл с AI-анализом и рекомендациями, «Флот» — несколько контуров и индивидуальные условия. Стоимость уточняется при подключении.",
  },
  {
    q: "Насколько безопасны данные?",
    a: "Мы не публикуем гарантий, которые не готовы подтвердить документально. Порядок работы с данными, доступы и обязательства фиксируются в договоре и предоставляются по запросу до начала сотрудничества.",
  },
];

function FaqItem({ item, i }: { item: { q: string; a: string }; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div
      className={`glass corner relative overflow-hidden rounded-xl transition-colors duration-300 ${
        open ? "border-flux/30" : ""
      }`}
    >
      <Corners />
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left md:px-7"
      >
        <span className="flex items-baseline gap-4">
          <span className="font-mono text-[11px] font-bold text-flux/70">
            Q{String(i + 1).padStart(2, "0")}
          </span>
          <span className={`font-display text-[14.5px] font-semibold transition-colors md:text-[15.5px] ${open ? "text-snow" : "text-mist"}`}>
            {item.q}
          </span>
        </span>
        <span
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all duration-400 ${
            open ? "border-flux/60 text-flux" : "border-line text-fog"
          }`}
        >
          <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-400 ${open ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </span>
      </button>
      <div className={`acc-body ${open ? "open" : ""}`}>
        <div>
          <p className="border-t border-line/50 px-5 pb-6 pt-4 text-[14px] leading-relaxed text-fog md:px-7 md:pl-[72px]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <SectionHeading
          index="11"
          label="Вопросы и ответы"
          title={
            <>
              Сомнения экипажа — <span className="text-flux">разбираем по пунктам</span>
            </>
          }
        />
        <div className="space-y-3.5">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 40, 240)}>
              <FaqItem item={f} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
