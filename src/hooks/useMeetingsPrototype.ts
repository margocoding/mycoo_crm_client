import { useEffect, useState } from 'react';
import { meetingPeople, seedMeetings } from '@/data/meetings/prototypeData';
import {
  MEETING_ROLES,
  MEETING_STATUSES,
  type Meeting,
} from '@/types/meetings.types';

const personIds = new Set(meetingPeople('').map((person) => person.id));
function isMeeting(value: unknown): value is Meeting {
  if (!value || typeof value !== 'object') return false;
  const m = value as Meeting;
  return (
    typeof m.id === 'string' &&
    typeof m.title === 'string' &&
    typeof m.startsAt === 'string' &&
    Number.isFinite(Date.parse(m.startsAt)) &&
    Number.isFinite(m.duration) &&
    m.duration > 0 &&
    typeof m.departmentId === 'string' &&
    typeof m.organizerId === 'string' &&
    typeof m.agenda === 'string' &&
    Object.prototype.hasOwnProperty.call(MEETING_STATUSES, m.status) &&
    typeof m.waitingRoom === 'boolean' &&
    typeof m.muteOnEntry === 'boolean' &&
    typeof m.allowScreenShare === 'boolean' &&
    (m.notes === undefined || typeof m.notes === 'string') &&
    Array.isArray(m.participants) &&
    m.participants.length > 0 &&
    m.participants.every(
      (p) =>
        p &&
        personIds.has(p.personId) &&
        Object.prototype.hasOwnProperty.call(MEETING_ROLES, p.role),
    ) &&
    m.participants.some(
      (p) => p.personId === m.organizerId && p.role === 'host',
    ) &&
    new Set(m.participants.map((p) => p.personId)).size ===
      m.participants.length &&
    (m.startedAt === undefined ||
      (typeof m.startedAt === 'string' &&
        Number.isFinite(Date.parse(m.startedAt)))) &&
    (m.endedAt === undefined ||
      (typeof m.endedAt === 'string' && Number.isFinite(Date.parse(m.endedAt))))
  );
}
export function useMeetingsPrototype(scope: string) {
  const key = 'mycoo:meetings:prototype:v1:' + scope;
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (
        saved?.version === 1 &&
        Array.isArray(saved.meetings) &&
        saved.meetings.every(isMeeting)
      )
        return saved.meetings;
    } catch {
      /* An unavailable or outdated cache must not block the prototype. */
    }
    return seedMeetings();
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, meetings }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [key, meetings]);
  const update = (id: string, patch: Partial<Meeting>) =>
    setMeetings((items) =>
      items.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  return { meetings, setMeetings, update, storageError };
}
