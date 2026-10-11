import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LuArrowUpRight,
  LuCalendar,
  LuPlus,
  LuSearch,
  LuVideo,
} from "react-icons/lu";
import { meetingsApi, type MeetingList } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import { workspaceApi } from "@/api/workspace.api";
import { useLaunchStore } from "@/store/launch.store";
import { useAuthStore } from "@/store/auth.store";
import type { MeetingPerson, MeetingStatus } from "@/types/meetings.types";
import NewMeetingModal from "./NewMeetingModal";
import MeetingCard from "./MeetingCard";
import LiveMeetingSession from "./LiveMeetingSession";
import { Avatar, formatMeetingDate, formatMeetingTime } from "./MeetingUI";

export default function LiveCallsPage() {
  const workspace = useLaunchStore((s) => s.workspace);
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const requestedWorkspace = params.get("workspace");
  const [switchError, setSwitchError] = useState("");
  useEffect(() => {
    setSwitchError("");
    if (!requestedWorkspace || requestedWorkspace === workspace?.id) return;
    let active = true;
    workspaceApi
      .get(requestedWorkspace)
      .then((w) => {
        if (active) useLaunchStore.getState().setWorkspace(w);
      })
      .catch((e) => {
        if (active) setSwitchError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [requestedWorkspace, workspace?.id]);
  if (switchError)
    return (
      <p role="alert" className="p-6 text-crit">
        {switchError}
      </p>
    );
  if (
    !workspace ||
    !user ||
    (requestedWorkspace && requestedWorkspace !== workspace.id)
  )
    return <p className="p-6 text-fog">Загружаем компанию…</p>;
  return (
    <Calls
      key={workspace.id + user.id}
      workspaceId={workspace.id}
      userId={user.id}
      activeId={params.get("meeting")}
      select={(id) => {
        const next = new URLSearchParams(params);
        if (id) next.set("meeting", id);
        else next.delete("meeting");
        next.set("workspace", workspace.id);
        setParams(next);
      }}
    />
  );
}
function Calls({
  workspaceId,
  userId,
  activeId,
  select,
}: {
  workspaceId: string;
  userId: string;
  activeId: string | null;
  select: (id?: string) => void;
}) {
  const [data, setData] = useState<MeetingList | null>(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<"planned" | "quick" | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MeetingStatus>("all");
  const [department, setDepartment] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await meetingsApi.list(workspaceId, signal);
        if (!signal?.aborted) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (!signal?.aborted) setError(errorMessage(e));
      }
    },
    [workspaceId],
  );
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await load(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 15000);
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [load]);
  const people: MeetingPerson[] =
    data?.members.flatMap((p) =>
      p.isOwner
        ? [
            {
              id: p.id,
              name: p.name,
              position: "Собственник",
              departmentId: "*",
            },
          ]
        : p.departments.map((d) => ({
            id: p.id,
            name: p.name,
            position: d.name,
            departmentId: d.id,
          })),
    ) || [];
  if (activeId)
    return (
      <LiveMeetingSession
        key={activeId}
        workspaceId={workspaceId}
        userId={userId}
        id={activeId}
        people={people}
        departments={data?.departments.filter((d) => d.canManage) || []}
        onBack={() => {
          select();
          void load();
        }}
      />
    );
  const filtered =
    data?.meetings.filter(
      (m) =>
        (status === "all" || m.status === status) &&
        (!department || m.departmentId === department) &&
        m.title.toLowerCase().includes(query.trim().toLowerCase()),
    ) || [];
  const upcoming =
    data?.meetings
      .filter((m) => m.status === "scheduled" || m.status === "live")
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ) || [];
  const nextMeeting = upcoming.find((m) => m.status === "live") || upcoming[0];
  return (
    <div className="meeting-page">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-fog">
            Командная работа
          </p>
          <h1 className="font-display text-3xl font-bold text-snow">Встречи</h1>
          <p className="mt-3 text-sm text-fog">
            Соберите команду. Обсудите главное. Договоритесь о следующем шаге.
          </p>
        </div>
        {data?.departments.some((d) => d.canManage) && (
          <div className="flex flex-wrap gap-3">
            <button
              className="meeting-button"
              disabled={!data.callsAvailable}
              onClick={() => setEditor("quick")}
            >
              <LuVideo /> Быстрый звонок
            </button>
            <button
              className="meeting-button primary"
              onClick={() => setEditor("planned")}
            >
              <LuPlus /> Создать встречу
            </button>
          </div>
        )}
      </header>
      {error && (
        <p role="alert" className="mt-4 text-crit">
          {error} <button onClick={() => void load()}>Повторить</button>
        </p>
      )}
      {data && !data.callsAvailable && (
        <p className="mt-4 text-sm text-warn">
          Планирование доступно. Подключение видеосвязи ожидает настройки
          сервера.
        </p>
      )}
      {nextMeeting && (
        <section className="meeting-next">
          <div className="min-w-0">
            <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-flux">
              <span className="h-1.5 w-1.5 rounded-full bg-flux" />
              {nextMeeting.status === "live"
                ? "Можно вернуться"
                : "Ближайшая встреча"}
            </span>
            <h2 className="break-words font-display text-xl font-semibold leading-relaxed text-snow md:text-2xl">
              {nextMeeting.title}
            </h2>
            <p className="mt-3 text-sm text-fog">
              {nextMeeting.departmentName ||
                data?.departments.find((d) => d.id === nextMeeting.departmentId)
                  ?.name}{" "}
              · {nextMeeting.duration} минут
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="meeting-avatar-stack flex">
                {nextMeeting.participants.slice(0, 4).map((p) => (
                  <Avatar
                    key={p.personId}
                    name={
                      people.find((person) => person.id === p.personId)?.name ||
                      "Участник"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-fog">
                Участников: {nextMeeting.participants.length}
              </span>
            </div>
          </div>
          <div className="meeting-next-time">
            <p className="font-mono text-sm text-fog">
              {formatMeetingDate(nextMeeting.startsAt)}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-snow">
              {formatMeetingTime(nextMeeting.startsAt)}
            </p>
            <button
              className="meeting-button primary mt-6"
              onClick={() => select(nextMeeting.id)}
            >
              Открыть встречу <LuArrowUpRight />
            </button>
          </div>
        </section>
      )}
      <div className="my-7 flex flex-wrap gap-1" aria-label="Фильтр встреч">
        {[
          ["all", "Все"],
          ["scheduled", "Предстоящие"],
          ["live", "В эфире"],
          ["completed", "Завершённые"],
          ["cancelled", "Отменённые"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={"meeting-tab " + (status === id ? "active" : "")}
            aria-pressed={status === id}
            onClick={() => setStatus(id as typeof status)}
          >
            {label}
            <span>
              {id === "all"
                ? data?.meetings.length || 0
                : data?.meetings.filter((m) => m.status === id).length || 0}
            </span>
          </button>
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
        <label className="meeting-search">
          <LuSearch />
          <input
            aria-label="Поиск встреч"
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className="meeting-select"
          aria-label="Фильтр по департаменту"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Все департаменты</option>
          {data?.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      {!data && !error ? (
        <p className="text-fog">Загружаем встречи…</p>
      ) : filtered.length ? (
        <div className="meeting-panel overflow-hidden">
          {filtered.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              people={people}
              onClick={() => select(m.id)}
            />
          ))}
        </div>
      ) : (
        <div className="meeting-empty">
          <LuCalendar />
          <h2>
            {data?.meetings.length ? "Встреч не найдено" : "Встреч пока нет"}
          </h2>
          <p>Запланируйте первую встречу или измените фильтры.</p>
          {(query || department || status !== "all") && (
            <button
              className="meeting-button"
              onClick={() => {
                setQuery("");
                setDepartment("");
                setStatus("all");
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
      <p className="mt-5 text-xs text-fog">
        <LuVideo className="mr-2 inline" />
        Время: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Доступ к
        встречам определяется приглашениями и правами компании.
      </p>
      {editor && data && (
        <NewMeetingModal
          live
          quick={editor === "quick"}
          initial={
            editor === "quick"
              ? {
                  title: "Быстрая встреча",
                  departmentId: data.departments.find(
                    (d) => d.id === department && d.canManage,
                  )?.id,
                }
              : undefined
          }
          currentPersonId={userId}
          people={people}
          departments={data.departments.filter((d) => d.canManage)}
          onClose={() => setEditor(null)}
          onSubmit={async (draft) => {
            const m = await meetingsApi.save(workspaceId, draft);
            setEditor(null);
            void load();
            select(m.id);
          }}
        />
      )}
    </div>
  );
}
