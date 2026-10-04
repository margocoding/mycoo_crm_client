import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LuArrowLeft,
  LuCalendar,
  LuPlus,
  LuSearch,
  LuVideo,
  LuArrowUpRight,
} from 'react-icons/lu';
import MeetingSession from '@/components/shared/dashboard/calls/MeetingSession';
import MeetingCard from '@/components/shared/dashboard/calls/MeetingCard';
import NewMeetingModal from '@/components/shared/dashboard/calls/NewMeetingModal';
import {
  Avatar,
  formatMeetingDate,
  formatMeetingTime,
} from '@/components/shared/dashboard/calls/MeetingUI';
import {
  meetingDepartments,
  meetingPeople,
} from '@/data/meetings/prototypeData';
import { useMeetingsPrototype } from '@/hooks/useMeetingsPrototype';
import { useAuthStore } from '@/store/auth.store';
import { useLaunchStore } from '@/store/launch.store';
import type {
  Meeting,
  MeetingDraft,
  MeetingStatus,
} from '@/types/meetings.types';
import '@/components/shared/dashboard/calls/meetings.css';
const LiveCallsPage = lazy(()=>import('@/components/shared/dashboard/calls/LiveCallsPage'));

export default function CallsPage({ preview = false }: { preview?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const workspace = useLaunchStore((s) => s.workspace);
  if (!preview) return <div className="meetings-ui"><Suspense fallback={<p className="p-6 text-fog">Загружаем встречи…</p>}><LiveCallsPage/></Suspense></div>;
  const scope = preview
    ? 'preview'
    : (workspace?.id || 'none') + ':' + (user?.id || 'none');
  const name = preview
    ? 'Иван Петров'
    : user?.name || workspace?.ownerName || 'Вы';
  return <Meetings key={scope} scope={scope} name={name} />;
}
function Meetings({ scope, name }: { scope: string; name: string }) {
  const { meetings, setMeetings, update, storageError } =
    useMeetingsPrototype(scope);
  const people = useMemo(() => meetingPeople(name), [name]);
  const [params, setParams] = useSearchParams();
  const activeId = params.get('meeting');
  const meeting = meetings.find((m) => m.id === activeId);
  const [quickMeetingId, setQuickMeetingId] = useState<string | null>(null);
  const [editor, setEditor] = useState(false);
  const [filter, setFilter] = useState<'all' | MeetingStatus>('all');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  function select(id?: string) {
    const next = new URLSearchParams(params);
    if (id) next.set('meeting', id);
    else next.delete('meeting');
    setParams(next);
    setEditor(false);
  }
  function create(draft: MeetingDraft) {
    const created: Meeting = {
      ...draft,
      id: crypto.randomUUID(),
      organizerId: 'me',
      status: 'scheduled',
    };
    setMeetings((current) => [created, ...current]);
    select(created.id);
  }
  function quick() {
    const created: Meeting = {
      id: crypto.randomUUID(),
      title: 'Быстрая встреча',
      startsAt: new Date().toISOString(),
      duration: 30,
      departmentId: department || 'operations',
      organizerId: 'me',
      participants: [
        { personId: 'me', role: 'host' },
        ...people
          .filter((p) => p.departmentId === (department || 'operations'))
          .map((p) => ({ personId: p.id, role: 'participant' as const })),
      ],
      agenda: '',
      status: 'scheduled',
      waitingRoom: true,
      muteOnEntry: true,
      allowScreenShare: true,
    };
    setMeetings((current) => [created, ...current]);
    select(created.id);
    setQuickMeetingId(created.id);
  }
  const upcoming = meetings
    .filter((m) => m.status === 'scheduled' || m.status === 'live')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const nextMeeting = upcoming.find((m) => m.status === 'live') || upcoming[0];
  const filtered = meetings
    .filter(
      (m) =>
        (filter === 'all' || m.status === filter) &&
        (!department || m.departmentId === department) &&
        m.title
          .toLocaleLowerCase('ru')
          .includes(query.trim().toLocaleLowerCase('ru')),
    )
    .sort((a, b) => {
      const activeA = a.status === 'scheduled' || a.status === 'live',
        activeB = b.status === 'scheduled' || b.status === 'live';
      return activeA !== activeB
        ? Number(activeB) - Number(activeA)
        : activeA
          ? a.startsAt.localeCompare(b.startsAt)
          : b.startsAt.localeCompare(a.startsAt);
    });
  return (
    <div className="meetings-ui">
      <div className="meeting-demo-note">
        <span className="meeting-demo-pill">Прототип</span>
        <p>
          Тестовая команда и локальные встречи. Звонки, запись и сообщения
          имитируются; приглашения не отправляются.
        </p>
      </div>
      {storageError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-warn/40 p-3 text-sm text-warn"
        >
          Браузер не разрешил сохранить встречи. Изменения останутся только до
          перезагрузки страницы.
        </p>
      )}
      {activeId && !meeting ? (
        <div className="meeting-empty">
          <LuCalendar />
          <h1>Встреча недоступна в этом браузере</h1>
          <p>
            Демоссылки открывают только локально сохранённые встречи. Настоящие
            приглашения появятся после подключения сервиса.
          </p>
          <button className="meeting-button" onClick={() => select()}>
            <LuArrowLeft />К списку встреч
          </button>
        </div>
      ) : meeting ? (
        <MeetingSession
          key={meeting.id}
          meeting={meeting}
          people={people}
          initialLobby={quickMeetingId === meeting.id}
          onBack={() => select()}
          onUpdate={(patch) => update(meeting.id, patch)}
        />
      ) : (
        <>
          <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-fog">
                Командная работа
              </p>
              <h1 className="font-display text-3xl font-bold text-snow">
                Встречи
              </h1>
              <p className="mt-3 text-sm text-fog">
                Соберите команду. Обсудите главное. Договоритесь о следующем
                шаге.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={quick} className="meeting-button">
                <LuVideo />
                Быстрый звонок
              </button>
              <button
                onClick={() => setEditor(true)}
                className="meeting-button primary"
              >
                <LuPlus />
                Создать встречу
              </button>
            </div>
          </header>
          {nextMeeting && (
            <section className="meeting-next">
              <div>
                <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-flux">
                  <span className="h-1.5 w-1.5 rounded-full bg-flux" />
                  {nextMeeting.status === 'live'
                    ? 'Можно вернуться'
                    : 'Ближайшая встреча'}
                </span>
                <h2 className="font-display text-xl font-semibold leading-relaxed text-snow md:text-2xl break-words">
                  {nextMeeting.title}
                </h2>
                <p className="mt-3 text-sm text-fog">
                  {
                    meetingDepartments.find(
                      (d) => d.id === nextMeeting.departmentId,
                    )?.name
                  }{' '}
                  · {nextMeeting.duration} минут
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="meeting-avatar-stack flex">
                    {nextMeeting.participants.slice(0, 4).map((p) => (
                      <Avatar
                        key={p.personId}
                        name={
                          people.find((person) => person.id === p.personId)
                            ?.name || 'Участник'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-fog">
                    Участники демовстречи
                  </span>
                </div>
              </div>
              <div className="meeting-next-time">
                <p className="font-mono text-sm text-fog">
                  {formatMeetingDate(nextMeeting.startsAt)}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold text-snow">
                  {formatMeetingTime(nextMeeting.startsAt)}
                </p>
                <button
                  onClick={() => select(nextMeeting.id)}
                  className="meeting-button primary mt-6"
                >
                  Открыть встречу
                  <LuArrowUpRight />
                </button>
              </div>
            </section>
          )}
          <div className="my-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1" aria-label="Фильтр встреч">
              {[
                ['all', 'Все'],
                ['scheduled', 'Предстоящие'],
                ['live', 'В эфире'],
                ['completed', 'Завершённые'],
                ['cancelled', 'Отменённые'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={'meeting-tab ' + (filter === id ? 'active' : '')}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id as typeof filter)}
                >
                  {label}
                  <span>
                    {id === 'all'
                      ? meetings.length
                      : meetings.filter((m) => m.status === id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
            <label className="meeting-search">
              <LuSearch />
              <input
                aria-label="Поиск встреч"
                placeholder="Поиск по названию"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="meeting-select"
              aria-label="Фильтр по департаменту"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Все департаменты</option>
              {meetingDepartments.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          {filtered.length ? (
            <div className="meeting-panel overflow-hidden">
              {filtered.map((item) => (
                <MeetingCard
                  key={item.id}
                  meeting={item}
                  people={people}
                  onClick={() => select(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="meeting-empty">
              <LuCalendar />
              <h2>Встреч не найдено</h2>
              <p>Измените фильтры или запланируйте новую встречу.</p>
              <button
                className="meeting-button"
                onClick={() => {
                  setQuery('');
                  setDepartment('');
                  setFilter('all');
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
          <p className="mt-5 text-xs text-fog">
            Время указано по часовому поясу устройства:{' '}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}. Данные сохранены
            только в этом браузере.
          </p>
        </>
      )}
      {editor && !activeId && (
        <NewMeetingModal
          people={people}
          onClose={() => setEditor(false)}
          onSubmit={create}
        />
      )}
    </div>
  );
}
