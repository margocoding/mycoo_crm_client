import { DisconnectReason } from "livekit-client";

export type MediaPreference = "once" | "remember" | "listen";
export const mediaPreferenceKey = "mycoo:meeting-media-preference";
export const mediaChoicesKey = "mycoo:meeting-media-choices";
export function parseMediaChoices(raw: string | null) {
  const fallback = {
    audioEnabled: false,
    videoEnabled: false,
    audioDeviceId: "default",
    videoDeviceId: "default",
  };
  try {
    const data = JSON.parse(raw || "null");
    if (
      !data ||
      typeof data.audioEnabled !== "boolean" ||
      typeof data.videoEnabled !== "boolean"
    )
      return fallback;
    return {
      audioEnabled: data.audioEnabled,
      videoEnabled: data.videoEnabled,
      audioDeviceId:
        typeof data.audioDeviceId === "string" ? data.audioDeviceId : "default",
      videoDeviceId:
        typeof data.videoDeviceId === "string" ? data.videoDeviceId : "default",
    };
  } catch {
    return fallback;
  }
}
export function parseMediaPreference(value: string | null): MediaPreference {
  return value === "remember" || value === "listen" ? value : "once";
}
export function shouldReconnect(reason?: DisconnectReason): boolean {
  return (
    reason === undefined ||
    [
      DisconnectReason.UNKNOWN_REASON,
      DisconnectReason.SERVER_SHUTDOWN,
      DisconnectReason.STATE_MISMATCH,
      DisconnectReason.JOIN_FAILURE,
      DisconnectReason.MIGRATION,
      DisconnectReason.SIGNAL_CLOSE,
      DisconnectReason.CONNECTION_TIMEOUT,
    ].includes(reason)
  );
}
export function unreadChatCount(
  messages: { id: string; from?: { identity: string } }[],
  seen: Set<string>,
  identity: string,
) {
  return messages.filter(
    (message) => message.from?.identity !== identity && !seen.has(message.id),
  ).length;
}
