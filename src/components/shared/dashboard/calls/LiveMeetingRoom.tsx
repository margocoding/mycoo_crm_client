import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  isTrackReference,
  useChat,
  useConnectionState,
  useLocalParticipant,
  useMediaDeviceSelect,
  useParticipants,
  useTrackMutedIndicator,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionState, Track, type Participant } from "livekit-client";
import {
  LuCheck,
  LuCircle,
  LuCopy,
  LuHand,
  LuLock,
  LuMaximize,
  LuMessageSquare,
  LuMic,
  LuMicOff,
  LuMonitor,
  LuPhoneOff,
  LuSend,
  LuSettings,
  LuShieldCheck,
  LuUsers,
  LuVideo,
  LuVideoOff,
  LuX,
} from "react-icons/lu";
import { errorMessage } from "@/api/base.api";
import {
  MEETING_ROLES,
  type LiveMeeting,
  type MeetingRole,
} from "@/types/meetings.types";
import { Avatar, MeetingDialog } from "./MeetingUI";

type Confirmation =
  { kind: "leave" | "record" } | { kind: "remove"; personId: string };
type Person = LiveMeeting["participants"][number];

export default function LiveMeetingRoom({
  meeting,
  userId,
  action,
  onLeave,
  connectionError,
}: {
  meeting: LiveMeeting;
  userId: string;
  action: (name: string, personId?: string) => Promise<void>;
  onLeave: () => void;
  connectionError: string;
}) {
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const connectionState = useConnectionState();
  const { chatMessages, send, isSending } = useChat();
  const [panel, setPanel] = useState<"people" | "chat" | "settings" | null>(
    "people",
  );
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const room = useRef<HTMLElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const app = document.getElementById("root");
    const wasInert = app?.inert;
    if (app) app.inert = true;
    room.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", preventLeave);
      if (app) app.inert = !!wasInert;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "end" });
  }, [chatMessages.length, panel]);

  async function run(task: () => Promise<unknown>, success?: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
      if (success) setNotice(success);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const control = (name: string, personId?: string) =>
    run(() => action(name, personId));
  const connected = connectionState === ConnectionState.Connected;
  const roster = meeting.participants.filter((p) => !p.removed);
  const waiting = roster.filter((p) => p.requestedAt && !p.admitted);
  const peopleInRoom = participants.map((p) => ({
    participant: p,
    person: roster.find((person) => person.personId === p.identity),
    name:
      roster.find((person) => person.personId === p.identity)?.name ||
      p.name ||
      "Участник",
  }));
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
  const screenTracks = tracks.filter(
    (t) =>
      t.source === Track.Source.ScreenShare &&
      isTrackReference(t) &&
      !t.publication.isMuted,
  );
  const pinned = cameraTracks.some((t) => t.participant.identity === spotlight)
    ? spotlight
    : null;
  const self = roster.find((p) => p.personId === userId);
  const recording = meeting.recordings.some((r) =>
    ["starting", "recording", "stopping"].includes(r.status),
  );
  const stopping = meeting.recordings.some((r) => r.status === "stopping");
  const elapsed = Math.max(
    0,
    Math.floor(
      (now - new Date(meeting.startedAt || meeting.startsAt).getTime()) / 1000,
    ),
  );
  const clock = [
    Math.floor(elapsed / 3600),
    Math.floor(elapsed / 60) % 60,
    elapsed % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  const canManage = (p: Person) =>
    meeting.canModerate &&
    p.personId !== userId &&
    p.role !== "host" &&
    (meeting.canHost || p.role === "participant");
  function management(p: Person, mic = false) {
    if (!canManage(p)) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2 pl-10">
        {mic && (
          <button
            disabled={busy}
            className="meeting-text-button"
            onClick={() => void control("mute", p.personId)}
          >
            Выключить звук
          </button>
        )}
        {meeting.canHost && (
          <button
            disabled={busy}
            className="meeting-text-button"
            onClick={() =>
              void control(
                p.role === "cohost" ? "participant" : "cohost",
                p.personId,
              )
            }
          >
            {p.role === "cohost"
              ? "Снять роль соорганизатора"
              : "Сделать соорганизатором"}
          </button>
        )}
        <button
          disabled={busy}
          className="meeting-text-button text-crit"
          aria-label={"Удалить: " + p.name}
          onClick={() => setConfirm({ kind: "remove", personId: p.personId })}
        >
          Удалить
        </button>
      </div>
    );
  }
  return (
    <>
      <section
        ref={room}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Комната встречи"
        className="meeting-room"
        onKeyDown={(event) => {
          if (confirm || event.key !== "Tab") return;
          const controls = Array.from(
            room.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',
            ) || [],
          ).filter((e) => e.getClientRects().length);
          const first = controls[0],
            last = controls[controls.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === room.current)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <RoomAudioRenderer />
        <header className="meeting-room-header">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
              <span
                className={connected ? "text-ok" : "text-warn"}
                role="status"
              >
                {connected
                  ? "● В эфире"
                  : connectionState === ConnectionState.Reconnecting ||
                      connectionState === ConnectionState.SignalReconnecting
                    ? "Восстанавливаем связь…"
                    : "Подключаемся…"}
              </span>
              <span className="font-mono text-fog">{clock}</span>
              {recording && (
                <span className="text-crit" role="status">
                  ● {stopping ? "Сохраняем запись" : "Идёт запись"}
                </span>
              )}
              {meeting.locked && (
                <span className="flex items-center gap-1 text-warn">
                  <LuLock /> Вход закрыт
                </span>
              )}
            </div>
            <h1 className="truncate text-lg font-semibold text-snow">
              {meeting.title}
            </h1>
            <p className="mt-1 text-xs text-fog">{meeting.departmentName}</p>
          </div>
          <button
            className="meeting-button shrink-0"
            aria-label="Скопировать ссылку на встречу"
            onClick={() =>
              void run(
                () => navigator.clipboard.writeText(window.location.href),
                "Ссылка скопирована. Войти смогут приглашённые сотрудники.",
              )
            }
          >
            <LuCopy />
            <span className="hidden sm:inline">Ссылка</span>
          </button>
        </header>
        <div className={"meeting-room-body " + (panel ? "has-panel" : "")}>
          <div className="meeting-stage">
            {screenTracks.map(
              (track) =>
                isTrackReference(track) && (
                  <div
                    className="meeting-shared-screen meeting-live-screen"
                    key={track.publication.trackSid}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-line p-4 text-xs text-fog">
                      <span className="flex min-w-0 items-center gap-2">
                        <LuMonitor />
                        <span className="truncate">
                          Демонстрация экрана ·{" "}
                          {track.participant.name ||
                            roster.find(
                              (p) => p.personId === track.participant.identity,
                            )?.name}
                        </span>
                      </span>
                      {track.participant.isLocal && (
                        <button
                          className="text-crit"
                          onClick={() =>
                            void run(() =>
                              localParticipant.setScreenShareEnabled(false),
                            )
                          }
                        >
                          Остановить
                        </button>
                      )}
                    </div>
                    <VideoTrack
                      trackRef={track}
                      className="meeting-screen-video"
                    />
                  </div>
                ),
            )}
            <div
              className={
                "meeting-video-grid " +
                (pinned ? "spotlight " : "") +
                (screenTracks.length ? "with-screen" : "")
              }
            >
              {cameraTracks
                .filter((t) => !pinned || t.participant.identity === pinned)
                .map((track) => {
                  const person = roster.find(
                    (p) => p.personId === track.participant.identity,
                  );
                  return (
                    <ParticipantTile
                      key={track.participant.identity}
                      track={track}
                      name={
                        person?.name || track.participant.name || "Участник"
                      }
                      role={person?.role || "participant"}
                      hand={person?.raisedHand || false}
                      pinned={!!pinned}
                      onPin={() =>
                        setSpotlight(pinned ? null : track.participant.identity)
                      }
                    />
                  );
                })}
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-3 px-1 text-xs text-fog">
              <span>Участников в комнате: {participants.length}</span>
              <span>
                {recording
                  ? "Аудио записывается для подготовки протокола"
                  : "Запись выключена"}
              </span>
            </div>
            <StartAudio
              label="Включить звук встречи"
              className="meeting-button mt-3"
            />
            {error || connectionError ? (
              <p role="alert" className="px-1 pt-3 text-sm text-crit">
                {error || connectionError}
              </p>
            ) : (
              <p role="status" className="min-h-6 px-1 pt-2 text-xs text-flux">
                {notice}
              </p>
            )}
          </div>
          {panel && (
            <aside className="meeting-room-panel">
              <div className="flex items-center justify-between border-b border-line p-4">
                <h2 className="font-semibold text-snow">
                  {panel === "people"
                    ? "Участники"
                    : panel === "chat"
                      ? "Чат встречи"
                      : "Настройки встречи"}
                </h2>
                <button
                  className="meeting-icon-button"
                  aria-label="Закрыть боковую панель"
                  onClick={() => setPanel(null)}
                >
                  <LuX />
                </button>
              </div>
              {panel === "people" && (
                <div className="meeting-panel-scroll">
                  {meeting.canModerate && waiting.length > 0 && (
                    <section className="mb-5 rounded-lg border border-warn/30 bg-warn/5 p-3">
                      <h3 className="mb-3 text-xs font-semibold text-warn">
                        В зале ожидания · {waiting.length}
                      </h3>
                      {waiting.map((p) => (
                        <div key={p.personId} className="mb-3 text-sm">
                          <p>{p.name}</p>
                          {canManage(p) && (
                            <div className="mt-2 flex gap-2">
                              <button
                                disabled={busy}
                                className="meeting-small-button"
                                onClick={() =>
                                  void control("admit", p.personId)
                                }
                              >
                                <LuCheck /> Допустить
                              </button>
                              <button
                                disabled={busy}
                                className="meeting-small-button"
                                onClick={() =>
                                  setConfirm({
                                    kind: "remove",
                                    personId: p.personId,
                                  })
                                }
                              >
                                Отклонить
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                  {meeting.canModerate && (
                    <button
                      disabled={busy || !connected}
                      className="meeting-small-button mb-4 w-full"
                      onClick={() =>
                        void run(async () => {
                          for (const { person } of peopleInRoom)
                            if (person && canManage(person))
                              await action("mute", person.personId);
                        }, "Микрофоны остальных участников выключены.")
                      }
                    >
                      <LuMicOff /> Выключить всем микрофоны
                    </button>
                  )}
                  <div className="space-y-4">
                    {peopleInRoom.map(({ participant, person, name }) => (
                      <div key={participant.identity}>
                        <div className="flex items-center gap-2">
                          <Avatar name={name} />
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-xs font-semibold text-snow">
                              {name}
                              {participant.isLocal ? " (вы)" : ""}
                            </p>
                            <p className="mt-1 text-[11px] text-fog">
                              {MEETING_ROLES[person?.role || "participant"]}
                            </p>
                          </div>
                          {person?.raisedHand && (
                            <LuHand className="text-warn" />
                          )}
                          <Microphone participant={participant} />
                        </div>
                        {person && management(person, true)}
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-fog">
                    Микрофон участник включает сам. Организатор управляет
                    ролями, соорганизатор помогает с участниками.
                  </p>
                </div>
              )}
              {panel === "chat" && (
                <>
                  <div className="meeting-panel-scroll space-y-4">
                    <p className="text-xs leading-5 text-fog">
                      Сообщения видны участникам в комнате. После выхода история
                      чата не сохраняется.
                    </p>
                    {!chatMessages.length && (
                      <div className="py-12 text-center text-fog">
                        <LuMessageSquare className="mx-auto mb-3 h-7 w-7" />
                        <p className="text-sm">Начните обсуждение</p>
                        <p className="mt-2 text-xs">
                          Или зафиксируйте важную мысль
                        </p>
                      </div>
                    )}
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border border-line bg-hull p-3"
                      >
                        <p className="flex justify-between gap-2 text-[10px] text-fog">
                          <span>
                            {roster.find(
                              (p) => p.personId === message.from?.identity,
                            )?.name ||
                              message.from?.name ||
                              "Участник"}
                          </span>
                          <time>
                            {new Date(message.timestamp).toLocaleTimeString(
                              "ru-RU",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </time>
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-mist">
                          {message.message}
                        </p>
                      </div>
                    ))}
                    <div ref={chatEnd} />
                  </div>
                  <form
                    className="flex gap-2 border-t border-line p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (draft.trim() && !isSending)
                        void run(async () => {
                          await send(draft.trim());
                          setDraft("");
                        });
                    }}
                  >
                    <input
                      aria-label="Сообщение в чат"
                      className="meeting-input min-w-0 flex-1"
                      placeholder="Сообщение…"
                      value={draft}
                      maxLength={2000}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="meeting-control"
                      disabled={
                        !draft.trim() || isSending || busy || !connected
                      }
                      aria-label="Отправить сообщение"
                    >
                      <LuSend />
                    </button>
                  </form>
                </>
              )}
              {panel === "settings" && (
                <div className="meeting-panel-scroll">
                  <div className="meeting-settings">
                    <label>
                      <input
                        type="checkbox"
                        checked={meeting.locked}
                        disabled={!meeting.canHost || busy}
                        onChange={() =>
                          void control(meeting.locked ? "unlock" : "lock")
                        }
                      />
                      Закрыть вход для новых участников
                    </label>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-fog">
                    {meeting.allowScreenShare
                      ? "Участники могут показывать экран."
                      : "Экран показывают только организатор и соорганизаторы."}{" "}
                    Разрешение задаётся при планировании встречи.
                  </p>
                  <div className="mt-6 space-y-4">
                    <DeviceSelect
                      kind="audioinput"
                      label="Микрофон"
                      onError={setError}
                    />
                    <DeviceSelect
                      kind="videoinput"
                      label="Камера"
                      onError={setError}
                    />
                  </div>
                  <div className="mt-8 rounded-lg border border-line p-4">
                    <LuShieldCheck className="mb-3 text-flux" />
                    <h3 className="text-sm text-snow">
                      {MEETING_ROLES[meeting.myRole]}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-fog">
                      Роли встречи отдельны от должностей в компании. Завершить
                      встречу для всех может только организатор.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
        <footer className="meeting-room-controls">
          <div className="flex flex-wrap justify-center gap-2">
            <Control
              caption="Микрофон"
              label={
                isMicrophoneEnabled ? "Выключить микрофон" : "Включить микрофон"
              }
              active={isMicrophoneEnabled}
              disabled={busy || !connected}
              onClick={() =>
                void run(() =>
                  localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
                )
              }
            >
              {isMicrophoneEnabled ? <LuMic /> : <LuMicOff />}
            </Control>
            <Control
              caption="Камера"
              label={isCameraEnabled ? "Выключить камеру" : "Включить камеру"}
              active={isCameraEnabled}
              disabled={busy || !connected}
              onClick={() =>
                void run(() =>
                  localParticipant.setCameraEnabled(!isCameraEnabled),
                )
              }
            >
              {isCameraEnabled ? <LuVideo /> : <LuVideoOff />}
            </Control>
            <Control
              caption="Экран"
              label={
                isScreenShareEnabled
                  ? "Остановить демонстрацию"
                  : "Показать экран"
              }
              active={isScreenShareEnabled}
              disabled={
                busy ||
                !connected ||
                (!meeting.canModerate && !meeting.allowScreenShare)
              }
              onClick={() =>
                void run(() =>
                  localParticipant.setScreenShareEnabled(!isScreenShareEnabled),
                )
              }
            >
              <LuMonitor />
            </Control>
            <Control
              caption="Рука"
              label={self?.raisedHand ? "Опустить руку" : "Поднять руку"}
              active={self?.raisedHand}
              disabled={busy || !connected}
              onClick={() => void control(self?.raisedHand ? "lower" : "raise")}
            >
              <LuHand />
            </Control>
            {meeting.canModerate && (
              <Control
                caption="Запись"
                label={recording ? "Остановить запись" : "Начать запись"}
                active={recording}
                disabled={busy || stopping || !connected}
                onClick={() =>
                  recording
                    ? void control("stop-record")
                    : setConfirm({ kind: "record" })
                }
              >
                <LuCircle
                  className={recording ? "fill-current text-crit" : ""}
                />
              </Control>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Control
              caption={"Участники · " + participants.length}
              label="Участники"
              active={panel === "people"}
              onClick={() => setPanel(panel === "people" ? null : "people")}
            >
              <LuUsers />
            </Control>
            <Control
              caption="Чат"
              label="Чат встречи"
              active={panel === "chat"}
              onClick={() => setPanel(panel === "chat" ? null : "chat")}
            >
              <LuMessageSquare />
            </Control>
            <Control
              caption="Настройки"
              label="Настройки встречи"
              active={panel === "settings"}
              onClick={() => setPanel(panel === "settings" ? null : "settings")}
            >
              <LuSettings />
            </Control>
            <button
              className="meeting-leave ml-2"
              onClick={() => setConfirm({ kind: "leave" })}
            >
              <LuPhoneOff /> Выйти
            </button>
          </div>
        </footer>
      </section>
      {confirm && (
        <MeetingDialog
          title={
            confirm.kind === "leave"
              ? "Выйти из встречи?"
              : confirm.kind === "record"
                ? "Начать запись?"
                : "Удалить участника?"
          }
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <p className="text-sm leading-6 text-fog">
            {confirm.kind === "leave"
              ? meeting.canHost
                ? "Можно выйти самому или завершить встречу для всех участников."
                : "Остальные участники смогут продолжить разговор."
              : confirm.kind === "record"
                ? "Участники увидят индикатор записи. Аудио будет отправлено на распознавание речи и подготовку AI-протокола."
                : "Участник будет отключён от комнаты и больше не сможет войти в эту встречу."}
          </p>
          {error && (
            <p className="mt-3 text-sm text-crit" role="alert">
              {error}
            </p>
          )}
          <div className="meeting-dialog-actions">
            <button
              disabled={busy}
              className="meeting-button"
              onClick={() => setConfirm(null)}
            >
              {confirm.kind === "leave" ? "Остаться" : "Отмена"}
            </button>
            {confirm.kind === "leave" ? (
              <>
                <button
                  disabled={busy}
                  className="meeting-button"
                  onClick={onLeave}
                >
                  Выйти из встречи
                </button>
                {meeting.canHost && (
                  <button
                    disabled={busy}
                    className="meeting-button danger"
                    onClick={() =>
                      void run(async () => {
                        await action("end");
                        onLeave();
                      })
                    }
                  >
                    Завершить для всех
                  </button>
                )}
              </>
            ) : (
              <button
                disabled={busy}
                className="meeting-button danger"
                onClick={() =>
                  void run(async () => {
                    await action(
                      confirm.kind === "record" ? "record" : "remove",
                      confirm.kind === "remove" ? confirm.personId : undefined,
                    );
                    setConfirm(null);
                  })
                }
              >
                {confirm.kind === "record" ? "Начать запись" : "Удалить"}
              </button>
            )}
          </div>
        </MeetingDialog>
      )}
    </>
  );
}

function Control({
  caption,
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  caption: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={"meeting-toolbar-button " + (active ? "active" : "")}
      aria-label={label}
      aria-pressed={!!active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{children}</span>
      <small>{caption}</small>
    </button>
  );
}
function Microphone({ participant }: { participant: Participant }) {
  const { isMuted } = useTrackMutedIndicator({
    participant,
    source: Track.Source.Microphone,
  });
  return (
    <span aria-label={isMuted ? "Микрофон выключен" : "Микрофон включён"}>
      {isMuted ? (
        <LuMicOff className="text-fog" />
      ) : (
        <LuMic className="text-ok" />
      )}
    </span>
  );
}
function ParticipantTile({
  track,
  name,
  role,
  hand,
  pinned,
  onPin,
}: {
  track: TrackReferenceOrPlaceholder;
  name: string;
  role: MeetingRole;
  hand: boolean;
  pinned: boolean;
  onPin: () => void;
}) {
  const { isMuted } = useTrackMutedIndicator(track);
  const camera = isTrackReference(track) && !isMuted;
  return (
    <div
      className={
        "meeting-video-tile meeting-live-tile " + (camera ? "camera-on" : "")
      }
    >
      {camera && (
        <VideoTrack trackRef={track} className="meeting-camera-video" />
      )}
      <span className="meeting-tile-status absolute left-4 top-4 text-[10px] uppercase tracking-widest text-fog">
        {camera ? "Видео" : "Камера выключена"}
      </span>
      <button
        className="meeting-tile-pin absolute right-3 top-3 rounded-md p-2 text-fog hover:bg-hull"
        aria-label={(pinned ? "Открепить: " : "Закрепить: ") + name}
        onClick={onPin}
      >
        <LuMaximize />
      </button>
      {!camera && <Avatar name={name} large />}
      <div className="meeting-tile-caption absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-snow">
            {name}
            {track.participant.isLocal ? " (вы)" : ""}
          </p>
          <p className="mt-1 text-xs text-fog">{MEETING_ROLES[role]}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {hand && <LuHand className="text-warn" />}
          <Microphone participant={track.participant} />
        </span>
      </div>
    </div>
  );
}
function DeviceSelect({
  kind,
  label,
  onError,
}: {
  kind: "audioinput" | "videoinput";
  label: string;
  onError: (error: string) => void;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind, requestPermissions: false });
  return (
    <label className="meeting-field">
      {label}
      <select
        value={activeDeviceId || "default"}
        onChange={(e) =>
          void setActiveMediaDevice(e.target.value).catch((error) =>
            onError(errorMessage(error)),
          )
        }
      >
        <option value="default">По умолчанию</option>
        {devices
          .filter((d) => d.deviceId && d.deviceId !== "default")
          .map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || label + " " + (i + 1)}
            </option>
          ))}
      </select>
    </label>
  );
}
