import { useState, type FormEvent } from 'react';
import { LuCalendar, LuShieldCheck } from 'react-icons/lu';
import { meetingDepartments } from '@/data/meetings/prototypeData';
import type {
  Meeting,
  MeetingDraft,
  MeetingParticipant,
  MeetingPerson,
} from '@/types/meetings.types';
import { Avatar, MeetingDialog } from './MeetingUI';

function localDateTime(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export default function NewMeetingModal({
  meeting,
  people,
  onClose,
  onSubmit,
}: {
  meeting?: Meeting;
  people: MeetingPerson[];
  onClose: () => void;
  onSubmit: (draft: MeetingDraft) => void;
}) {
  const [title, setTitle] = useState(meeting?.title || '');
  const [startsAt, setStartsAt] = useState(
    localDateTime(
      meeting ? new Date(meeting.startsAt) : new Date(Date.now() + 30 * 60000),
    ),
  );
  const [departmentId, setDepartmentId] = useState(
    meeting?.departmentId || 'operations',
  );
  const [duration, setDuration] = useState(meeting?.duration || 45);
  const [agenda, setAgenda] = useState(meeting?.agenda || '');
  const [participants, setParticipants] = useState<MeetingParticipant[]>(
    meeting?.participants || [{ personId: 'me', role: 'host' }],
  );
  const [waitingRoom, setWaitingRoom] = useState(meeting?.waitingRoom ?? true);
  const [muteOnEntry, setMuteOnEntry] = useState(meeting?.muteOnEntry ?? true);
  const [allowScreenShare, setAllowScreenShare] = useState(
    meeting?.allowScreenShare ?? true,
  );
  const [error, setError] = useState('');
  const available = people.filter((p) => p.departmentId === departmentId);
  function changeDepartment(id: string) {
    setDepartmentId(id);
    setParticipants((current) =>
      current.filter(
        (p) =>
          p.role === 'host' ||
          people.some(
            (person) => person.id === p.personId && person.departmentId === id,
          ),
      ),
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const when = new Date(startsAt);
    if (!title.trim()) {
      setError('Введите название встречи.');
      return;
    }
    if (!Number.isFinite(when.getTime()) || when.getTime() < Date.now()) {
      setError('Выберите будущие дату и время.');
      return;
    }
    onSubmit({
      title: title.trim(),
      startsAt: when.toISOString(),
      duration,
      departmentId,
      agenda: agenda.trim(),
      participants,
      waitingRoom,
      muteOnEntry,
      allowScreenShare,
    });
  }
  return (
    <MeetingDialog
      title={meeting ? 'Изменить встречу' : 'Новая встреча'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-fog">
          Планируйте разговор в контексте отдела. В прототипе приглашения не
          отправляются.
        </p>
        <label className="meeting-field">
          Название встречи
          <input
            required
            maxLength={120}
            placeholder="Например, планирование следующей недели"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="meeting-field">
            Дата и время
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className="meeting-field">
            Продолжительность
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} минут
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="meeting-field">
          Департамент
          <select
            value={departmentId}
            onChange={(e) => changeDepartment(e.target.value)}
          >
            {meetingDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-mist">
            Участники <span className="text-fog">· {participants.length}</span>
          </legend>
          <div className="meeting-person-row mb-2">
            <Avatar name={people[0].name} />
            <div className="flex-1">
              <p>
                {people[0].name} <span className="text-fog">(вы)</span>
              </p>
              <small className="text-fog">
                Организатор · управление встречей
              </small>
            </div>
            <LuShieldCheck className="text-flux" />
          </div>
          <div className="space-y-2">
            {available.map((person) => {
              const selected = participants.find(
                (p) => p.personId === person.id,
              );
              return (
                <div key={person.id} className="meeting-person-row">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={(e) =>
                        setParticipants((current) =>
                          e.target.checked
                            ? [
                                ...current,
                                { personId: person.id, role: 'participant' },
                              ]
                            : current.filter((p) => p.personId !== person.id),
                        )
                      }
                    />
                    <span>
                      <span className="block text-sm text-snow">
                        {person.name}
                      </span>
                      <span className="text-xs text-fog">
                        {person.position}
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <select
                      aria-label={'Роль: ' + person.name}
                      className="meeting-select compact"
                      value={selected.role}
                      onChange={(e) =>
                        setParticipants((current) =>
                          current.map((p) =>
                            p.personId === person.id
                              ? {
                                  ...p,
                                  role:
                                    e.target.value === 'cohost'
                                      ? 'cohost'
                                      : 'participant',
                                }
                              : p,
                          ),
                        )
                      }
                    >
                      <option value="participant">Участник</option>
                      <option value="cohost">Соорганизатор</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
        <label className="meeting-field">
          Повестка <span className="font-normal text-fog">(необязательно)</span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="Что обсудить и с каким результатом закончить"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
          />
        </label>
        <fieldset className="meeting-settings">
          <legend className="mb-2 text-sm font-semibold">
            Настройки входа
          </legend>
          <label>
            <input
              type="checkbox"
              checked={waitingRoom}
              onChange={(e) => setWaitingRoom(e.target.checked)}
            />
            Зал ожидания
          </label>
          <label>
            <input
              type="checkbox"
              checked={muteOnEntry}
              onChange={(e) => setMuteOnEntry(e.target.checked)}
            />
            Выключать микрофон при входе
          </label>
          <label>
            <input
              type="checkbox"
              checked={allowScreenShare}
              onChange={(e) => setAllowScreenShare(e.target.checked)}
            />
            Разрешить участникам демонстрацию экрана
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-crit">
            {error}
          </p>
        )}
        <div className="meeting-dialog-actions">
          <button type="button" className="meeting-button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="meeting-button primary">
            <LuCalendar />
            {meeting ? 'Сохранить изменения' : 'Создать встречу'}
          </button>
        </div>
      </form>
    </MeetingDialog>
  );
}
