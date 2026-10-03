export type MeetingRole = 'host' | 'cohost' | 'participant';
export type MeetingStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export interface MeetingPerson {
  id: string;
  name: string;
  position: string;
  departmentId: string;
}
export interface MeetingParticipant {
  personId: string;
  role: MeetingRole;
}
export interface Meeting {
  id: string;
  title: string;
  startsAt: string;
  duration: number;
  departmentId: string;
  organizerId: string;
  participants: MeetingParticipant[];
  agenda: string;
  status: MeetingStatus;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  allowScreenShare: boolean;
  startedAt?: string;
  endedAt?: string;
  notes?: string;
}
export type MeetingDraft = Pick<
  Meeting,
  | 'title'
  | 'startsAt'
  | 'duration'
  | 'departmentId'
  | 'participants'
  | 'agenda'
  | 'waitingRoom'
  | 'muteOnEntry'
  | 'allowScreenShare'
>;
export const MEETING_ROLES: Record<MeetingRole, string> = {
  host: 'Организатор',
  cohost: 'Соорганизатор',
  participant: 'Участник',
};
export const MEETING_STATUSES: Record<MeetingStatus, string> = {
  scheduled: 'Запланирована',
  live: 'Идёт встреча',
  completed: 'Завершена',
  cancelled: 'Отменена',
};
