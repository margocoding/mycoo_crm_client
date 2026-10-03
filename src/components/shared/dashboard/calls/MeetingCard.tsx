import { LuArrowUpRight, LuClock, LuUsers } from 'react-icons/lu';
import type { Meeting, MeetingPerson } from '@/types/meetings.types';
import { meetingDepartments } from '@/data/meetings/prototypeData';
import {
  Avatar,
  MeetingBadge,
  formatMeetingDate,
  formatMeetingTime,
} from './MeetingUI';

export default function MeetingCard({
  meeting,
  people,
  onClick,
}: {
  meeting: Meeting;
  people: MeetingPerson[];
  onClick: () => void;
}) {
  const names = meeting.participants.map(
    (p) =>
      people.find((person) => person.id === p.personId)?.name || 'Участник',
  );
  return (
    <button onClick={onClick} className="meeting-list-row">
      <div className="meeting-list-time">
        <strong>{formatMeetingTime(meeting.startsAt)}</strong>
        <span>{formatMeetingDate(meeting.startsAt)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-fog">
          {meetingDepartments.find((d) => d.id === meeting.departmentId)?.name}
        </p>
        <h3 className="mt-1 text-base font-semibold text-snow break-words">
          {meeting.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-fog">
          <span className="flex items-center gap-1.5">
            <LuClock />
            {meeting.duration} мин
          </span>
          <span className="flex items-center gap-1.5">
            <LuUsers />
            Участников: {names.length}
          </span>
          <MeetingBadge status={meeting.status} />
        </div>
      </div>
      <div className="meeting-avatar-stack hidden md:flex">
        {names.slice(0, 3).map((name, i) => (
          <Avatar key={i} name={name} />
        ))}
      </div>
      <LuArrowUpRight className="shrink-0 text-fog" />
    </button>
  );
}
