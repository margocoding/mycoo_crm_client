import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LiveKitRoom } from "@livekit/components-react";
import { meetingsApi } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import type { LiveMeeting } from "@/types/meetings.types";
import LiveMeetingLobby, { type MediaChoices } from "./LiveMeetingLobby";
import LiveMeetingRoom from "./LiveMeetingRoom";

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
  const [choices, setChoices] = useState<MediaChoices | null>(null);
  const [connection, setConnection] = useState<{
    token: string;
    url: string;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!choices) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const join = async () => {
      try {
        const result = await meetingsApi.join(workspaceId, meeting.id);
        if (!active) return;
        if (result.waiting) {
          setWaiting(true);
          timer = setTimeout(() => void join(), 3000);
        } else if (result.token && result.url) {
          setWaiting(false);
          setConnection({ token: result.token, url: result.url });
          setError("");
        } else {
          throw new Error(
            "Не удалось получить доступ к звонку. Попробуйте ещё раз.",
          );
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

  if (!choices)
    return (
      <LiveMeetingLobby
        meeting={meeting}
        userId={userId}
        error={error}
        onBack={onLeave}
        onJoin={(value) => {
          setError("");
          setChoices(value);
        }}
      />
    );

  if (!connection)
    return (
      <div className="meeting-empty" aria-live="polite">
        <h1>
          {error
            ? "Не удалось войти"
            : waiting
              ? "Ожидаем организатора"
              : "Подключаемся к встрече…"}
        </h1>
        <p>
          {error ||
            (waiting
              ? "Запрос на вход отправлен. Вы войдёте, как только организатор допустит вас."
              : meeting.title)}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {error && (
            <button
              className="meeting-button primary"
              onClick={() => {
                setError("");
                setRetry((n) => n + 1);
              }}
            >
              Повторить вход
            </button>
          )}
          <button className="meeting-button" onClick={onLeave}>
            Вернуться к встрече
          </button>
        </div>
      </div>
    );

  return createPortal(
    <div className="meetings-ui">
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
        onDisconnected={() => {
          setConnection(null);
          setChoices(null);
          setError("Соединение завершено. При необходимости войдите снова.");
        }}
        onError={(e) => setError(errorMessage(e))}
      >
        <LiveMeetingRoom
          meeting={meeting}
          userId={userId}
          action={action}
          onLeave={onLeave}
          connectionError={error}
        />
      </LiveKitRoom>
    </div>,
    document.body,
  );
}
