import { api } from "./base.api";
import type { CallMeeting, MeetingJoinResult, MeetingStatus } from "@/types/meetings.types";

export interface PublicMeeting {
  id: string;
  title: string;
  startsAt: string;
  startedAt: string | null;
  duration: number;
  status: MeetingStatus;
  waitingRoom: boolean;
  locked: boolean;
  muteOnEntry: boolean;
  allowScreenShare: boolean;
  callsAvailable: boolean;
  recordingActive: boolean;
  identity: string | null;
  guestState: "none" | "waiting" | "admitted" | "removed" | "expired";
  participants: CallMeeting["participants"];
}

const path = (token: string) => "/meetings/join/" + encodeURIComponent(token);
export const guestMeetingsApi = {
  get: (token: string, guestKey?: string, signal?: AbortSignal) =>
    api.get<PublicMeeting>(path(token), {
      signal,
      headers: guestKey ? { "X-Meeting-Guest-Key": guestKey } : undefined,
    }).then((r) => r.data),
  join: (token: string, name: string, guestKey: string, signal: AbortSignal) =>
    api.post<MeetingJoinResult>(path(token) + "/join", { name, guestKey }, {
      signal,
      retrySafe: true,
      timeout: 120_000,
    }).then((r) => r.data),
  action: (token: string, guestKey: string, action: "raise" | "lower", signal?: AbortSignal) =>
    api.post<PublicMeeting>(path(token) + "/actions", { guestKey, action }, {
      signal,
      retrySafe: true,
    }).then((r) => r.data),
};
