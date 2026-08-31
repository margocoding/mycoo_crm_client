import { useMemo, useState } from "react";
import { LuPlus, LuSearch, LuCalendar } from "react-icons/lu";
import { Meeting, meetings as initialMeetings } from "../data/meetings/mockData";
import MeetingDetail from "../components/shared/dashboard/calls/MeetingDetail";
import { StatusDot } from "../components/ui/Ambient";
import MeetingCard from "../components/shared/dashboard/calls/MeetingCard";
import NewMeetingModal from "../components/shared/dashboard/calls/NewMeetingModal";

type Filter = "all" | "upcoming" | "completed" | "processing";

export default function CallsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const activeMeeting = activeId ? meetings.find((m) => m.id === activeId) : null;

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (query && !m.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [meetings, filter, query]);

  const stats = useMemo(() => {
    return {
      total: meetings.length,
      upcoming: meetings.filter((m) => m.status === "upcoming").length,
      completed: meetings.filter((m) => m.status === "completed").length,
      processing: meetings.filter((m) => m.status === "processing").length,
    };
  }, [meetings]);

  const handleNewMeeting = (data: {
    title: string;
    date: string;
    time: string;
    participants: string[];
    emails: string[];
    duration: number;
    platform: "zoom" | "meet" | "yandex";
    agenda: string;
  }) => {
    const newMeeting: Meeting = {
      id: `m${Date.now()}`,
      title: data.title,
      date: data.date,
      time: data.time,
      duration: data.duration,
      participants: data.participants,
      emails: data.emails,
      agenda: data.agenda,
      status: "upcoming",
      platform: data.platform,
      hasRecording: false,
    };
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  if (activeMeeting) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)]">
        <MeetingDetail meeting={activeMeeting} onBack={() => setActiveId(null)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.08), transparent 65%)",
        }}
      />

      <section className="step-in glass corner relative overflow-hidden rounded-xl p-6 md:p-7">
        <span className="cx pointer-events-none absolute inset-0" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono-label text-flux">этап 10–14</span>
              <span className="h-px w-8 bg-line" />
              <span className="mono-label text-fog/70">meetings · ai</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-snow md:text-3xl">
              📅 Встречи
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-fog/80">
              От планирования до задач в канбане. MyCOO проводит встречу,
              расшифровывает запись, формирует саммари и извлекает договорённости.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="btn-primary flex items-center gap-2 rounded-md bg-flux px-5 py-3 text-[13px] font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] transition-all hover:bg-ice"
          >
            <LuPlus className="h-4 w-4" />
            Создать встречу
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox value={stats.total} label="всего встреч" tone="mist" />
          <StatBox value={stats.upcoming} label="предстоящих" tone="flux" />
          <StatBox value={stats.processing} label="в обработке AI" tone="warn" pulse />
          <StatBox value={stats.completed} label="завершено" tone="ok" />
        </div>
      </section>

      <div className="step-in mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.08s" }}>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line/60 bg-hull/40 px-3 py-2.5 min-w-[200px]">
          <LuSearch className="h-4 w-4 text-fog/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию встречи"
            className="flex-1 bg-transparent text-[13px] text-snow placeholder-fog/40 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all" as const, label: "Все", count: stats.total },
            { id: "upcoming" as const, label: "Предстоят", count: stats.upcoming, tone: "flux" },
            { id: "processing" as const, label: "AI", count: stats.processing, tone: "warn" },
            { id: "completed" as const, label: "Завершены", count: stats.completed, tone: "ok" },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] transition-all ${
                  active
                    ? "border-flux/50 bg-flux/10 text-snow"
                    : "border-line/50 bg-hull/30 text-fog/70 hover:border-line/80"
                }`}
              >
                {active && <StatusDot color={f.tone ? `var(--color-${f.tone})` : "var(--color-mist)"} />}
                {f.label}
                <span className="text-fog/50">{f.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((m, i) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onClick={() => setActiveId(m.id)}
              delay={0.05 * i}
            />
          ))}
        </div>
      ) : (
        <section className="step-in mt-6 glass corner relative rounded-xl p-10 text-center">
          <span className="cx pointer-events-none absolute inset-0" />
          <LuCalendar className="mx-auto h-8 w-8 text-fog/40" />
          <p className="mt-3 font-display text-[14px] font-semibold text-mist">
            Встречи не найдены
          </p>
          <p className="mt-1 text-[12.5px] text-fog/70">
            Попробуйте изменить фильтр или создайте новую встречу.
          </p>
        </section>
      )}

      <NewMeetingModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onSubmit={handleNewMeeting}
      />
    </div>
  );
}

function StatBox({
  value,
  label,
  tone,
  pulse,
}: {
  value: number;
  label: string;
  tone: "mist" | "flux" | "warn" | "ok";
  pulse?: boolean;
}) {
  const colorVar = `var(--color-${tone})`;
  return (
    <div className="rounded-lg border border-line/50 bg-hull/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-display text-2xl font-bold" style={{ color: colorVar }}>
          {value}
        </span>
        {pulse && <StatusDot color={colorVar} />}
      </div>
      <p className="mono-label mt-1 text-[10px] text-fog/60">{label}</p>
    </div>
  );
}