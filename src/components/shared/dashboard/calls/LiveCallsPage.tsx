import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuCalendar, LuPlus, LuVideo } from "react-icons/lu";
import { meetingsApi, type MeetingList } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import { workspaceApi } from "@/api/workspace.api";
import { useLaunchStore } from "@/store/launch.store";
import { useAuthStore } from "@/store/auth.store";
import type { MeetingPerson, MeetingStatus } from "@/types/meetings.types";
import NewMeetingModal from "./NewMeetingModal";
import MeetingCard from "./MeetingCard";
import LiveMeetingSession from "./LiveMeetingSession";

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
  const [editor, setEditor] = useState(false);
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
        m.title.toLowerCase().includes(query.toLowerCase()),
    ) || [];
  return (
    <div className="meeting-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-fog">
            Управленческие встречи
          </p>
          <h1 className="font-display text-3xl font-bold text-snow">Встречи</h1>
          <p className="mt-2 text-sm text-fog">
            Повестка, разговор, решения и поручения — в одном месте.
          </p>
        </div>
        {data?.departments.some((d) => d.canManage) && (
          <button
            className="meeting-button primary"
            onClick={() => setEditor(true)}
          >
            <LuPlus /> Создать встречу
          </button>
        )}
      </div>
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
      <div className="my-6 flex flex-wrap gap-2">
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
          </button>
        ))}
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          className="meeting-select"
          aria-label="Поиск встреч"
          placeholder="Поиск по названию"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="meeting-select"
          aria-label="Департамент"
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
          <h2>Встреч пока нет</h2>
          <p>Запланируйте первую встречу или измените фильтры.</p>
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
          currentPersonId={userId}
          people={people}
          departments={data.departments.filter((d) => d.canManage)}
          onClose={() => setEditor(false)}
          onSubmit={async (draft) => {
            const m = await meetingsApi.save(workspaceId, draft);
            setEditor(false);
            void load();
            select(m.id);
          }}
        />
      )}
    </div>
  );
}
