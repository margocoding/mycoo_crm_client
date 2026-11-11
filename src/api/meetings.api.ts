import { api } from "./base.api";
import type {
  LiveMeeting,
  Meeting,
  MeetingDraft,
  MeetingJoinResult,
  ProtocolTask,
} from "@/types/meetings.types";
import type { Department, TeamMember } from "@/types/team.types";
export interface MeetingList {
  meetings: Meeting[];
  departments: Department[];
  members: TeamMember[];
  callsAvailable: boolean;
}
export type MeetingInput = MeetingDraft & {
  kind: string;
  objective: string;
  previousId?: string;
};
const path = (workspace: string, id = "") =>
  "/workspace/" + workspace + "/meetings" + (id ? "/" + id : "");
export const meetingsApi = {
  list: (w: string, signal?: AbortSignal) =>
    api.get<MeetingList>(path(w), { signal }).then((r) => r.data),
  get: (w: string, id: string, signal?: AbortSignal) =>
    api.get<LiveMeeting>(path(w, id), { signal }).then((r) => r.data),
  save: (w: string, draft: MeetingInput, id?: string) =>
    (id
      ? api.patch<LiveMeeting>(path(w, id), draft)
      : api.post<LiveMeeting>(path(w), draft)
    ).then((r) => r.data),
  action: (w: string, id: string, action: string, personId?: string) =>
    api
      .post<LiveMeeting>(path(w, id) + "/actions", { action, personId }, { timeout: 120_000 })
      .then((r) => r.data),
  join: (w: string, id: string, signal?: AbortSignal) =>
    api
      .post<MeetingJoinResult>(
        path(w, id) + "/join",
        {},
        { signal, retrySafe: true, timeout: 120_000 },
      )
      .then((r) => r.data),
  transcript: (w: string, id: string, text: string) =>
    api
      .post<LiveMeeting>(path(w, id) + "/transcript", { text })
      .then((r) => r.data),
  publish: (
    w: string,
    id: string,
    revision: number,
    summary: string,
    decisions: string[],
    tasks: ProtocolTask[],
  ) =>
    api
      .post<LiveMeeting>(path(w, id) + "/protocol/publish", {
        revision,
        summary,
        decisions,
        tasks,
      })
      .then((r) => r.data),
  recording: (w: string, id: string, recordingId: string) =>
    api
      .post<{ url: string }>(
        path(w, id) + "/recordings/" + recordingId + "/url",
        {},
        { retrySafe: true, timeout: 120_000 },
      )
      .then((r) => r.data),
  retryRecording: (w: string, id: string, recordingId: string) =>
    api
      .post<LiveMeeting>(path(w, id) + "/recordings/" + recordingId + "/retry")
      .then((r) => r.data),
  shareRecording: (w: string, id: string, recordingId: string, enabled: boolean) =>
    api.post<{ token: string | null; expiresAt: string | null }>(path(w, id) + "/recordings/" + recordingId + "/share", { enabled }).then((r) => r.data),
  sharedRecording: (token: string, signal?: AbortSignal) =>
    api.get<{ title: string; createdAt: string; expiresAt: string; url: string }>("/meetings/recordings/shared/" + encodeURIComponent(token), { signal }).then((r) => r.data),
  notes: (w: string, id: string, notes: string) =>
    api
      .patch<LiveMeeting>(path(w, id) + "/notes", { notes })
      .then((r) => r.data),
  prepare: (w: string, id: string) =>
    api
      .post<{ agenda: string; suggestion: string }>(
        path(w, id) + "/prepare",
        {},
        { timeout: 180000 },
      )
      .then((r) => r.data),
};
