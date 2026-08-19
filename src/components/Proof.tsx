import { Reveal } from "../lib/motion";
import { Corners, SectionHeading, StatusChip } from "./ambient";

/* ============ КЕЙСЫ ============ */

const REPORT_SECTIONS = [
  { key: "Задача", note: "Что требовалось решить" },
  { key: "До MyCOO", note: "Какая проблема существовала" },
  { key: "После внедрения", note: "Как изменился процесс" },
  { key: "Result", note: "Конкретный результат в цифрах" },
];

function MissionReport({ id, sector }: { id: string; sector: string }) {
  return (
    <article className="glass corner card-hover relative h-full rounded-xl p-6 md:p-8">
      <Corners />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-bold tracking-wide text-snow">{id}</span>
          <span className="mono-label text-fog/60">{sector}</span>
        </div>
        <StatusChip tone="warn">data pending</StatusChip>
      </div>

      <dl className="mt-6 space-y-5">
        {REPORT_SECTIONS.map((s, i) => (
          <div key={s.key} className="grid grid-cols-[110px_1fr] gap-4 sm:grid-cols-[150px_1fr]">
            <dt className="mono-label pt-0.5 text-flux/90">{s.key}</dt>
            <dd>
              <p className="text-[13.5px] font-medium text-mist">{s.note}</p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-hull/80" />
                <div className="h-2 rounded bg-hull/60" style={{ width: `${88 - i * 14}%` }} />
              </div>
              <p className="mono-label mt-2 text-fog/45">ожидает данных заказчика</p>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function Cases() {
  return (
    <section id="cases" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="08"
          label="Отчёты о миссиях"
          title={
            <>
              Кейсы: <span className="text-flux">MISSION REPORT</span>
            </>
          }
          meta="STRUCTURE READY"
        >
          <p>
            Структура отчётов готова к публикации. Данные кейсов предоставляются
            заказчиком и размещаются без изменения фактов — мы не публикуем
            выдуманные цифры.
          </p>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <MissionReport id="MISSION 001" sector="сектор: ритейл / ops" />
          </Reveal>
          <Reveal delay={130}>
            <MissionReport id="MISSION 002" sector="сектор: SaaS / рост" />
          </Reveal>
        </div>

        <Reveal delay={200}>
          <p className="mono-label mt-8 text-center text-fog/50">
            кейсы публикуются с согласия клиентов · факты не редактируются
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ ОТЗЫВЫ ============ */

function FeedbackSlot({ delay, channel }: { delay: number; channel: string }) {
  return (
    <Reveal delay={delay}>
      <article className="glass corner card-hover relative flex h-full flex-col rounded-xl p-6">
        <Corners />
        <div className="flex items-center justify-between border-b border-line/70 pb-4">
          <span className="mono-label text-flux">client feedback</span>
          <span className="mono-label text-ok/80">verified</span>
        </div>
        <div className="flex-1 py-5">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-fog/30" fill="currentColor">
            <path d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H6.5A1.5 1.5 0 0 1 8 8.5V7h2V7Zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-3.5a1.5 1.5 0 0 1 1.5-1.5V7h2V7Z" opacity="0.6" />
          </svg>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded bg-hull/80" />
            <div className="h-2 w-11/12 rounded bg-hull/70" />
            <div className="h-2 w-4/6 rounded bg-hull/60" />
          </div>
          <p className="mono-label mt-5 text-fog/45">
            &gt; передача не получена · канал открыт
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-line/70 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-hull/60 font-mono text-[10px] text-fog/60">
            ···
          </span>
          <div>
            <div className="h-2.5 w-24 rounded bg-hull/80" />
            <div className="mt-1.5 h-2 w-32 rounded bg-hull/60" />
          </div>
          <span className="mono-label ml-auto text-fog/40">{channel}</span>
        </div>
      </article>
    </Reveal>
  );
}

export function Testimonials() {
  return (
    <section id="feedback" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="09"
          label="Обратная связь"
          title={
            <>
              Отзывы клиентов — <span className="text-flux">канал открыт</span>
            </>
          }
          meta="FEEDBACK / VERIFIED"
        >
          <p>
            Мы не публикуем выдуманные отзывы. Ниже — готовая структура: сюда встанут
            подтверждённые отзывы клиентов с именем, должностью и компанией.
          </p>
        </SectionHeading>

        <div className="grid gap-4 md:grid-cols-3">
          <FeedbackSlot delay={0} channel="CH·01" />
          <FeedbackSlot delay={110} channel="CH·02" />
          <FeedbackSlot delay={220} channel="CH·03" />
        </div>
      </div>
    </section>
  );
}
