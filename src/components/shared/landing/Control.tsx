import { useState } from "react";
import { fmtTime, useNow, Reveal } from "../../../lib/motion";
import { Bar, Corners, SectionHeading, StatusChip, StatusDot } from "../../ui/Ambient";
import { IconCheck } from "../../icons";

const LOGS = [
  "[09:41:07] sync: crm · ok",
  "[09:41:12] deviation: проект Alpha · срок +4 дня",
  "[09:41:18] decision: бюджет маркетинга → ожидает",
  "[09:41:24] task #128 закрыта · отв. С. Орлова",
  "[09:41:31] meeting notes → 3 договорённости зафиксированы",
  "[09:41:37] risk scan: 03 фактора · уровень low",
  "[09:41:44] control: найм · approval required",
  "[09:41:52] report: операционный срез отправлен CEO",
];

const OPS = [
  { name: "Проект Alpha", lead: "Д. Ким", value: 68, color: "var(--color-warn)", note: "delayed" },
  { name: "Проект Orion", lead: "М. Ветрова", value: 82, color: "var(--color-flux)", note: "on track" },
  { name: "Маркетинг Q3", lead: "А. Шульц", value: 54, color: "var(--color-ion)", note: "review" },
  { name: "Найм команды", lead: "HR-контур", value: 41, color: "var(--color-flux)", note: "approval" },
];

const ALERTS = [
  { text: "Project Alpha: delayed", tone: "warn", meta: "Δ +4 дня" },
  { text: "Marketing: budget review", tone: "warn", meta: "+8% к плану" },
  { text: "Hiring: approval required", tone: "flux", meta: "2 позиции" },
];

