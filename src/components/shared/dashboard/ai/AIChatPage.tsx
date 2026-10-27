import { useEffect, useRef, useState } from "react";
import {
  LuBot,
  LuChevronDown,
  LuFileText,
  LuPaperclip,
  LuSend,
  LuSparkles,
  LuX,
  LuBuilding2,
  LuTarget,
  LuListTodo,
  LuCalendarDays,
  LuDatabase,
  LuClock3,
} from "react-icons/lu";
import { Starfield } from "../../../ui/Ambient";
import { useAuthStore } from "@/store/auth.store";
import { useLaunchStore } from "@/store/launch.store";
import {
  COO_FORMATS,
  COO_MAX_MESSAGE_LENGTH,
  useAiCoo,
} from "@/hooks/useAiCoo";
import type { AiCooMessage, AiCooState } from "@/types/ai-coo.types";

const QUICK_PROMPTS = [
  {
    title: "Найти проблемы",
    description: "Что сейчас больше всего тормозит компанию?",
    icon: LuSparkles,
  },
  {
    title: "Анализ показателей",
    description: "Проанализируй текущие показатели",
    icon: LuTarget,
  },
  {
    title: "План совещаний",
    description:
      "Подготовь повестку еженедельного совещания по текущим задачам",
    icon: LuCalendarDays,
  },
  {
    title: "Письмо команде",
    description: "Напиши письмо команде о текущих целях и приоритетах",
    icon: LuFileText,
  },
];

const date = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", { timeZone: "UTC" });
const time = (value: string) =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
const panel = "rounded-xl border border-line/50 bg-hull/25 p-3.5";

export default function AIChatPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const workspaceId = useLaunchStore((s) => s.workspace?.id);
  const loadedFor = useLaunchStore((s) => s.loadedFor);
  if (!userId || !workspaceId || loadedFor !== userId)
    return <p className="p-6 text-fog">Загружаем компанию…</p>;
  return (
    <WorkspaceChat key={`${userId}:${workspaceId}`} workspaceId={workspaceId} />
  );
}

function WorkspaceChat({ workspaceId }: { workspaceId: string }) {
  const [departmentId, setDepartmentId] = useState("");
  return (
    <Conversation
      key={departmentId}
      workspaceId={workspaceId}
      departmentId={departmentId}
      selectScope={setDepartmentId}
    />
  );
}

