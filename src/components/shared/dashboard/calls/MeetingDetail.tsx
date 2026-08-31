import { useState } from "react";
import {
  LuArrowLeft,
  LuCalendar,
  LuCheckCheck,
  LuClock,
  LuFileText,
  LuListChecks,
  LuMic,
  LuSparkles,
  LuUsers,
  LuVideo,
  LuInfo,
  LuTarget,
  LuArrowRight,
  LuBadgeAlert,
  LuCheck,
} from "react-icons/lu";
import { Meeting, teamMembers } from "../../../../data/meetings/mockData";
import { StatusChip, StatusDot } from "../../../ui/Ambient";

interface MeetingDetailProps {
  meeting: Meeting;
  onBack: () => void;
}

type Tab = "details" | "transcript" | "summary" | "agreements";

const platformLabel: Record<Meeting["platform"], string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  yandex: "Яндекс Телемост",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDeadline = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][d.getMonth()]}`;
};

export default function MeetingDetail({ meeting, onBack }: MeetingDetailProps) {
  const [tab, setTab] = useState<Tab>("details");
  const [agreements, setAgreements] = useState(meeting.agreements || []);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "done">("idle");

  const members = meeting.participants
    .map((id) => teamMembers.find((m) => m.id === id))
    .filter(Boolean);

  const tabs: { id: Tab; label: string; icon: typeof LuFileText; code: string }[] = [
    { id: "details", label: "Детали", icon: LuInfo, code: "01" },
    { id: "transcript", label: "Transcript", icon: LuMic, code: "02" },
    { id: "summary", label: "Саммари", icon: LuSparkles, code: "03" },
    { id: "agreements", label: "Договорённости", icon: LuListChecks, code: "04" },
  ];

  const handleCreateAll = () => {
    setAgreements((a) => a.map((ag) => ({ ...ag, status: "created" as const })));
    setBulkStatus("done");
  };

  const pendingCount = agreements.filter((a) => a.status === "pending").length;
  const createdCount = agreements.filter((a) => a.status === "created").length;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12.5px] font-medium text-fog/70 transition-colors hover:text-flux"
      >
        <LuArrowLeft className="h-4 w-4" />
        назад к списку встреч
      </button>

      <header className="glass corner relative overflow-hidden rounded-xl p-6 md:p-8">
        <span className="cx pointer-events-none absolute inset-0" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="mono-label text-fog/50">SYS·MEET</span>
              <span className="font-mono text-fog/40">/</span>
              <span className="font-mono text-fog/60">{meeting.id.toUpperCase()}</span>
              {meeting.status === "processing" && (
                <StatusChip tone="warn">AI обрабатывает</StatusChip>
              )}
              {meeting.status === "completed" && (
                <StatusChip tone="ok">завершена</StatusChip>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-snow md:text-3xl">
              {meeting.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[12.5px] text-fog">
              <span className="flex items-center gap-1.5">
                <LuCalendar className="h-3.5 w-3.5 text-flux" />
                {formatDate(meeting.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <LuClock className="h-3.5 w-3.5 text-flux" />
                {meeting.time} · {meeting.duration} мин
              </span>
              <span className="flex items-center gap-1.5">
                <LuVideo className="h-3.5 w-3.5 text-flux" />
                {platformLabel[meeting.platform]}
              </span>
              <span className="flex items-center gap-1.5">
                <LuUsers className="h-3.5 w-3.5 text-flux" />
                {members.length} участника
              </span>
            </div>
          </div>
          {meeting.hasRecording && meeting.status === "completed" && (
            <button className="flex items-center gap-2 rounded-lg border border-flux/30 bg-flux/5 px-4 py-2.5 text-[12px] font-semibold text-flux transition-all hover:border-flux/60 hover:bg-flux/10">
              <LuVideo className="h-4 w-4" />
              Смотреть запись
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-line/40 pb-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-[12.5px] font-medium transition-all ${
                active
                  ? "border-flux text-snow"
                  : "border-transparent text-fog/60 hover:text-mist"
              }`}
            >
              {active && <StatusDot color="var(--color-flux)" />}
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[9px] text-fog/40">{t.code}</span>
              {t.label}
              {t.id === "agreements" && agreements.length > 0 && (
                <span className="ml-1 rounded-full bg-flux/20 px-1.5 py-0.5 font-mono text-[9px] text-flux">
                  {agreements.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "details" && (
        <div className="step-in grid gap-4 md:grid-cols-2">
          <section className="glass corner relative rounded-xl p-5">
            <span className="cx pointer-events-none absolute inset-0" />
            <header className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
                Участники
              </h3>
              <span className="mono-label text-fog/45">{members.length}</span>
            </header>
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m!.id}
                  className="flex items-center gap-3 rounded-md border border-line/50 bg-hull/25 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flux/80 to-ion/80 font-mono text-[10px] font-bold text-void">
                    {m!.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-snow">{m!.name}</p>
                    <p className="truncate font-mono text-[10px] text-fog/60">{m!.role}</p>
                  </div>
                  <span className="truncate font-mono text-[10px] text-fog/50">{m!.email}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass corner relative rounded-xl p-5">
            <span className="cx pointer-events-none absolute inset-0" />
            <header className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
                Повестка
              </h3>
              <span className="mono-label text-fog/45">agenda</span>
            </header>
            <pre className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-mist">
              {meeting.agenda}
            </pre>
          </section>

          {meeting.status === "processing" && (
            <section className="glass corner relative overflow-hidden rounded-xl p-5 md:col-span-2">
              <span className="cx pointer-events-none absolute inset-0" />
              <div className="scanline" />
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-warn/50 bg-warn/10">
                  <span className="pulse-glow h-3 w-3 rounded-full bg-warn" />
                </span>
                <div>
                  <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-warn">
                    Этап 12 · Расшифровка
                  </p>
                  <p className="mt-1 text-[12.5px] text-fog/80">
                    MyCOO получил аудиозапись встречи. Идёт создание transcript и AI-саммари.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "transcript" && meeting.transcript && (
        <section className="step-in glass corner relative rounded-xl p-5 md:p-6">
          <span className="cx pointer-events-none absolute inset-0" />
          <header className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="mono-label text-flux">этап 12</span>
                <span className="h-px w-8 bg-line" />
                <span className="mono-label text-fog/70">transcript</span>
              </div>
              <h3 className="mt-2 font-display text-[15px] font-bold text-snow">
                Полный протокол встречи
              </h3>
            </div>
            <span className="mono-label text-fog/45">{meeting.transcript.length} реплик</span>
          </header>

          <div className="relative space-y-1 pl-6">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-line/40" />
            {meeting.transcript.map((entry, i) => {
              const member = teamMembers.find((m) => m.id === entry.speakerId);
              return (
                <div
                  key={i}
                  className="log-in relative flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-hull/30"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <span className="absolute left-[-17px] top-4 h-2 w-2 rounded-full bg-flux ring-2 ring-void" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flux/80 to-ion/80 font-mono text-[9px] font-bold text-void">
                    {member?.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-snow">{member?.name}</span>
                      <span className="font-mono text-[9.5px] text-fog/50">{entry.time}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-mist">{entry.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "transcript" && !meeting.transcript && (
        <section className="step-in glass corner relative rounded-xl p-10 text-center">
          <span className="cx pointer-events-none absolute inset-0" />
          <p className="text-[13px] text-fog/70">
            Transcript пока не создан — встреча ещё не завершена.
          </p>
        </section>
      )}

      {tab === "summary" && meeting.summary && (
        <div className="step-in space-y-4">
          <div className="glass corner relative rounded-xl p-5">
            <span className="cx pointer-events-none absolute inset-0" />
            <div className="flex items-center gap-2">
              <LuSparkles className="h-4 w-4 text-ion" />
              <span className="mono-label text-ion">этап 13</span>
              <span className="h-px flex-1 bg-line/40" />
              <span className="mono-label text-fog/45">mycoo ai summary</span>
            </div>
            <h3 className="mt-2 font-display text-[15px] font-bold text-snow">
              📄 Итоги встречи
            </h3>
          </div>

          <SummaryBlock
            icon={LuFileText}
            title="Главные обсуждения"
            tone="flux"
            items={meeting.summary.discussions.items}
            delay={0.05}
          />
          <SummaryBlock
            icon={LuCheckCheck}
            title="Принятые решения"
            tone="ok"
            items={meeting.summary.decisions.items}
            delay={0.1}
          />
          <SummaryBlock
            icon={LuBadgeAlert}
            title="Проблемы"
            tone="warn"
            items={meeting.summary.problems.items}
            delay={0.15}
          />
          <SummaryBlock
            icon={LuArrowRight}
            title="Следующие шаги"
            tone="ion"
            items={meeting.summary.nextSteps.items}
            delay={0.2}
          />
        </div>
      )}

      {tab === "summary" && !meeting.summary && (
        <section className="step-in glass corner relative rounded-xl p-10 text-center">
          <span className="cx pointer-events-none absolute inset-0" />
          <p className="text-[13px] text-fog/70">
            AI-саммари ещё формируется — скоро появится.
          </p>
        </section>
      )}

      {tab === "agreements" && (
        <section className="step-in glass corner relative rounded-xl p-5 md:p-6">
          <span className="cx pointer-events-none absolute inset-0" />
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="mono-label text-flux">этап 14</span>
                <span className="h-px w-8 bg-line" />
                <span className="mono-label text-fog/70">auto tasks</span>
              </div>
              <h3 className="mt-2 font-display text-[15px] font-bold text-snow">
                Автоматическое создание договорённостей
              </h3>
              <p className="mt-1 text-[12.5px] text-fog/70">
                MyCOO распознал {agreements.length} договорённостей из разговора и готов
                превратить их в задачи канбана.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono-label text-fog/45">{createdCount} создано</span>
              <span className="h-px w-4 bg-line" />
              <span className="mono-label text-flux">{pendingCount} ожидает</span>
            </div>
          </header>

          <div className="space-y-3">
            {agreements.map((ag, i) => {
              const assignee = teamMembers.find((m) => m.id === ag.assigneeId);
              const isDone = ag.status === "created";
              return (
                <div
                  key={ag.id}
                  className={`log-in rounded-lg border p-4 transition-all ${
                    isDone
                      ? "border-ok/30 bg-ok/5"
                      : "border-line/60 bg-hull/25 hover:border-line"
                  }`}
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isDone ? "border-ok/40 bg-ok/20" : "border-flux/40 bg-flux/10"
                      }`}
                    >
                      {isDone ? (
                        <LuCheck className="h-3.5 w-3.5 text-ok" />
                      ) : (
                        <span className="font-mono text-[9px] font-bold text-flux">{i + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono-label text-fog/50">Договорённость №{i + 1}</span>
                        {isDone && (
                          <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ok">
                            создана задача
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-[14px] font-semibold text-snow">{ag.title}</h4>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-fog/80">
                        <span className="flex items-center gap-1.5">
                          <LuUsers className="h-3 w-3 text-flux" />
                          <span className="text-mist">{assignee?.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <LuClock className="h-3 w-3 text-warn" />
                          <span>до {formatDeadline(ag.deadline)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <LuTarget className="h-3 w-3 text-ok" />
                          <span className="max-w-md truncate">{ag.criteria}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-ion/25 bg-ion/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <LuListChecks className="h-5 w-5 text-ion" />
              <div>
                <p className="text-[13px] font-semibold text-snow">
                  {bulkStatus === "done"
                    ? "Задачи успешно созданы"
                    : "Создать задачи?"}
                </p>
                <p className="mono-label text-[10px] text-fog/60">
                  {bulkStatus === "done"
                    ? "все договорённости превращены в задачи канбана"
                    : "подтверждение превратит все договорённости в задачи"}
                </p>
              </div>
            </div>
            {bulkStatus === "idle" ? (
              <button
                onClick={handleCreateAll}
                className="btn-primary flex items-center justify-center gap-2 rounded-md bg-flux px-5 py-2.5 text-[12.5px] font-bold text-void shadow-[0_0_22px_-6px_rgba(56,189,248,0.7)] transition-all hover:bg-ice"
              >
                <LuCheckCheck className="h-4 w-4" />
                Создать все
              </button>
            ) : (
              <span className="flex items-center gap-2 font-mono text-[11px] text-ok">
                <StatusDot color="var(--color-ok)" />
                {agreements.length} задач в канбане
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryBlock({
  icon: Icon,
  title,
  tone,
  items,
  delay,
}: {
  icon: typeof LuFileText;
  title: string;
  tone: "flux" | "ok" | "warn" | "ion";
  items: string[];
  delay: number;
}) {
  const colorMap: Record<string, string> = {
    flux: "text-flux",
    ok: "text-ok",
    warn: "text-warn",
    ion: "text-ion",
  };
  return (
    <section
      className="step-in glass corner relative rounded-xl p-5"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="cx pointer-events-none absolute inset-0" />
      <header className="mb-4 flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-line/60 bg-hull/40 ${colorMap[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
          {title}
        </h4>
        <span className="ml-auto mono-label text-fog/45">{items.length}</span>
      </header>
      <ol className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="log-in flex gap-3 rounded-md border border-line/50 bg-hull/25 px-3.5 py-2.5"
            style={{ animationDelay: `${delay + 0.05 + i * 0.04}s` }}
          >
            <span className={`mt-0.5 shrink-0 font-mono text-[11px] font-bold ${colorMap[tone]}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[13px] leading-relaxed text-mist">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}