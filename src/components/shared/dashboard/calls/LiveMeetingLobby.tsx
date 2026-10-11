import { useCallback, useEffect, useRef, useState } from "react";
import { usePreviewTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  LuArrowLeft,
  LuArrowRight,
  LuMic,
  LuMicOff,
  LuShieldCheck,
  LuVideo,
  LuVideoOff,
} from "react-icons/lu";
import { MEETING_ROLES, type LiveMeeting } from "@/types/meetings.types";
import { Avatar } from "./MeetingUI";

export interface MediaChoices {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
}

export default function LiveMeetingLobby({
  meeting,
  userId,
  error,
  onJoin,
  onBack,
}: {
  meeting: LiveMeeting;
  userId: string;
  error: string;
  onJoin: (choices: MediaChoices) => void;
  onBack: () => void;
}) {
  const [audioEnabled, setAudio] = useState(!meeting.muteOnEntry);
  const [videoEnabled, setVideo] = useState(false);
  const [audioDeviceId, setAudioDevice] = useState("default");
  const [videoDeviceId, setVideoDevice] = useState("default");
  const [deviceError, setDeviceError] = useState("");
  const preview = useRef<HTMLVideoElement>(null);
  const handleDeviceError = useCallback(() => {
    setAudio(false);
    setVideo(false);
    setDeviceError(
      "Не удалось включить устройство. Проверьте разрешения браузера. Можно войти без камеры и микрофона.",
    );
  }, []);
  const tracks = usePreviewTracks(
    {
      audio: audioEnabled ? { deviceId: audioDeviceId } : false,
      video: videoEnabled ? { deviceId: videoDeviceId } : false,
    },
    handleDeviceError,
  );
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      void navigator.mediaDevices
        ?.enumerateDevices()
        .then((value) => {
          if (active) setDevices(value);
        })
        .catch(() => {});
    refresh();
    navigator.mediaDevices?.addEventListener("devicechange", refresh);
    return () => {
      active = false;
      navigator.mediaDevices?.removeEventListener("devicechange", refresh);
    };
  }, [tracks]);
  const microphones = devices.filter((d) => d.kind === "audioinput");
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const videoTrack = tracks?.find((track) => track.kind === Track.Kind.Video);
  useEffect(() => {
    const element = preview.current;
    if (!element || !videoTrack) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);
  const name =
    meeting.participants.find((p) => p.personId === userId)?.name || "Участник";
  return (
    <div className="meeting-page">
      <button className="meeting-back mb-7" onClick={onBack}>
        <LuArrowLeft /> К встрече
      </button>
      <div className="grid items-center gap-8 xl:grid-cols-[1.2fr_1fr]">
        <div
          className={
            "meeting-preview overflow-hidden " +
            (videoEnabled ? "camera-on" : "")
          }
        >
          {videoTrack && videoEnabled && (
            <video
              ref={preview}
              className="meeting-preview-video"
              autoPlay
              muted
              playsInline
            />
          )}
          <span className="absolute left-5 top-5 z-10 rounded-md bg-void/70 px-3 py-1.5 text-[10px] uppercase tracking-widest text-fog">
            Предпросмотр
          </span>
          <div className="relative z-10 text-center">
            {!videoEnabled && <Avatar name={name} large />}
            {!videoEnabled && (
              <p className="mt-6 text-lg font-semibold text-snow">{name}</p>
            )}
            {!videoEnabled && (
              <p className="mt-2 text-xs text-fog">Камера выключена</p>
            )}
          </div>
          <div className="absolute bottom-6 z-10 flex gap-3">
            <button
              className={"meeting-control " + (!audioEnabled ? "off" : "")}
              aria-label={
                audioEnabled ? "Выключить микрофон" : "Включить микрофон"
              }
              aria-pressed={audioEnabled}
              onClick={() => {
                setDeviceError("");
                setAudio(!audioEnabled);
              }}
            >
              {audioEnabled ? <LuMic /> : <LuMicOff />}
            </button>
            <button
              className={"meeting-control " + (!videoEnabled ? "off" : "")}
              aria-label={videoEnabled ? "Выключить камеру" : "Включить камеру"}
              aria-pressed={videoEnabled}
              onClick={() => {
                setDeviceError("");
                setVideo(!videoEnabled);
              }}
            >
              {videoEnabled ? <LuVideo /> : <LuVideoOff />}
            </button>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-widest text-flux">
            Перед входом
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold leading-relaxed text-snow">
            Готовы присоединиться?
          </h1>
          <p className="mt-4 break-words text-lg text-mist">{meeting.title}</p>
          <div className="my-6 flex items-center gap-3">
            <Avatar name={name} />
            <div>
              <p className="text-sm font-semibold text-snow">{name}</p>
              <p className="mt-1 text-xs text-fog">
                {MEETING_ROLES[meeting.myRole]}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="meeting-field">
              Микрофон
              <select
                value={audioDeviceId}
                onChange={(e) => {
                  setDeviceError("");
                  setAudioDevice(e.target.value);
                }}
              >
                <option value="default">По умолчанию</option>
                {microphones
                  .filter((d) => d.deviceId && d.deviceId !== "default")
                  .map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Микрофон " + (i + 1)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="meeting-field">
              Камера
              <select
                value={videoDeviceId}
                onChange={(e) => {
                  setDeviceError("");
                  setVideoDevice(e.target.value);
                }}
              >
                <option value="default">По умолчанию</option>
                {cameras
                  .filter((d) => d.deviceId && d.deviceId !== "default")
                  .map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Камера " + (i + 1)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <p className="my-6 flex gap-3 text-xs leading-6 text-fog">
            <LuShieldCheck className="mt-1 shrink-0 text-flux" />
            {meeting.waitingRoom && !meeting.canModerate
              ? "Организатор допустит вас из зала ожидания."
              : "Проверьте устройства перед входом. Их можно включить и во время встречи."}
          </p>
          {(error || deviceError) && (
            <p role="alert" className="mb-4 text-sm text-crit">
              {deviceError || error}
            </p>
          )}
          <button
            className="meeting-button primary w-full"
            onClick={() =>
              onJoin({
                audioEnabled,
                videoEnabled,
                audioDeviceId,
                videoDeviceId,
              })
            }
          >
            Войти во встречу <LuArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