function Conversation({
  workspaceId,
  departmentId,
  selectScope,
}: {
  workspaceId: string;
  departmentId: string;
  selectScope: (id: string) => void;
}) {
  const chat = useAiCoo(workspaceId, departmentId);
  const [inputValue, setInputValue] = useState("");
  const [isContextOpen, setIsContextOpen] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const retry = useRef<{ text: string; requestId: string } | null>(null);
  const data = chat.data;
  const documents = data?.documents ?? [];
  const messages = data?.messages ?? [];
  const visibleMessages = chat.pendingMessage
    ? [
        ...messages.filter(
          (m) => m.requestId !== chat.pendingMessage?.requestId,
        ),
        chat.pendingMessage,
      ]
    : messages;
  const hasConversation = visibleMessages.length > 0;
  const canSend =
    Boolean(data) &&
    !chat.loading &&
    !chat.busy &&
    Boolean(inputValue.trim() || documents.length);

  useEffect(() => {
    const scroller = messagesScrollRef.current;
    scroller?.scrollTo({
      top: scroller.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, chat.pendingMessage, chat.operation]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    const completed =
      retry.current &&
      messages.some(
        (m) =>
          m.requestId === retry.current?.requestId && m.status === "complete",
      );
    if (completed && inputValue.trim() === retry.current?.text) {
      retry.current = null;
      setInputValue("");
    }
  }, [messages, inputValue]);

  useEffect(() => {
    if (!isContextOpen) return;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsContextOpen(false);
        event.preventDefault();
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ];
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      contextButtonRef.current?.focus();
    };
  }, [isContextOpen]);

  function editDraft(value: string) {
    if (retry.current?.text !== value.trim()) retry.current = null;
    setInputValue(value);
  }

  async function send() {
    if (!canSend) return;
    const text = inputValue.trim() || "Проанализируй загруженные документы.";
    const request =
      retry.current?.text === text
        ? retry.current
        : { text, requestId: crypto.randomUUID() };
    retry.current = request;
    setInputValue(text);
    if (await chat.send(text, request.requestId)) {
      retry.current = null;
      setInputValue("");
    }
  }

  function retryMessage(message: AiCooMessage) {
    if (!message.requestId || chat.busy) return;
    retry.current = { text: message.content, requestId: message.requestId };
    setInputValue(message.content);
    textareaRef.current?.focus();
  }

  function chooseFiles() {
    if (data && !chat.loading && !chat.busy) fileInputRef.current?.click();
  }
  const company = data?.context.company.name || "Моя компания";
  const goalCount = data
    ? Number(Boolean(data.context.company.goal)) +
      data.context.company.priorities.length
    : 0;
  const assistantPending = chat.pendingMessage || chat.hasPending;

  return (
    <div className="relative flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col bg-void font-body text-mist md:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-4rem)]">
      <Starfield />
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.09), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)",
        }}
      />
      <div className="noise-overlay" />
      <header className="header-solid relative z-40 shrink-0 border-b border-line/40">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
              <LuBot className="h-4 w-4 text-ion" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[13px] font-bold tracking-[0.08em] text-snow sm:tracking-[0.12em]">
                ИИ-операционный директор
              </h1>
              <p className="mono-label truncate text-[8px] text-fog/45 sm:text-[9px]">
                Операционная аналитика
              </p>
            </div>
          </div>
          <button
            ref={contextButtonRef}
            onClick={() => setIsContextOpen(true)}
            disabled={!data}
            aria-label="Открыть контекст"
            aria-expanded={isContextOpen}
            aria-controls="ai-coo-context"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line/60 bg-hull/25 px-2.5 py-1.5 text-[10px] text-fog/75 transition-colors hover:border-flux/40 hover:text-flux disabled:opacity-40"
          >
            <LuDatabase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Контекст</span>
            <LuChevronDown className="h-3 w-3" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col px-2 py-2 sm:px-4 sm:py-4 lg:px-6">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line/50 bg-hull/15 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)]">
          <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line/40 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-fog/60">
              <LuBuilding2 className="h-3.5 w-3.5 shrink-0 text-ion/70" />
              <span className="max-w-[220px] truncate font-medium text-mist/80">
                {data ? company : "Контекст компании"}
              </span>
            </div>
            {data && (
              <>
                <label className="flex min-w-0 items-center gap-2 text-[10px] text-fog/60">
                  <span className="sr-only">Область анализа</span>
                  <select
                    aria-label="Область анализа"
                    value={data.scope.departmentId ?? ""}
                    onChange={(e) => selectScope(e.target.value)}
                    className="max-w-[220px] rounded border border-line/60 bg-void px-2 py-1 text-mist outline-none focus:border-flux/50"
                  >
                    {data.scopes.map((scope) => (
                      <option key={scope.id} value={scope.id}>
                        {scope.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="flex items-center gap-1.5 text-[9px] text-fog/50">
                  <LuListTodo className="h-3 w-3" />
                  Задач за неделю: {data.context.tasks.total}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-fog/50">
                  <LuFileText className="h-3 w-3" />
                  Документов: {documents.length}
                </span>
                {data.scope.personal && (
                  <span className="text-[9px] text-fog/50">
                    Только доступные вам задачи
                  </span>
                )}
              </>
            )}
          </div>

          {chat.loading && !data ? (
            <p role="status" className="p-8 text-center text-sm text-fog">
              Загружаем диалог и контекст…
            </p>
          ) : !data ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-crit">
                {chat.error || "Не удалось загрузить диалог."}
              </p>
              <button
                onClick={() => void chat.load()}
                className="mt-4 text-sm text-flux"
              >
                Повторить загрузку
              </button>
            </div>
          ) : (
            <section
              className="relative min-h-0 flex-1 overflow-hidden"
              aria-label="Диалог с ИИ"
            >
              <div
                ref={messagesScrollRef}
                className="h-full overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-8 lg:px-10"
              >
                {!hasConversation ? (
                  <div className="flex min-h-full items-center justify-center">
                    <div className="w-full max-w-3xl">
                      <div className="mb-8 text-center sm:mb-10">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-ion/30 bg-ion/10 shadow-[0_0_40px_-15px_rgba(56,189,248,0.7)]">
                          <LuSparkles className="h-6 w-6 text-ion" />
                        </div>
                        <p className="mono-label mb-2 text-[9px] uppercase tracking-[0.22em] text-flux/70">
                          Операционная аналитика
                        </p>
                        <h2 className="font-display text-2xl font-bold tracking-tight text-snow sm:text-3xl">
                          Чем займёмся сегодня?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-[12px] leading-relaxed text-fog/55 sm:text-[13px]">
                          Обсудим задачи за последнюю неделю, рекомендации
                          дашборда и ваши документы. Помогу разобраться в
                          текущих делах и подготовить следующие шаги.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        {QUICK_PROMPTS.map(
                          ({ title, description, icon: Icon }) => (
                            <button
                              key={title}
                              onClick={() => {
                                editDraft(description);
                                textareaRef.current?.focus();
                              }}
                              disabled={chat.busy}
                              className="group rounded-xl border border-line/50 bg-hull/25 p-3.5 text-left transition-all duration-200 hover:border-flux/35 hover:bg-hull/40 disabled:opacity-40 sm:p-4"
                            >
                              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-line/50 bg-hull/40 text-fog/60 transition-colors group-hover:border-flux/30 group-hover:text-flux">
                                <Icon className="h-4 w-4" />
                              </div>
                              <p className="text-[11px] font-semibold text-mist">
                                {title}
                              </p>
                              <p className="mt-1 text-[10px] leading-relaxed text-fog/45">
                                {description}
                              </p>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mx-auto w-full max-w-4xl space-y-6"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                  >
                    {visibleMessages.map((message) => (
                      <Message
                        key={message.id}
                        message={message}
                        retry={() => retryMessage(message)}
                        busy={chat.busy}
                      />
                    ))}
                    {assistantPending && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ion/40 bg-ion/10">
                          <LuBot className="h-4 w-4 text-ion" />
                        </div>
                        <p
                          role="status"
                          className="rounded-xl border border-line/50 bg-hull/30 px-4 py-3 text-[11px] text-fog/60"
                        >
                          Анализирую данные… Ответ появится в этом диалоге.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="shrink-0 border-t border-line/40 bg-void/20 p-2.5 sm:p-3">
            <div className="mx-auto w-full max-w-4xl">
              {data && chat.error && (
                <p
                  role="alert"
                  className="mb-3 whitespace-pre-wrap break-words text-[12px] text-crit"
                >
                  {chat.error}
                </p>
              )}
              {chat.operation && !chat.pendingMessage && (
                <p
                  role="status"
                  className="mb-3 break-words text-[11px] text-flux"
                >
                  {chat.operation}
                </p>
              )}
              {documents.length > 0 && (
                <div className="mb-2.5 flex gap-2 overflow-x-auto scrollbar-none">
                  {documents.map((file) => (
                    <div
                      key={file.id}
                      className="flex max-w-[240px] shrink-0 items-center gap-2 rounded-lg border border-flux/25 bg-flux/5 px-2.5 py-1.5"
                    >
                      <LuFileText className="h-3 w-3 shrink-0 text-flux" />
                      <span
                        className="truncate text-[9px] text-mist"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <button
                        onClick={() => void chat.remove(file.id)}
                        disabled={chat.busy || chat.loading}
                        className="shrink-0 text-fog/40 hover:text-crit disabled:opacity-30"
                        aria-label={`Удалить ${file.name}`}
                      >
                        <LuX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-xl border border-line/60 bg-hull/30 p-1.5 transition-colors focus-within:border-flux/30">
                <button
                  onClick={chooseFiles}
                  disabled={
                    !data || chat.busy || chat.loading || documents.length >= 5
                  }
                  title="Прикрепить файл"
                  aria-label="Прикрепить файл"
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fog/60 transition-colors hover:bg-hull/60 hover:text-flux disabled:opacity-30"
                >
                  <LuPaperclip className="h-4 w-4" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => editDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Задайте вопрос ИИ-операционному директору…"
                  aria-label="Сообщение ИИ"
                  rows={1}
                  maxLength={COO_MAX_MESSAGE_LENGTH}
                  disabled={!data || chat.loading || Boolean(chat.operation)}
                  className="min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[12px] leading-5 text-mist outline-none placeholder:text-fog/35 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                />
                <button
                  onClick={() => void send()}
                  disabled={!canSend}
                  aria-label="Отправить сообщение"
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flux text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] transition-all duration-200 hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <LuSend className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
                <p className="text-[8px] text-fog/40">
                  {COO_FORMATS.join(" · ")} · до 10 МБ · до 5 файлов
                </p>
                <p className="text-[8px] text-fog/40">
                  {inputValue.length}/{COO_MAX_MESSAGE_LENGTH}
                  <span className="hidden sm:inline"> · Enter — отправить</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="mono-label hidden pt-3 text-center text-[8px] text-fog/25 sm:block">
          ИИ-операционный директор · рабочее пространство операционной аналитики
        </p>
      </main>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.pptx"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void chat.upload(files);
        }}
      />

      {isContextOpen && data && (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            onClick={() => setIsContextOpen(false)}
            aria-label="Закрыть контекст"
            tabIndex={-1}
          />
          <aside
            ref={dialogRef}
            id="ai-coo-context"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-coo-context-title"
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line/60 bg-[#060b18] shadow-2xl sm:w-[360px]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line/50 px-4">
              <div>
                <h2
                  id="ai-coo-context-title"
                  className="font-display text-[11px] font-bold tracking-[0.16em] text-snow"
                >
                  КОНТЕКСТ
                </h2>
                <p className="mt-0.5 text-[9px] text-fog/40">
                  {data.scope.name}
                  {data.scope.personal ? " · ваши задачи" : ""}
                </p>
              </div>
              <button
                onClick={() => setIsContextOpen(false)}
                aria-label="Закрыть"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line/50 text-fog/60 hover:text-mist"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <ContextSection title="Компания">
                <div className={panel}>
                  <div className="flex items-center gap-3">
                    <LuBuilding2 className="h-5 w-5 shrink-0 text-ion" />
                    <div className="min-w-0">
                      <p className="break-words text-[11px] font-semibold text-mist">
                        {company}
                      </p>
                      {data.context.company.industry && (
                        <p className="mt-1 text-[10px] text-fog/50">
                          {data.context.company.industry}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ContextSection>
              <ContextSection title="Последняя неделя">
                <p className="mb-2 text-[10px] text-fog/60">
                  {date(data.context.periodStart)} —{" "}
                  {date(data.context.periodEnd)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Активных задач",
                      value: data.context.tasks.active,
                      icon: LuListTodo,
                    },
                    {
                      label: "Просрочено",
                      value: data.context.tasks.overdue,
                      icon: LuClock3,
                    },
                    {
                      label: "Выполнено",
                      value: data.context.tasks.completed,
                      icon: LuListTodo,
                    },
                    {
                      label: "Цель и приоритеты",
                      value: goalCount,
                      icon: LuTarget,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-line/50 bg-hull/20 p-3"
                    >
                      <Icon className="mb-2 h-3.5 w-3.5 text-fog/45" />
                      <p className="text-lg font-semibold text-snow">{value}</p>
                      <p className="text-[8px] uppercase tracking-[0.1em] text-fog/50">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                {data.context.tasks.included < data.context.tasks.total && (
                  <p className="mt-2 text-[10px] text-fog/60">
                    В подробный контекст включено {data.context.tasks.included}{" "}
                    из {data.context.tasks.total} задач. Общие счётчики
                    учитывают все доступные задачи периода.
                  </p>
                )}
              </ContextSection>
              {data.context.company.goal && (
                <ContextSection title="Цель">
                  <p
                    className={`${panel} break-words text-[11px] leading-relaxed`}
                  >
                    {data.context.company.goal}
                  </p>
                  {data.context.company.priorities.map((priority, i) => (
                    <p
                      key={i}
                      className="mt-2 break-words text-[10px] text-fog/60"
                    >
                      {i + 1}. {priority}
                    </p>
                  ))}
                </ContextSection>
              )}
              <ContextSection title="AI-сводка дашборда">
                <DashboardContext dashboard={data.context.dashboard} />
              </ContextSection>
              <ContextSection title="Документы диалога">
                <p className="mb-2 text-[10px] leading-relaxed text-fog/50">
                  Эти документы используются в ответах этого диалога. Загружайте
                  файлы с доступным для чтения текстом.
                </p>
                {!documents.length ? (
                  <p className="text-[11px] text-fog/50">
                    Документы ещё не добавлены.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 rounded-lg border border-line/40 bg-hull/15 p-3"
                      >
                        <LuFileText className="h-4 w-4 shrink-0 text-flux" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px]" title={file.name}>
                            {file.name}
                          </p>
                          <p className="mt-1 text-[9px] text-fog/40">
                            {(file.size / 1024 / 1024).toFixed(1)} МБ
                          </p>
                        </div>
                        <button
                          onClick={() => void chat.remove(file.id)}
                          disabled={chat.busy}
                          aria-label={`Удалить документ ${file.name}`}
                          className="text-fog/40 hover:text-crit disabled:opacity-30"
                        >
                          <LuX className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ContextSection>
            </div>
            <div className="shrink-0 border-t border-line/50 p-4">
              {chat.operation && (
                <p
                  role="status"
                  className="mb-3 break-words text-[10px] text-flux"
                >
                  {chat.operation}
                </p>
              )}
              {chat.error && (
                <p
                  role="alert"
                  className="mb-3 break-words text-[10px] text-crit"
                >
                  {chat.error}
                </p>
              )}
              <button
                onClick={chooseFiles}
                disabled={chat.busy || documents.length >= 5}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line/60 bg-hull/25 px-3 py-2.5 text-[10px] font-medium text-mist hover:border-flux/40 hover:text-flux disabled:opacity-40"
              >
                <LuPaperclip className="h-3.5 w-3.5" />
                Добавить документ
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Message({
  message,
  retry,
  busy,
}: {
  message: AiCooMessage;
  retry: () => void;
  busy: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex gap-2.5 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ion/40 bg-ion/10 sm:h-8 sm:w-8">
          <LuBot className="h-4 w-4 text-ion" />
        </div>
      )}
      <div
        className={`min-w-0 ${isUser ? "max-w-[88%] sm:max-w-[75%]" : "max-w-[92%] sm:max-w-[82%]"}`}
      >
        {!isUser && (
          <p className="mb-1.5 font-display text-[9px] font-bold tracking-[0.12em] text-ion">
            ИИ-операционный директор
          </p>
        )}
        <div
          className={`rounded-xl border px-3.5 py-3 sm:px-4 ${isUser ? "border-flux/25 bg-flux/10" : "border-line/50 bg-hull/30"}`}
        >
          <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-mist sm:text-[13px]">
            {isUser ? message.content : renderAssistantText(message.content)}
          </p>
          {Boolean(message.documents?.length) && (
            <div className="mt-3 space-y-1.5">
              {message.documents?.map((file) => (
                <div
                  key={file.id}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-line/30 bg-void/20 px-2.5 py-2 text-[10px] text-fog/70"
                >
                  <LuFileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          {message.status === "failed" && (
            <div className="mt-3 text-[10px] text-crit">
              Ответ не получен.
              {message.requestId && (
                <button
                  onClick={retry}
                  disabled={busy}
                  className="ml-2 text-flux underline disabled:opacity-40"
                >
                  Повторить запрос
                </button>
              )}
            </div>
          )}
        </div>
        <p
          className={`mt-1.5 text-[8px] text-fog/40 ${isUser ? "text-right" : ""}`}
        >
          {time(message.createdAt)}
        </p>
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-flux to-ion sm:h-8 sm:w-8">
          <span className="text-[10px] font-bold text-void">Вы</span>
        </div>
      )}
    </div>
  );
}

function renderAssistantText(content: string) {
  const parts: React.ReactNode[] = [];
  const inline = /(?<![\\`])`([^`\n]+)`(?!`)|(?<![\\*])\*\*([^*\n]+)\*\*(?!\*)|(?<![\\*])\*([^*\n]+)\*(?!\*)/g;
  let from = 0;
  for (const match of content.matchAll(inline)) {
    const index = match.index!;
    parts.push(content.slice(from, index));
    if (match[1] !== undefined) {
      parts.push(
        <code key={index} className="rounded bg-void/40 px-1 font-mono text-[0.95em]">
          {match[1]}
        </code>,
      );
    } else if (match[2] !== undefined) {
      parts.push(<strong key={index}>{match[2]}</strong>);
    } else {
      parts.push(<em key={index}>{match[3]}</em>);
    }
    from = index + match[0].length;
  }
  parts.push(content.slice(from));
  return parts;
}

function ContextSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mono-label mb-2 text-[8px] uppercase tracking-[0.16em] text-fog/50">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DashboardContext({
  dashboard,
}: {
  dashboard: AiCooState["context"]["dashboard"];
}) {
  const status =
    dashboard.status === "restricted"
      ? "Общая AI-сводка недоступна для вашей роли."
      : dashboard.status === "unavailable"
        ? "AI-сводка пока не готова. Чат использует доступные задачи и документы."
        : dashboard.status === "stale"
          ? "Сводка ожидает обновления. В ответе учитывается дата её расчёта."
          : "AI-сводка доступна.";
  return (
    <div className={panel}>
      <p className="text-[11px] text-mist">{status}</p>
      {dashboard.generatedAt && (
        <p className="mt-2 text-[9px] text-fog/50">
          Рассчитана: {new Date(dashboard.generatedAt).toLocaleString("ru-RU")}
        </p>
      )}
      {dashboard.analysis && (
        <>
          <p className="mt-3 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-fog/70">
            {dashboard.analysis.recommendation}
          </p>
          {dashboard.analysis.risks.map((risk, index) => (
            <p
              key={index}
              className={`mt-2 break-words text-[10px] ${risk.tone === "crit" ? "text-crit" : "text-warn"}`}
            >
              {risk.text}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
