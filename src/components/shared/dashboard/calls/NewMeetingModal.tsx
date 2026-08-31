import { useState } from "react";
import { LuCalendar, LuClock, LuFileText, LuMail, LuUsers, LuPlus, LuX } from "react-icons/lu";
import { Modal } from "../../../ui/Modal";
import { teamMembers } from "../../../../data/meetings/mockData";
import { StatusChip } from "../../../ui/Ambient";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    date: string;
    time: string;
    participants: string[];
    emails: string[];
    duration: number;
    platform: "zoom" | "meet" | "yandex";
    agenda: string;
  }) => void;
}

const platforms = [
  { id: "zoom" as const, label: "Zoom" },
  { id: "meet" as const, label: "Google Meet" },
  { id: "yandex" as const, label: "Яндекс Телемост" },
];

const durations = [30, 45, 60, 90, 120];

export default function NewMeetingModal({ isOpen, onClose, onSubmit }: NewMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [participants, setParticipants] = useState<string[]>([]);
  const [extraEmails, setExtraEmails] = useState("");
  const [duration, setDuration] = useState(60);
  const [platform, setPlatform] = useState<"zoom" | "meet" | "yandex">("zoom");
  const [agenda, setAgenda] = useState("");

  const toggleParticipant = (id: string) => {
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const canSubmit = title.trim() && participants.length > 0 && agenda.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const emails = [
      ...participants.map((id) => teamMembers.find((m) => m.id === id)?.email || ""),
      ...extraEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    ];
    onSubmit({ title, date, time, participants, emails, duration, platform, agenda });
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("10:00");
    setParticipants([]);
    setExtraEmails("");
    setDuration(60);
    setPlatform("zoom");
    setAgenda("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          MYCOO <span className="text-fog/60">/</span>{" "}
          <span className="text-flux">NEW MEETING</span>
        </>
      }
      subtitle={<>этап 10 · создание встречи</>}
      statusChip={{ tone: "flux", text: "invite" }}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <div>
          <label className="mono-label mb-2 block text-fog/60">название встречи</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Планёрка по операциям"
            className="w-full rounded-lg border border-line/60 bg-hull/40 px-4 py-3 text-[14px] text-snow placeholder-fog/40 outline-none transition-colors focus:border-flux/50"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
              <LuCalendar className="h-3 w-3" />
              дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-line/60 bg-hull/40 px-3 py-2.5 text-[13px] text-snow outline-none transition-colors focus:border-flux/50"
            />
          </div>
          <div>
            <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
              <LuClock className="h-3 w-3" />
              время
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-line/60 bg-hull/40 px-3 py-2.5 text-[13px] text-snow outline-none transition-colors focus:border-flux/50"
            />
          </div>
          <div>
            <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
              <LuClock className="h-3 w-3" />
              длительность
            </label>
            <div className="flex flex-wrap gap-1.5">
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`rounded-md border px-2.5 py-1.5 font-mono text-[10px] transition-all ${
                    duration === d
                      ? "border-flux/50 bg-flux/10 text-flux"
                      : "border-line/50 bg-hull/30 text-fog/60 hover:border-line/80"
                  }`}
                >
                  {d}м
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
            <LuUsers className="h-3 w-3" />
            участники из команды
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {teamMembers.map((m) => {
              const selected = participants.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    selected
                      ? "border-flux/50 bg-flux/10"
                      : "border-line/50 bg-hull/30 hover:border-line/80"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                      selected
                        ? "bg-gradient-to-br from-flux to-ion text-void"
                        : "bg-hull text-fog/70"
                    }`}
                  >
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12.5px] font-medium ${selected ? "text-snow" : "text-mist"}`}>
                      {m.name}
                    </p>
                    <p className="truncate font-mono text-[9.5px] text-fog/60">{m.role}</p>
                  </div>
                  {selected && <LuPlus className="h-3.5 w-3.5 shrink-0 text-flux" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
            <LuMail className="h-3 w-3" />
            дополнительные email (через запятую)
          </label>
          <input
            type="text"
            value={extraEmails}
            onChange={(e) => setExtraEmails(e.target.value)}
            placeholder="guest@example.com, partner@company.com"
            className="w-full rounded-lg border border-line/60 bg-hull/40 px-4 py-2.5 text-[13px] text-snow placeholder-fog/40 outline-none transition-colors focus:border-flux/50"
          />
        </div>

        <div>
          <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
            платформа
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`rounded-md border px-3 py-2 font-mono text-[11px] transition-all ${
                  platform === p.id
                    ? "border-flux/50 bg-flux/10 text-flux"
                    : "border-line/50 bg-hull/30 text-fog/60 hover:border-line/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mono-label mb-2 flex items-center gap-1.5 text-fog/60">
            <LuFileText className="h-3 w-3" />
            повестка
          </label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={4}
            placeholder="1. Первая тема обсуждения&#10;2. Вторая тема&#10;3. ..."
            className="w-full resize-none rounded-lg border border-line/60 bg-hull/40 px-4 py-3 text-[13px] text-snow placeholder-fog/40 outline-none transition-colors focus:border-flux/50"
          />
        </div>

        <div className="rounded-lg border border-ion/20 bg-ion/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusChip tone="ion">mycoo ai</StatusChip>
            <span className="text-[12px] text-fog/80">
              После завершения встречи MyCOO автоматически создаст transcript, саммари и предложит договорённости для превращения в задачи.
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-md border border-line/60 px-5 py-2.5 text-[12.5px] font-semibold text-fog transition-all hover:border-line hover:text-snow"
        >
          <LuX className="h-3.5 w-3.5" />
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[12.5px] font-bold transition-all ${
            canSubmit
              ? "bg-flux text-void shadow-[0_0_22px_-6px_rgba(56,189,248,0.7)] hover:bg-ice"
              : "cursor-not-allowed bg-hull/40 text-fog/40"
          }`}
        >
          Сформировать приглашение
        </button>
      </div>
    </Modal>
  );
}