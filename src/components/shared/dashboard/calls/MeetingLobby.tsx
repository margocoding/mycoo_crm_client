import { useState } from 'react';
import {
  LuArrowLeft,
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  LuShieldCheck,
} from 'react-icons/lu';
import type { Meeting, MeetingPerson } from '@/types/meetings.types';
import { MEETING_ROLES } from '@/types/meetings.types';
import { Avatar } from './MeetingUI';

export interface JoinSettings {
  personId: string;
  mic: boolean;
  camera: boolean;
}
export default function MeetingLobby({
  meeting,
  people,
  onBack,
  onJoin,
}: {
  meeting: Meeting;
  people: MeetingPerson[];
  onBack: () => void;
  onJoin: (settings: JoinSettings) => void;
}) {
  const [personId, setPersonId] = useState(meeting.organizerId);
  const [mic, setMic] = useState(!meeting.muteOnEntry);
  const [camera, setCamera] = useState(false);
  const person = people.find((p) => p.id === personId)!;
  const role = meeting.participants.find((p) => p.personId === personId)!.role;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="meeting-back">
        <LuArrowLeft />К встрече
      </button>
      <div className="grid items-center gap-8 xl:grid-cols-[1.2fr_1fr]">
        <div className={'meeting-preview ' + (camera ? 'camera-on' : '')}>
          <span className="absolute left-5 top-5 rounded-full border border-line bg-void/50 px-3 py-1 text-xs text-fog">
            Предпросмотр · демо
          </span>
          <Avatar name={person.name} large />
          <p className="mt-5 text-lg font-semibold text-snow">{person.name}</p>
          <p className="mt-2 text-sm text-fog">
            {camera ? 'Камера включена в демо' : 'Камера выключена'}
          </p>
          <div className="absolute bottom-6 flex gap-3">
            <button
              className={'meeting-control ' + (!mic ? 'off' : '')}
              aria-label={mic ? 'Выключить микрофон' : 'Включить микрофон'}
              aria-pressed={mic}
              onClick={() => setMic((v) => !v)}
            >
              {mic ? <LuMic /> : <LuMicOff />}
            </button>
            <button
              className={'meeting-control ' + (!camera ? 'off' : '')}
              aria-label={camera ? 'Выключить камеру' : 'Включить камеру'}
              aria-pressed={camera}
              onClick={() => setCamera((v) => !v)}
            >
              {camera ? <LuVideo /> : <LuVideoOff />}
            </button>
          </div>
        </div>
        <div className="max-w-lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-flux">
            Перед входом
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-relaxed text-snow">
            Готовы присоединиться?
          </h1>
          <p className="mt-4 text-lg text-mist break-words">{meeting.title}</p>
          <label className="meeting-field mt-7">
            Войти как (проверка ролей)
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              {meeting.participants.map((p) => (
                <option value={p.personId} key={p.personId}>
                  {people.find((person) => person.id === p.personId)?.name} —{' '}
                  {MEETING_ROLES[p.role]}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-5 flex gap-3 text-sm leading-6 text-fog">
            <LuShieldCheck className="mt-1 shrink-0 text-flux" />
            <p>
              {role === 'host'
                ? 'Вы управляете залом ожидания, назначаете соорганизаторов и завершаете встречу для всех.'
                : role === 'cohost'
                  ? 'Вы можете допускать участников, выключать микрофоны и помогать организатору.'
                  : 'Вы управляете своим микрофоном и камерой, пишете в чат и поднимаете руку.'}
            </p>
          </div>
          <button
            className="meeting-button primary mt-7 w-full justify-center"
            onClick={() => onJoin({ personId, mic, camera })}
          >
            <LuVideo />
            Присоединиться
          </button>
          <p className="mt-4 text-xs leading-5 text-fog">
            Демонстрационная комната. Камера и микрофон устройства не
            используются; никто не подключается к реальному звонку.
          </p>
        </div>
      </div>
    </div>
  );
}