export default function Control() {
  const now = useNow(1000);
  const [decisions, setDecisions] = useState([
    { t: "Согласовать бюджет маркетинга на Q4", who: "CEO", done: false },
    { t: "Назначить владельца проекта Atlas", who: "COO-контур", done: false },
    { t: "Утвердить план найма инженерной команды", who: "HR + CEO", done: false },
  ]);
  const pending = decisions.filter((d) => !d.done).length;

  return (
    <section id="control" className="relative border-t border-line/50 py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[500px] opacity-50"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(56,189,248,0.09), transparent 70%)" }}
      />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="05"
          label="Центр управления"
          title={
            <>
              Вот так выглядит{" "}
              <span className="text-flux">центр управления компанией</span>
            </>
          }
          meta="LIVE MOCKUP"
        >
          <p>
            Телеметрия компании, рекомендации AI и решения, ожидающие вашей
            команды, — в одном экране. Демонстрация концепции интерфейса.
          </p>
        </SectionHeading>

        <Reveal>
          <div className="glass corner relative overflow-hidden rounded-2xl">
            <Corners />
            <div className="scanline" />

            {/* top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 bg-hull/40 px-5 py-3.5 md:px-7">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-crit/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
                </div>
                <span className="mono-label text-mist">mycoo / mission control</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusChip tone="ok">all systems go</StatusChip>
                <span className="font-mono text-[11px] text-fog">{fmtTime(now)} · UTC+3</span>
              </div>
            </div>

            <div className="grid gap-px bg-line/40 lg:grid-cols-[0.9fr_1.25fr_0.95fr]">
              {/* col 1 — company status */}
              <div className="bg-void/60 p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="mono-label text-fog">статус компании</span>
                  <span className="font-mono text-[10px] text-fog/60">TELEMETRY</span>
                </div>
                <div className="space-y-5">
                  <Bar label="Operations" value={94} delay={0} />
                  <Bar label="Team" value={82} color="var(--color-ice)" delay={120} />
                  <Bar label="Projects" value={87} color="var(--color-ion)" delay={240} />
                  <Bar label="Execution" value={91} color="var(--color-ok)" delay={360} />
                </div>
                <div className="mt-7 rounded-md border border-line/60 bg-hull/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-fog/70">общий индекс</span>
                    <span className="font-mono text-[11px] text-ok">▲ +2.4 за неделю</span>
                  </div>
                  <div className="font-display mt-2 text-3xl font-bold text-snow">
                    88.5<span className="text-base text-fog">%</span>
                  </div>
                </div>
              </div>

              {/* col 2 — AI COO + active ops */}
              <div className="bg-void/40 p-5 md:p-7">
                <div className="rounded-lg border border-ion/30 bg-ion/8 p-5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="mono-label text-ion">AI COO · сводка</span>
                    <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-ion/80 uppercase">
                      <StatusDot color="var(--color-ion)" /> analyzing
                    </span>
                  </div>
                  <p className="text-[17px] font-bold text-snow">
                    {pending > 0
                      ? `${pending} решения требуют внимания`
                      : "Все решения приняты ✓"}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fog">
                    Приоритет: задержка проекта Alpha. Рекомендую перераспределить
                    двух инженеров из Orion и согласовать бюджет маркетинга сегодня.
                  </p>
                </div>

                <div className="mb-4 mt-7 flex items-center justify-between">
                  <span className="mono-label text-fog">активные операции</span>
                  <span className="font-mono text-[10px] text-fog/60">{OPS.length} STREAMS</span>
                </div>
                <div className="space-y-4">
                  {OPS.map((o, i) => (
                    <div key={o.name} className="group rounded-md border border-line/60 bg-hull/30 p-3.5 transition-colors duration-300 hover:border-flux/35">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13.5px] font-semibold text-mist">{o.name}</span>
                          <span className="mono-label text-fog/50">{o.lead}</span>
                        </div>
                        <span className="rounded border border-line/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-fog">
                          {o.note}
                        </span>
                      </div>
                      <Bar label="" value={o.value} color={o.color} delay={i * 100} />
                    </div>
                  ))}
                </div>
              </div>

              {/* col 3 — alerts + decisions */}
              <div className="bg-void/60 p-5 md:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <span className="mono-label text-fog">alerts</span>
                  <span className="mono-label text-warn">{ALERTS.length} active</span>
                </div>
                <ul className="space-y-2.5">
                  {ALERTS.map((a) => (
                    <li
                      key={a.text}
                      className={`flex items-center justify-between gap-3 rounded-md border px-3.5 py-3 ${
                        a.tone === "warn"
                          ? "border-warn/25 bg-warn/5"
                          : "border-flux/25 bg-flux/5"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <StatusDot color={a.tone === "warn" ? "var(--color-warn)" : "var(--color-flux)"} />
                        <span className="font-mono text-[12px] text-mist">{a.text}</span>
                      </span>
                      <span className="mono-label text-fog/60">{a.meta}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-4 mt-7 flex items-center justify-between">
                  <span className="mono-label text-fog">decisions</span>
                  <span className={`mono-label ${pending ? "text-ion" : "text-ok"}`}>
                    {pending} в ожидании
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {decisions.map((d, i) => (
                    <li key={d.t} className="rounded-md border border-line/60 bg-hull/30 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-[13px] font-medium leading-snug ${d.done ? "text-fog/50 line-through" : "text-mist"}`}>
                          {d.t}
                        </p>
                        {d.done ? (
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ok">
                            <IconCheck className="h-3.5 w-3.5" /> ok
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setDecisions((p) => p.map((x, j) => (j === i ? { ...x, done: true } : x)))
                            }
                            className="shrink-0 rounded border border-ion/45 bg-ion/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ion transition-all duration-300 hover:bg-ion hover:text-void hover:shadow-[0_0_16px_-4px_rgba(139,133,248,0.8)]"
                          >
                            Command
                          </button>
                        )}
                      </div>
                      <span className="mono-label mt-2 block text-fog/50">эскалация: {d.who}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* log ticker */}
            <div className="ticker-mask overflow-hidden border-t border-line/70 bg-void/80 py-3">
              <div className="ticker-track gap-10">
                {[...LOGS, ...LOGS].map((l, i) => (
                  <span key={i} className="flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-fog/80">
                    <span className="h-1 w-1 rounded-full bg-flux/60" />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
