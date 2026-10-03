import { useState } from 'react';
import {
  LuArrowLeft,
  LuCalendar,
  LuClock,
  LuCopy,
  LuFileText,
  LuPencil,
  LuVideo,
  LuX,
} from 'react-icons/lu';
import type { Meeting, MeetingPerson } from '@/types/meetings.types';
import { MEETING_ROLES } from '@/types/meetings.types';
import { meetingDepartments } from '@/data/meetings/prototypeData';
import {
  Avatar,
  MeetingBadge,
  MeetingDialog,
  formatMeetingDate,
  formatMeetingTime,
} from './MeetingUI';

export default function MeetingDetail({
  meeting,
  people,
  onBack,
  onJoin,
  onEdit,
  onCancel,
  onNotes,
}: {
  meeting: Meeting;
  people: MeetingPerson[];
  onBack: () => void;
  onJoin: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onNotes: (value: string) => void;
}) {
  const [cancel, setCancel] = useState(false);
  const [notice, setNotice] = useState('');
  const [notes, setNotes] = useState(meeting.notes || '');
  const open = meeting.status === 'scheduled' || meeting.status === 'live';
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('meeting', meeting.id);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice(
        'Демоссылка скопирована. Она открывает встречу только в этом браузере.',
      );
    } catch {
      setNotice('Скопируйте демоссылку из поля ниже.');
    }
  }
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="meeting-back">
        <LuArrowLeft />
        Все встречи
      </button>
      <section className="meeting-panel p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-flux">
            {
              meetingDepartments.find((d) => d.id === meeting.departmentId)
                ?.name
            }
          </span>
          <MeetingBadge status={meeting.status} />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold leading-relaxed text-snow md:text-3xl break-words">
          {meeting.title}
        </h1>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-fog">
          <span className="flex items-center gap-2">
            <LuCalendar />
            {formatMeetingDate(meeting.startsAt)},{' '}
            {formatMeetingTime(meeting.startsAt)}
          </span>
          <span className="flex items-center gap-2">
            <LuClock />
            {meeting.duration} минут
          </span>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          {open && (
            <button onClick={onJoin} className="meeting-button primary">
              <LuVideo />
              Войти во встречу
            </button>
          )}
          {meeting.status === 'scheduled' && (
            <>
              <button onClick={onEdit} className="meeting-button">
                <LuPencil />
                Изменить
              </button>
              <button
                onClick={() => setCancel(true)}
                className="meeting-button danger subtle"
              >
                <LuX />
                Отменить встречу
              </button>
            </>
          )}
        </div>
        {meeting.status === 'live' && (
          <p className="mt-4 text-sm text-fog">
            Демонстрационная комната открыта. Можно вернуться в звонок.
          </p>
        )}
        {meeting.status === 'completed' && (
          <p className="mt-4 text-sm text-ok">
            Встреча завершена
            {meeting.endedAt
              ? ' · ' +
                formatMeetingDate(meeting.endedAt) +
                ', ' +
                formatMeetingTime(meeting.endedAt)
              : ''}
            .
          </p>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="meeting-panel p-6">
          <h2 className="meeting-section-heading">
            <LuFileText />
            Повестка
          </h2>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-mist">
            {meeting.agenda || 'Повестка пока не добавлена.'}
          </p>
          <div className="mt-8 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-snow">
              Материалы встречи
            </h3>
            <p className="mt-2 text-sm leading-6 text-fog">
              Запись, расшифровка и AI-протокол появятся после подключения
              сервиса звонков. В этом прототипе они не создаются.
            </p>
          </div>
          {meeting.status === 'completed' && (
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                onNotes(notes.trim());
                setNotice('Заметки сохранены в этом браузере.');
              }}
            >
              <label className="meeting-field">
                Заметки по итогам
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Зафиксируйте решения вручную"
                />
              </label>
              <button className="meeting-button mt-3" type="submit">
                Сохранить заметки
              </button>
            </form>
          )}
        </section>
        <section className="meeting-panel p-6">
          <h2 className="meeting-section-heading">
            Участники · {meeting.participants.length}
          </h2>
          <div className="mt-4 space-y-3">
            {meeting.participants.map((p) => {
              const person = people.find((item) => item.id === p.personId);
              return (
                <div className="flex items-center gap-3" key={p.personId}>
                  <Avatar name={person?.name || 'Участник'} />
                  <div className="min-w-0">
                    <p className="text-sm text-snow">
                      {person?.name}
                      {p.personId === 'me' ? ' (вы)' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-fog">
                      {MEETING_ROLES[p.role]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {open && (
            <div className="mt-6 border-t border-line pt-5">
              <label className="meeting-field">
                Демоссылка
                <input
                  readOnly
                  value={url.toString()}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button onClick={copy} className="meeting-button mt-3">
                <LuCopy />
                Скопировать ссылку
              </button>
              <p className="mt-2 text-xs leading-5 text-fog">
                Доступна только в этом браузере. Настоящие приглашения будут
                работать после подключения звонков.
              </p>
            </div>
          )}
        </section>
      </div>
      <p role="status" className="text-sm text-flux">
        {notice}
      </p>
      {cancel && (
        <MeetingDialog
          title="Отменить встречу?"
          onClose={() => setCancel(false)}
        >
          <p className="text-sm leading-6 text-fog">
            «{meeting.title}» останется в списке отменённых. Участникам не будут
            отправлены уведомления.
          </p>
          <div className="meeting-dialog-actions">
            <button className="meeting-button" onClick={() => setCancel(false)}>
              Оставить встречу
            </button>
            <button
              className="meeting-button danger"
              onClick={() => {
                onCancel();
                setCancel(false);
              }}
            >
              Отменить встречу
            </button>
          </div>
        </MeetingDialog>
      )}
    </div>
  );
}
