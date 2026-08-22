import { Reveal } from "../../../lib/motion";
import { Corners, SectionHeading } from "../../ui/Ambient";

const FLOW = ["Информация", "Встречи", "Решения", "Задачи", "Исполнение", "Контроль"];
const BROKEN_AFTER = new Set([0, 2, 4]);

const PROBLEMS = [
  {
    n: "ERR·01",
    title: "Информация разбросана",
    text: "Данные живут в чатах, встречах, документах, CRM, таблицах и десятках других систем. Единой картины происходящего нет ни у кого — даже у руководителя.",
    tag: "DATA / SCATTERED",
  },
  {
    n: "ERR·02",
    title: "Решения теряются",
    text: "Договорённости принимаются на встречах, но не всегда превращаются в конкретные действия. Часть решений просто растворяется в переписке.",
    tag: "DECISIONS / LOST",
  },
  {
    n: "ERR·03",
    title: "Задачи требуют постоянного контроля",
    text: "Руководителю приходится самому спрашивать о статусах, напоминать о сроках и вручную проверять исполнение каждой договорённости.",
    tag: "CONTROL / MANUAL",
  },
  {
    n: "ERR·04",
    title: "Руководитель становится диспетчером",
    text: "Вместо стратегии и развития — бесконечная операционка: согласования, напоминания, «а что у нас с этим?». Время руководителя сгорает в рутине.",
    tag: "FOCUS / OVERRUN",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="relative border-t border-line/50 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* sticky left */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            index="01"
            label="Диагностика"
            title={
              <>
                Информации становится больше.
                <br />
                <span className="text-warn">Управлять компанией — сложнее.</span>
              </>
            }
          >
            <p>
              Каждый день компания генерирует встречи, сообщения, договорённости и
              задачи. Без единой системы этот поток распадается на фрагменты — и
              управление превращается в ручную работу.
            </p>
          </SectionHeading>

          {/* broken flow */}
          <Reveal delay={120}>
            <div className="glass corner relative rounded-xl p-5">
              <Corners />
              <div className="mb-4 flex items-center justify-between">
                <span className="mono-label text-fog">операционный поток</span>
                <span className="mono-label text-crit">integrity 34%</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                {FLOW.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`rounded border px-2.5 py-1.5 font-mono text-[11px] tracking-wide ${
                        BROKEN_AFTER.has(i)
                          ? "border-line/50 text-fog/60"
                          : "border-flux/30 bg-flux/5 text-ice"
                      }`}
                    >
                      {step}
                    </span>
                    {i < FLOW.length - 1 &&
                      (BROKEN_AFTER.has(i) ? (
                        <span className="flex items-center gap-0.5 text-crit" title="Разрыв потока">
                          <svg viewBox="0 0 18 8" className="h-2 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <path d="M0 4h5M8 1l-2 3 2 3M11 4h7" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : (
                        <svg viewBox="0 0 18 8" className="h-2 w-4 text-flux/70" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M0 4h13M10 1l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ))}
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-line/60 pt-3 text-[13px] leading-relaxed text-fog">
                На каждом разрыве теряются решения, сроки и ответственность.
                Хаос — не исключение, а <span className="text-crit">режим по умолчанию</span>.
              </p>
            </div>
          </Reveal>
        </div>

        {/* problem cards */}
        <div className="space-y-5">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.n} delay={i * 90}>
              <article className="glass corner card-hover group relative rounded-xl p-6 md:p-7">
                <Corners />
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-crit/80">
                    {p.n}
                  </span>
                  <span className="mono-label rounded border border-line/70 bg-hull/50 px-2 py-1 text-fog/70">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-display mt-3 text-lg font-semibold text-snow md:text-xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-fog">{p.text}</p>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-crit/40 via-line/40 to-transparent transition-all duration-500 group-hover:from-flux/50" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
