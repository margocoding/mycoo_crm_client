import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowLeft,
  LuCalendar,
  LuClock,
  LuCopy,
  LuFileText,
  LuHand,
  LuLink,
  LuPencil,
  LuUsers,
  LuVideo,
  LuX,
} from "react-icons/lu";
import { meetingsApi } from "@/api/meetings.api";
import { ApiError, errorMessage } from "@/api/base.api";
import type { LiveMeeting, MeetingPerson } from "@/types/meetings.types";
import { MEETING_ROLES } from "@/types/meetings.types";
import {
  MeetingBadge,
  formatMeetingDate,
  formatMeetingTime,
  Avatar,
  MeetingDialog,
} from "./MeetingUI";
import NewMeetingModal from "./NewMeetingModal";
import MeetingProtocol from "./MeetingProtocol";
const LiveCall = lazy(() => import("./LiveCall"));

export default function LiveMeetingSession({
  workspaceId,
  userId,
  id,
  people,
  departments,
  onBack,
}: {
  workspaceId: string;
  userId: string;
  id: string;
  people: MeetingPerson[];
  departments: { id: string; name: string }[];
  onBack: () => void;
}) {
  const [meeting, setMeeting] = useState<LiveMeeting | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<"cancel" | "end" | null>(
    null,
  );
  const [suggestion, setSuggestion] = useState<{
    agenda: string;
    suggestion: string;
  } | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const m = await meetingsApi.get(workspaceId, id, signal);
        if (!signal?.aborted) {
          setMeeting(m);
          setError("");
          if (!["live", "scheduled"].includes(m.status)) setJoining(false);
        }
      } catch (e) {
        if (!signal?.aborted) {
          setError(errorMessage(e));
          if (e instanceof ApiError && [401, 403, 404].includes(e.status)) {
            setJoining(false);
            setMeeting(null);
          }
        }
      }
    },
    [workspaceId, id],
  );
  useEffect(() => {
    const c = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await load(c.signal);
      if (!c.signal.aborted) timer = setTimeout(poll, 5000);
    };
    void poll();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [load]);
  async function action(action: string, personId?: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setMeeting(await meetingsApi.action(workspaceId, id, action, personId));
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const act = (name: string, person?: string) =>
    void action(name, person).catch(() => {});
  const meetingUrl = new URL(window.location.href);
  meetingUrl.searchParams.set("workspace", workspaceId);
  const copyLink = () =>
    navigator.clipboard
      .writeText(meetingUrl.href)
      .then(() =>
        setNotice("Ссылка скопирована. Войти смогут приглашённые сотрудники."),
      )
      .catch(() => setNotice("Скопируйте ссылку из поля ниже."));
  if (joining && meeting?.status === "live")
    return (
      <Suspense
        fallback={<p className="p-6 text-fog">Подключаем видеосвязь…</p>}
      >
        <LiveCall
          workspaceId={workspaceId}
          meeting={meeting}
          userId={userId}
          action={action}
          onLeave={() => setJoining(false)}
        />
      </Suspense>
    );
  return (
    <div className="meeting-page space-y-6">
      <button className="meeting-back" onClick={onBack}>
        <LuArrowLeft /> Все встречи
      </button>
      {error && (
        <p role="alert" className="text-sm text-crit">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-flux">
          {notice}
        </p>
      )}
      {!meeting ? (
        <p className="text-fog">
          {error ? "Встреча недоступна." : "Загружаем встречу…"}
        </p>
      ) : (
        <>
          <section className="meeting-panel p-6 md:p-8">
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-sm text-flux">
                {meeting.departmentName}
              </span>
              <MeetingBadge status={meeting.status} />
            </div>
            <h1 className="mt-5 break-words font-display text-xl font-bold leading-relaxed text-snow md:text-3xl">
              {meeting.title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-5 text-sm text-fog">
              <span className="flex items-center gap-2">
                <LuCalendar />
                {formatMeetingDate(meeting.startsAt)},{" "}
                {formatMeetingTime(meeting.startsAt)}
              </span>
              <span className="flex items-center gap-2">
                <LuClock />
                {meeting.duration} минут
              </span>
            </div>
            <p className="mt-4 text-sm text-mist">
              Результат: {meeting.objective}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {meeting.status === "scheduled" && meeting.canModerate && (
                <button
                  disabled={busy || !meeting.callsAvailable}
                  className="meeting-button primary"
                  onClick={() =>
                    void action("start")
                      .then(() => setJoining(true))
                      .catch(() => {})
                  }
                >
                  <LuVideo /> Начать встречу
                </button>
              )}
              {meeting.status === "scheduled" && meeting.canHost && (
                <>
                  <button
                    className="meeting-button"
                    onClick={() => setEditing(true)}
                  >
                    <LuPencil /> Изменить
                  </button>
                  <button
                    disabled={busy}
                    className="meeting-button danger subtle"
                    onClick={() => setConfirmation("cancel")}
                  >
                    <LuX /> Отменить встречу
                  </button>
                </>
              )}
              {meeting.status === "live" && !joining && (
                <button
                  disabled={!meeting.callsAvailable}
                  className="meeting-button primary"
                  onClick={() => setJoining(true)}
                >
                  <LuVideo /> Войти во встречу
                </button>
              )}
              {meeting.status === "completed" && meeting.canHost && (
                <button
                  className="meeting-button"
                  onClick={() => setEditing(true)}
                >
                  Следующая встреча
                </button>
              )}
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <section className="meeting-panel p-6">
              <h2 className="meeting-section-heading">
                <LuFileText className="text-flux" /> Повестка встречи
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-mist">
                {meeting.agenda || "Повестка не добавлена."}
              </p>
              {meeting.status === "scheduled" && meeting.canHost && (
                <button
                  disabled={busy}
                  className="meeting-button mt-4"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      setSuggestion(await meetingsApi.prepare(workspaceId, id));
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Готовим…" : "Подготовить повестку с AI"}
                </button>
              )}
              {suggestion && (
                <div className="mt-4 space-y-3">
                  <p className="whitespace-pre-wrap text-sm text-mist">
                    {suggestion.agenda}
                  </p>
                  <p className="text-sm text-warn">{suggestion.suggestion}</p>
                  <button
                    className="meeting-button"
                    onClick={() => setEditing(true)}
                  >
                    Перенести в форму встречи
                  </button>
                </div>
              )}
              {meeting.previousId && (
                <Link
                  className="mt-4 block text-sm text-flux"
                  to={
                    "?meeting=" +
                    meeting.previousId +
                    "&workspace=" +
                    workspaceId
                  }
                >
                  Результаты предыдущей встречи →
                </Link>
              )}
            </section>
            <section className="meeting-panel p-6">
              <h2 className="meeting-section-heading">
                <LuUsers className="text-flux" /> Участники{" "}
                <span className="ml-auto text-xs font-normal text-fog">
                  {meeting.participants.filter((p) => !p.removed).length}
                </span>
              </h2>
              <div className="mt-5 space-y-4">
                {meeting.participants
                  .filter((p) => !p.removed)
                  .map((p) => (
                    <div
                      key={p.personId}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={p.name} />
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-snow">
                            {p.name}
                            {p.personId === userId ? " (вы)" : ""}
                          </p>
                          <p className="mt-1 text-xs text-fog">
                            {MEETING_ROLES[p.role]}
                          </p>
                        </div>
                        {p.raisedHand && <LuHand className="text-warn" />}
                      </div>
                      {meeting.status === "live" &&
                        meeting.canModerate &&
                        p.personId !== userId &&
                        p.personId !== meeting.organizerId &&
                        (meeting.canHost || p.role === "participant") && (
                          <div className="flex flex-wrap gap-2">
                            {p.requestedAt && !p.admitted && (
                              <button
                                disabled={busy}
                                className="meeting-button compact"
                                onClick={() => act("admit", p.personId)}
                              >
                                Допустить
                              </button>
                            )}
                            <button
                              disabled={busy}
                              className="meeting-button compact"
                              onClick={() => act("mute", p.personId)}
                            >
                              Выключить микрофон
                            </button>
                            {meeting.canHost && (
                              <button
                                disabled={busy}
                                className="meeting-button compact"
                                onClick={() =>
                                  act(
                                    p.role === "cohost"
                                      ? "participant"
                                      : "cohost",
                                    p.personId,
                                  )
                                }
                              >
                                {p.role === "cohost"
                                  ? "Снять соорганизатора"
                                  : "Соорганизатор"}
                              </button>
                            )}
                            <button
                              disabled={busy}
                              className="meeting-button compact danger"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Удалить участника из встречи?",
                                  )
                                )
                                  act("remove", p.personId);
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
              </div>
              <div className="mt-7 border-t border-line pt-6">
                <label className="meeting-field">
                  <span className="flex items-center gap-2">
                    <LuLink /> Ссылка на встречу
                  </span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={meetingUrl.href}
                      className="min-w-0 flex-1"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className="meeting-button"
                      aria-label="Скопировать ссылку"
                      onClick={() => void copyLink()}
                    >
                      <LuCopy />
                    </button>
                  </div>
                </label>
                <p className="mt-3 text-xs leading-5 text-fog">
                  Войти смогут сотрудники, приглашённые на встречу.
                </p>
              </div>
            </section>
          </div>
          {meeting.status === "live" && meeting.canHost && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                className="meeting-button"
                onClick={() => act(meeting.locked ? "unlock" : "lock")}
              >
                {meeting.locked ? "Открыть вход" : "Закрыть вход"}
              </button>
              <button
                disabled={busy}
                className="meeting-button danger"
                onClick={() => setConfirmation("end")}
              >
                Завершить для всех
              </button>
            </div>
          )}
          <MeetingProtocol
            key={meeting.id}
            workspaceId={workspaceId}
            meeting={meeting}
            onUpdate={setMeeting}
          />
          {confirmation && (
            <MeetingDialog
              title={
                confirmation === "cancel"
                  ? "Отменить встречу?"
                  : "Завершить встречу для всех?"
              }
              onClose={() => {
                if (!busy) setConfirmation(null);
              }}
            >
              <p className="text-sm leading-6 text-fog">
                {confirmation === "cancel"
                  ? "Встреча останется в списке со статусом «Отменена»."
                  : "Все участники будут отключены. Запись, если она включена, будет остановлена."}
              </p>
              {error && (
                <p role="alert" className="mt-3 text-sm text-crit">
                  {error}
                </p>
              )}
              <div className="meeting-dialog-actions">
                <button
                  disabled={busy}
                  className="meeting-button"
                  onClick={() => setConfirmation(null)}
                >
                  Вернуться
                </button>
                <button
                  disabled={busy}
                  className="meeting-button danger"
                  onClick={() =>
                    void action(confirmation)
                      .then(() => setConfirmation(null))
                      .catch(() => {})
                  }
                >
                  {confirmation === "cancel"
                    ? "Отменить встречу"
                    : "Завершить для всех"}
                </button>
              </div>
            </MeetingDialog>
          )}
          {editing && (
            <NewMeetingModal
              live
              meeting={
                meeting.status === "scheduled"
                  ? { ...meeting, agenda: suggestion?.agenda ?? meeting.agenda }
                  : undefined
              }
              initial={{
                title: meeting.title,
                departmentId: meeting.departmentId,
                kind: meeting.kind,
                objective: meeting.objective,
                agenda:
                  "Проверить решения и задачи предыдущей встречи.\n" +
                  (meeting.analysis?.openQuestions.join("\n") || ""),
              }}
              currentPersonId={
                meeting.status === "scheduled" ? meeting.organizerId : userId
              }
              people={people}
              departments={
                meeting.status === "completed"
                  ? departments.filter((d) => d.id === meeting.departmentId)
                  : departments
              }
              onClose={() => setEditing(false)}
              onSubmit={async (draft) => {
                if (meeting.status === "scheduled")
                  setMeeting(
                    await meetingsApi.save(
                      workspaceId,
                      { ...draft, previousId: meeting.previousId || undefined },
                      id,
                    ),
                  );
                else {
                  const created = await meetingsApi.save(workspaceId, {
                    ...draft,
                    previousId: meeting.id,
                  });
                  window.location.assign(
                    "/dashboard/calls?meeting=" +
                      created.id +
                      "&workspace=" +
                      workspaceId,
                  );
                }
                setEditing(false);
                setSuggestion(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
