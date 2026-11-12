import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LiveKitRoom } from "@livekit/components-react";
import { meetingsApi } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import type { CallMeeting, MeetingJoinResult } from "@/types/meetings.types";
import LiveMeetingLobby, { type MediaChoices } from "./LiveMeetingLobby";
import LiveMeetingRoom from "./LiveMeetingRoom";
import { shouldReconnect } from "./call-policy";

export default function LiveCall({
  workspaceId,
  meeting,
  userId,
  action,
  onLeave,
  joinCall,
}: {
  workspaceId: string;
  meeting: CallMeeting;
  userId: string;
  action: (name: string, personId?: string) => Promise<void>;
  onLeave: () => void;
  joinCall?: (signal: AbortSignal) => Promise<MeetingJoinResult>;
}) {
  const [choices, setChoices] = useState<MediaChoices | null>(null);
  const [connection, setConnection] = useState<{
    token: string;
    url: string;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const attempts = useRef(0);
  useEffect(() => {
    const hideDevices = () => {
      if (
        document.visibilityState === "hidden" &&
        window.matchMedia("(pointer: coarse)").matches
      )
        setChoices((current) =>
          current
            ? { ...current, audioEnabled: false, videoEnabled: false }
            : current,
        );
    };
    document.addEventListener("visibilitychange", hideDevices);
    return () => document.removeEventListener("visibilitychange", hideDevices);
  }, []);
  useEffect(() => {
    if (!recovering) return;
    const retryWhenVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        setRecovering(false);
        setRetry((value) => value + 1);
      }
    };
    const timer = setTimeout(
      retryWhenVisible,
      Math.min(1000 * 2 ** attempts.current, 15000),
    );
    document.addEventListener("visibilitychange", retryWhenVisible);
    window.addEventListener("online", retryWhenVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", retryWhenVisible);
      window.removeEventListener("online", retryWhenVisible);
    };
  }, [recovering]);
  useEffect(() => {
    if (!choices || recovering || connection) return;
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const join = async () => {
      try {
        const result = await (joinCall
          ? joinCall(controller.signal)
          : meetingsApi.join(workspaceId, meeting.id, controller.signal));
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
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    workspaceId,
    meeting.id,
    choices,
    retry,
    joinCall,
    recovering,
    connection,
  ]);

  if (!choices)
    return (
      <LiveMeetingLobby
        meeting={meeting}
        userId={userId}
        error={error}
        onBack={onLeave}
        onJoin={(value) => {
          attempts.current = 0;
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
            : recovering
              ? "Восстанавливаем соединение…"
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
        onDisconnected={(reason) => {
          setConnection(null);
          if (shouldReconnect(reason) && attempts.current < 5) {
            attempts.current += 1;
            setError("");
            setRecovering(true);
          } else {
            setChoices(null);
            setError(
              "Соединение завершено. Если встреча ещё идёт, проверьте доступ и войдите снова.",
            );
          }
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
