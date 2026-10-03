import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  LuCheck,
  LuChevronLeft,
  LuCopy,
  LuHand,
  LuLock,
  LuMaximize,
  LuMessageSquare,
  LuMic,
  LuMicOff,
  LuMonitor,
  LuPhoneOff,
  LuSend,
  LuSettings,
  LuShieldCheck,
  LuUsers,
  LuVideo,
  LuVideoOff,
  LuX,
  LuCircle,
} from 'react-icons/lu';
import type {
  Meeting,
  MeetingPerson,
  MeetingRole,
} from '@/types/meetings.types';
import { MEETING_ROLES } from '@/types/meetings.types';
import { meetingDepartments } from '@/data/meetings/prototypeData';
import { Avatar, MeetingDialog } from './MeetingUI';
import type { JoinSettings } from './MeetingLobby';

interface RoomPerson {
  id: string;
  role: MeetingRole;
  mic: boolean;
  camera: boolean;
  waiting: boolean;
  hand: boolean;
}
type Panel = 'people' | 'chat' | 'settings' | null;
export default function MeetingRoom({
  meeting,
  people,
  settings,
  onLeave,
  onEnd,
  onRoles,
}: {
  meeting: Meeting;
  people: MeetingPerson[];
  settings: JoinSettings;
  onLeave: () => void;
  onEnd: () => void;
  onRoles: (participants: Meeting['participants']) => void;
}) {
  const [members, setMembers] = useState<RoomPerson[]>(() =>
    meeting.participants.map((p, i) => ({
      id: p.personId,
      role: p.role,
      mic:
        p.personId === settings.personId ? settings.mic : !meeting.muteOnEntry,
      camera: p.personId === settings.personId ? settings.camera : i % 2 === 1,
      hand: false,
      waiting:
        meeting.waitingRoom &&
        p.personId !== settings.personId &&
        p.role === 'participant' &&
        i === meeting.participants.length - 1,
    })),
  );
  const [panel, setPanel] = useState<Panel>('people');
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [locked, setLocked] = useState(false);
  const [allowShare, setAllowShare] = useState(meeting.allowScreenShare);
  const [showLeave, setShowLeave] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<
    Array<{ id: string; personId: string; text: string; at: string }>
  >([]);
  const [now, setNow] = useState(Date.now());
  const chatEnd = useRef<HTMLDivElement>(null);
  const room = useRef<HTMLElement>(null);
  const self = members.find((p) => p.id === settings.personId)!;
  const host = self.role === 'host';
  const moderator = host || self.role === 'cohost';
  const admitted = members.filter((p) => !p.waiting);
  const waiting = members.filter((p) => p.waiting);
  const byId = (id: string) =>
    people.find((p) => p.id === id)?.name || 'Участник';
  const elapsed = Math.max(
    0,
    Math.floor(
      (now - Date.parse(meeting.startedAt || meeting.startsAt)) / 1000,
    ),
  );
  const elapsedLabel =
    Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0') +
    ':' +
    (elapsed % 60).toString().padStart(2, '0');
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (panel === 'chat') chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, panel]);
  useEffect(() => {
    room.current?.focus();
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  function change(id: string, patch: Partial<RoomPerson>) {
    setMembers((current) =>
      current.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }
  function togglePanel(next: Panel) {
    setPanel((current) => (current === next ? null : next));
  }
  function roleChange(id: string, role: 'participant' | 'cohost') {
    if (!host) return;
    change(id, { role });
    onRoles(
      meeting.participants.map((p) => (p.personId === id ? { ...p, role } : p)),
    );
    setNotice(byId(id) + ': ' + MEETING_ROLES[role].toLowerCase() + '.');
  }
  function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        personId: self.id,
        text: draft.trim(),
        at: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setDraft('');
  }
  async function copy() {
    const url = new URL(window.location.href);
    url.searchParams.set('meeting', meeting.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice('Демоссылка скопирована. Работает только в этом браузере.');
    } catch {
      setNotice('Копирование недоступно. Ссылка есть в карточке встречи.');
    }
  }
  return (
    <section
      ref={room}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Комната встречи"
      className="meeting-room"
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          event.defaultPrevented ||
          showLeave ||
          removeId
        )
          return;
        const controls = Array.from(
          room.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        if (
          event.shiftKey &&
          (document.activeElement === controls[0] ||
            document.activeElement === room.current)
        ) {
          event.preventDefault();
          controls[controls.length - 1]?.focus();
        }
        if (
          !event.shiftKey &&
          document.activeElement === controls[controls.length - 1]
        ) {
          event.preventDefault();
          controls[0]?.focus();
        }
      }}
    >
      <header className="meeting-room-header">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-ok">● Демо-комната</span>
            <span className="font-mono text-fog">{elapsedLabel}</span>
            {recording && <span className="text-crit">● Запись · демо</span>}
            {locked && (
              <span className="flex items-center gap-1 text-warn">
                <LuLock />
                Вход закрыт
              </span>
            )}
          </div>
          <h1 className="truncate text-lg font-semibold text-snow">
            {meeting.title}
          </h1>
          <p className="mt-1 text-xs text-fog">
            {
              meetingDepartments.find((d) => d.id === meeting.departmentId)
                ?.name
            }
          </p>
        </div>
        <button
          className="meeting-button shrink-0"
          onClick={copy}
          aria-label="Скопировать демоссылку"
        >
          <LuCopy />
          <span className="hidden sm:inline">Ссылка</span>
        </button>
      </header>
      <div className={'meeting-room-body ' + (panel ? 'has-panel' : '')}>
        <div className="meeting-stage">
          {sharing ? (
            <div className="meeting-shared-screen">
              <div className="flex items-center justify-between gap-3 border-b border-line p-4 text-xs text-fog">
                <span className="flex items-center gap-2">
                  <LuMonitor />
                  Демонстрация экрана · демо
                </span>
                <button onClick={() => setSharing(false)} className="text-crit">
                  Остановить
                </button>
              </div>
              <div className="p-6 md:p-10">
                <p className="mb-4 text-xs uppercase tracking-widest text-flux">
                  Повестка встречи
                </p>
                <h2 className="font-display text-xl leading-relaxed text-snow">
                  {meeting.title}
                </h2>
                <ol className="mt-8 space-y-5">
                  {(meeting.agenda || 'Обсудить текущие вопросы команды')
                    .split('\n')
                    .filter(Boolean)
                    .map((line, i) => (
                      <li className="flex gap-4 text-sm leading-6" key={i}>
                        <span className="text-flux">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {line}
                      </li>
                    ))}
                </ol>
              </div>
            </div>
          ) : (
            <div
              className={'meeting-video-grid ' + (spotlight ? 'spotlight' : '')}
            >
              {admitted
                .filter((p) => !spotlight || spotlight === p.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className={
                      'meeting-video-tile ' + (p.camera ? 'camera-on' : '')
                    }
                  >
                    <span className="absolute left-4 top-4 text-[10px] uppercase tracking-widest text-fog">
                      {p.camera ? 'Видео · демо' : 'Камера выключена'}
                    </span>
                    <button
                      className="absolute right-3 top-3 rounded-md p-2 text-fog hover:bg-hull"
                      aria-label={
                        (spotlight ? 'Открепить: ' : 'Закрепить: ') + byId(p.id)
                      }
                      onClick={() => setSpotlight(spotlight ? null : p.id)}
                    >
                      <LuMaximize />
                    </button>
                    <Avatar name={byId(p.id)} large />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-snow">
                          {byId(p.id)}
                          {p.id === self.id ? ' (вы)' : ''}
                        </p>
                        <p className="mt-1 text-xs text-fog">
                          {MEETING_ROLES[p.role]}
                        </p>
                      </div>
                      <span className="flex items-center gap-2">
                        {p.hand && <LuHand className="text-warn" />}
                        {p.mic ? (
                          <LuMic className="text-ok" />
                        ) : (
                          <LuMicOff className="text-fog" />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap justify-between gap-3 px-1 text-xs text-fog">
            <span>Участников в комнате: {admitted.length}</span>
            <span>Аудио и видео не передаются</span>
          </div>
          <p role="status" className="min-h-6 px-1 pt-2 text-xs text-flux">
            {notice}
          </p>
        </div>
        {panel && (
          <aside className="meeting-room-panel">
            <div className="flex items-center justify-between border-b border-line p-4">
              <h2 className="font-semibold text-snow">
                {panel === 'people'
                  ? 'Участники'
                  : panel === 'chat'
                    ? 'Чат встречи'
                    : 'Настройки встречи'}
              </h2>
              <button
                className="meeting-icon-button"
                aria-label="Закрыть боковую панель"
                onClick={() => setPanel(null)}
              >
                <LuX />
              </button>
            </div>
            {panel === 'people' && (
              <div className="meeting-panel-scroll">
                {waiting.length > 0 && (
                  <section className="mb-5 rounded-lg border border-warn/30 bg-warn/5 p-3">
                    <h3 className="mb-3 text-xs font-semibold text-warn">
                      В зале ожидания · {waiting.length}
                    </h3>
                    {waiting.map((p) => (
                      <div key={p.id} className="mb-3 text-sm">
                        <p>{byId(p.id)}</p>
                        {moderator ? (
                          <div className="mt-2 flex gap-2">
                            <button
                              className="meeting-small-button"
                              onClick={() => {
                                if (!moderator) return;
                                change(p.id, { waiting: false });
                                setNotice(byId(p.id) + ' допущен во встречу.');
                              }}
                            >
                              <LuCheck />
                              Допустить
                            </button>
                            <button
                              className="meeting-small-button"
                              onClick={() => setRemoveId(p.id)}
                            >
                              Отклонить
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-fog">
                            Ожидает организатора
                          </p>
                        )}
                      </div>
                    ))}
                  </section>
                )}
                {moderator && (
                  <button
                    className="meeting-small-button mb-4 w-full"
                    onClick={() => {
                      if (moderator) {
                        setMembers((current) =>
                          current.map((p) =>
                            p.id === self.id ? p : { ...p, mic: false },
                          ),
                        );
                        setNotice('Микрофоны остальных участников выключены.');
                      }
                    }}
                  >
                    <LuMicOff />
                    Выключить всем микрофоны
                  </button>
                )}
                <div className="space-y-4">
                  {admitted.map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center gap-2">
                        <Avatar name={byId(p.id)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-snow">
                            {byId(p.id)}
                            {p.id === self.id ? ' (вы)' : ''}
                          </p>
                          <p className="mt-1 text-[11px] text-fog">
                            {MEETING_ROLES[p.role]}
                          </p>
                        </div>
                        {p.hand && <LuHand className="text-warn" />}
                        {p.mic ? (
                          <LuMic className="text-ok" />
                        ) : (
                          <LuMicOff className="text-fog" />
                        )}
                      </div>
                      {moderator &&
                        p.id !== self.id &&
                        p.role !== 'host' &&
                        (host || p.role === 'participant') && (
                          <div className="mt-2 flex flex-wrap gap-2 pl-10">
                            {p.mic && (
                              <button
                                className="meeting-text-button"
                                onClick={() => change(p.id, { mic: false })}
                              >
                                Выключить звук
                              </button>
                            )}
                            {host && (
                              <button
                                className="meeting-text-button"
                                onClick={() =>
                                  roleChange(
                                    p.id,
                                    p.role === 'cohost'
                                      ? 'participant'
                                      : 'cohost',
                                  )
                                }
                              >
                                {p.role === 'cohost'
                                  ? 'Снять роль соорганизатора'
                                  : 'Сделать соорганизатором'}
                              </button>
                            )}
                            <button
                              className="meeting-text-button text-crit"
                              aria-label={'Удалить: ' + byId(p.id)}
                              onClick={() => setRemoveId(p.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
                <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-fog">
                  Микрофон участник включает сам. Организатор управляет ролями,
                  соорганизатор помогает с участниками.
                </p>
              </div>
            )}
            {panel === 'chat' && (
              <>
                <div className="meeting-panel-scroll space-y-4">
                  <p className="text-xs leading-5 text-fog">
                    Сообщения видны только вам в этой демосессии и не
                    отправляются другим людям.
                  </p>
                  {messages.length === 0 && (
                    <div className="py-12 text-center text-fog">
                      <LuMessageSquare className="mx-auto mb-3 h-7 w-7" />
                      <p className="text-sm">Начните обсуждение</p>
                      <p className="mt-2 text-xs">
                        Или зафиксируйте важную мысль
                      </p>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg border border-line bg-hull p-3"
                    >
                      <p className="flex justify-between gap-2 text-[10px] text-fog">
                        <span>{byId(message.personId)}</span>
                        <time>{message.at}</time>
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-mist">
                        {message.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatEnd} />
                </div>
                <form
                  onSubmit={send}
                  className="flex gap-2 border-t border-line p-3"
                >
                  <input
                    aria-label="Сообщение в чат"
                    className="meeting-input min-w-0 flex-1"
                    placeholder="Сообщение…"
                    value={draft}
                    maxLength={2000}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="meeting-control"
                    disabled={!draft.trim()}
                    aria-label="Отправить сообщение"
                  >
                    <LuSend />
                  </button>
                </form>
              </>
            )}
            {panel === 'settings' && (
              <div className="meeting-panel-scroll">
                <p className="mb-5 text-xs leading-5 text-fog">
                  Изменения действуют в текущей демонстрационной комнате.
                </p>
                <div className="meeting-settings">
                  <label>
                    <input
                      type="checkbox"
                      checked={locked}
                      disabled={!host}
                      onChange={(e) => {
                        if (host) setLocked(e.target.checked);
                      }}
                    />
                    Закрыть вход для новых участников
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={allowShare}
                      disabled={!host}
                      onChange={(e) => {
                        if (host) setAllowShare(e.target.checked);
                      }}
                    />
                    Участники могут показывать экран
                  </label>
                </div>
                {!host && (
                  <p className="mt-5 text-sm text-fog">
                    Настройки меняет организатор встречи.
                  </p>
                )}
                <div className="mt-8 rounded-lg border border-line p-4">
                  <LuShieldCheck className="mb-3 text-flux" />
                  <h3 className="text-sm text-snow">
                    {MEETING_ROLES[self.role]}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-fog">
                    Роли встречи отдельны от должностей в компании. Завершить
                    встречу для всех может только организатор.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
      <footer className="meeting-room-controls">
        <div className="flex flex-wrap justify-center gap-2">
          <Control
            label={self.mic ? 'Выключить микрофон' : 'Включить микрофон'}
            caption="Микрофон"
            active={self.mic}
            onClick={() => change(self.id, { mic: !self.mic })}
          >
            {self.mic ? <LuMic /> : <LuMicOff />}
          </Control>
          <Control
            label={self.camera ? 'Выключить камеру' : 'Включить камеру'}
            caption="Камера"
            active={self.camera}
            onClick={() => change(self.id, { camera: !self.camera })}
          >
            {self.camera ? <LuVideo /> : <LuVideoOff />}
          </Control>
          <Control
            label={sharing ? 'Остановить демонстрацию' : 'Демонстрация экрана'}
            caption="Экран"
            active={sharing}
            disabled={!moderator && !allowShare}
            onClick={() => setSharing((v) => !v)}
          >
            <LuMonitor />
          </Control>
          <Control
            label={self.hand ? 'Опустить руку' : 'Поднять руку'}
            caption="Рука"
            active={self.hand}
            onClick={() => change(self.id, { hand: !self.hand })}
          >
            <LuHand />
          </Control>
          {moderator && (
            <Control
              label={recording ? 'Остановить демозапись' : 'Начать демозапись'}
              caption="Запись"
              active={recording}
              onClick={() => {
                setRecording((v) => !v);
                setNotice(
                  recording
                    ? 'Демозапись остановлена. Файл не создаётся.'
                    : 'Показано состояние записи. Реальная запись не ведётся.',
                );
              }}
            >
              <LuCircle />
            </Control>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Control
            label="Участники"
            caption={'Люди · ' + admitted.length}
            active={panel === 'people'}
            onClick={() => togglePanel('people')}
          >
            <LuUsers />
          </Control>
          <Control
            label="Чат"
            caption="Чат"
            active={panel === 'chat'}
            onClick={() => togglePanel('chat')}
          >
            <LuMessageSquare />
          </Control>
          <Control
            label="Настройки встречи"
            caption="Настройки"
            active={panel === 'settings'}
            onClick={() => togglePanel('settings')}
          >
            <LuSettings />
          </Control>
          <button className="meeting-leave" onClick={() => setShowLeave(true)}>
            <LuPhoneOff />
            <span>Выйти</span>
          </button>
        </div>
      </footer>
      {showLeave && (
        <MeetingDialog
          title="Выйти из встречи?"
          onClose={() => setShowLeave(false)}
        >
          <p className="text-sm leading-6 text-fog">
            {host
              ? 'Вы можете выйти и вернуться позже или завершить встречу для всех участников.'
              : 'Встреча продолжится без вас. В неё можно будет вернуться.'}
          </p>
          <div className="meeting-dialog-actions">
            <button
              className="meeting-button"
              onClick={() => setShowLeave(false)}
            >
              <LuChevronLeft />
              Остаться
            </button>
            <button className="meeting-button" onClick={onLeave}>
              Выйти из встречи
            </button>
            {host && (
              <button className="meeting-button danger" onClick={onEnd}>
                Завершить для всех
              </button>
            )}
          </div>
        </MeetingDialog>
      )}
      {removeId && (
        <MeetingDialog
          title="Удалить участника?"
          onClose={() => setRemoveId(null)}
        >
          <p className="text-sm text-fog">
            {byId(removeId)} покинет демонстрационную комнату.
          </p>
          <div className="meeting-dialog-actions">
            <button
              className="meeting-button"
              onClick={() => setRemoveId(null)}
            >
              Оставить
            </button>
            <button
              className="meeting-button danger"
              onClick={() => {
                const target = members.find((p) => p.id === removeId);
                if (
                  moderator &&
                  target?.role !== 'host' &&
                  (host || target?.role === 'participant')
                ) {
                  setMembers((current) =>
                    current.filter((p) => p.id !== removeId),
                  );
                  if (spotlight === removeId) setSpotlight(null);
                  setNotice(byId(removeId) + ' удалён из комнаты.');
                }
                setRemoveId(null);
              }}
            >
              Удалить из комнаты
            </button>
          </div>
        </MeetingDialog>
      )}
    </section>
  );
}
function Control({
  label,
  caption,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  caption: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={'meeting-toolbar-button ' + (active ? 'active' : '')}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{children}</span>
      <small>{caption}</small>
    </button>
  );
}
