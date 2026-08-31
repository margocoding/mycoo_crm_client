import { LuCalendar, LuClock, LuUsers, LuVideo } from "react-icons/lu";
import { StatusChip, StatusDot } from "../../../ui/Ambient";
import { Meeting, teamMembers } from "../../../../data/meetings/mockData";

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  delay?: number;
}

const platformLabel: Record<Meeting["platform"], string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  yandex: "Яндекс Телемост",
};

const statusConfig = {
  upcoming: { tone: "flux" as const, label: "предстоит" },
  processing: { tone: "warn" as const, label: "обработка AI" },
  completed: { tone: "ok" as const, label: "завершена" },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${days[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
};

export default function MeetingCard({ meeting, onClick, delay = 0 }: MeetingCardProps) {
  const members = meeting.participants.map((id) => teamMembers.find((m) => m.id === id)).filter(Boolean);
  const status = statusConfig[meeting.status];

  return (
    <button
      onClick={onClick}
      className="step-in glass corner group/card relative w-full rounded-xl p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-flux/40"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="cx pointer-events-none absolute inset-0" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="mono-label text-fog/45">SYS·MEET</span>
            <span className="h-px flex-1 bg-line/40" />
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          </div>
          <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-snow group-hover/card:text-flux">
            {meeting.title}
          </h3>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <LuCalendar className="h-3.5 w-3.5 text-fog/60" />
          <span className="font-mono text-[11px] text-fog">{formatDate(meeting.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <LuClock className="h-3.5 w-3.5 text-fog/60" />
          <span className="font-mono text-[11px] text-fog">
            {meeting.time} · {meeting.duration} мин
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LuVideo className="h-3.5 w-3.5 text-fog/60" />
          <span className="font-mono text-[11px] text-fog">{platformLabel[meeting.platform]}</span>
        </div>
        <div className="flex items-center gap-2">
          <LuUsers className="h-3.5 w-3.5 text-fog/60" />
          <span className="font-mono text-[11px] text-fog">{members.length} участника</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line/40 pt-3">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <div
              key={m!.id}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-void bg-gradient-to-br from-flux/80 to-ion/80 font-mono text-[9px] font-bold text-void ring-1 ring-hull"
              title={m!.name}
            >
              {m!.avatar}
            </div>
          ))}
          {members.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-void bg-hull font-mono text-[9px] text-fog ring-1 ring-hull">
              +{members.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fog/60">
          {meeting.status === "processing" && (
            <>
              <StatusDot color="var(--color-warn)" />
              <span className="font-mono">AI создаёт саммари</span>
            </>
          )}
          {meeting.status === "completed" && meeting.agreements && (
            <>
              <span className="font-mono">
                {meeting.agreements.length} договорённостей
              </span>
            </>
          )}
          {meeting.status === "upcoming" && (
            <span className="font-mono text-flux/70">открыть →</span>
          )}
        </div>
      </div>
    </button>
  );
}