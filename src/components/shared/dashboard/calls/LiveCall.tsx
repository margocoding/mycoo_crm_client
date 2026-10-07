import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  PreJoin,
  VideoConference,
} from "@livekit/components-react";
import type { LocalUserChoices } from "@livekit/components-react";
import "@livekit/components-styles";
import { meetingsApi } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import type { LiveMeeting } from "@/types/meetings.types";

export default function LiveCall({
  workspaceId,
  meeting,
  userId,
  action,
  onLeave,
}: {
  workspaceId: string;
  meeting: LiveMeeting;
  userId: string;
  action: (name: string, personId?: string) => Promise<void>;
  onLeave: () => void;
}) {
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const [connection, setConnection] = useState<{
    token: string;
    url: string;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!choices) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const join = async () => {
      try {
        const r = await meetingsApi.join(workspaceId, meeting.id);
        if (!active) return;
        if (r.waiting) {
          setWaiting(true);
          timer = setTimeout(() => void join(), 3000);
        } else if (r.token && r.url) {
          setWaiting(false);
          setConnection({ token: r.token, url: r.url });
          setError("");
        }
      } catch (e) {
        if (active) {
          setWaiting(false);
          setError(errorMessage(e));
        }
      }
    };
    void join();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [workspaceId, meeting.id, choices, retry]);
  async function control(name: string) {
    setBusy(true);
    try {
      await action(name);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const recording = meeting.recordings.some((r) =>
    ["starting", "recording", "stopping"].includes(r.status),
  );
  const hand = meeting.participants.find(
    (p) => p.personId === userId,
  )?.raisedHand;
  return (
    <section className="meeting-panel p-3" data-lk-theme="default">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className={recording ? "text-crit" : "text-fog"}>
          {recording
            ? "● Ведётся запись встречи. Аудио будет отправлено на распознавание."
            : "Запись выключена"}
        </span>
        <button className="meeting-button" onClick={onLeave}>
          Выйти из звонка
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-3 text-crit">
          {error}{" "}
          {!connection && (
            <button
              className="meeting-button"
              onClick={() => setRetry((v) => v + 1)}
            >
              Повторить вход
            </button>
          )}
        </p>
      )}
      {!choices ? (
        <PreJoin
          defaults={{
            username:
              meeting.participants.find((p) => p.personId === userId)?.name ||
              "Участник",
            audioEnabled: !meeting.muteOnEntry,
            videoEnabled: true,
          }}
          persistUserChoices={false}
          joinLabel="Войти"
          micLabel="Микрофон"
          camLabel="Камера"
          userLabel="Имя"
          onSubmit={setChoices}
          onError={(e) => setError(errorMessage(e))}
        />
      ) : connection ? (
        <div style={{ height: "min(72vh,750px)", minHeight: 420 }}>
          <LiveKitRoom
            token={connection.token}
            serverUrl={connection.url}
            connect
            audio={
              choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false
            }
            video={
              choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false
            }
            onDisconnected={onLeave}
            onError={(e) => setError(errorMessage(e))}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      ) : (
        <p className="p-8 text-center text-fog">
          {waiting
            ? "Ожидаем допуска организатором…"
            : "Подключаемся к встрече…"}
        </p>
      )}
      {connection && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={busy}
            className="meeting-button"
            onClick={() => void control(hand ? "lower" : "raise")}
          >
            {hand ? "Опустить руку" : "✋ Поднять руку"}
          </button>
          {meeting.canModerate && (
            <button
              disabled={
                busy || meeting.recordings.some((r) => r.status === "stopping")
              }
              className="meeting-button"
              onClick={() => {
                if (
                  recording ||
                  window.confirm(
                    "Начать запись? Участники увидят индикатор; аудио будет отправлено на распознавание речи и подготовку AI-протокола.",
                  )
                )
                  void control(recording ? "stop-record" : "record");
              }}
            >
              {recording ? "Остановить запись" : "Начать запись"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
