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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: File[];
}

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
      "Подготовь повестку еженедельного совещания… (дополните запрос исходя из контекста)",
    icon: LuCalendarDays,
  },
  {
    title: "Письмо команде",
    description: "Напиши письмо команде о новых целях",
    icon: LuFileText,
  },
];

const SUPPORTED_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX"];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Я анализирую цели, задачи, встречи, документы и показатели компании, чтобы помогать принимать операционные решения.",
  timestamp: new Date(),
};

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isContextOpen, setIsContextOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    if (!hasConversation) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, hasConversation]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputValue]);

  const resetTextareaHeight = () => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "44px";
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toUpperCase();

      return (
        extension && SUPPORTED_FORMATS.includes(extension)
      );
    });

    if (validFiles.length !== files.length) {
      alert(
        `Поддерживаемые форматы: ${SUPPORTED_FORMATS.join(", ")}`,
      );
    }

    setUploadedFiles((prev) => {
      const existing = new Set(
        prev.map(
          (file) =>
            `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const uniqueFiles = validFiles.filter(
        (file) =>
          !existing.has(
            `${file.name}-${file.size}-${file.lastModified}`,
          ),
      );

      return [...prev, ...uniqueFiles];
    });

    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  const getAIResponse = (
    text: string,
    files: File[],
  ): string => {
    const normalizedText = text.toLowerCase();

    if (files.length > 0) {
      return `Получено файлов: ${files.length}

Файлы подготовлены для анализа:

${files.map((file) => `• ${file.name}`).join("\n")}

После подключения базы знаний я смогу использовать содержимое этих документов при ответах на вопросы.`;
    }

    if (
      normalizedText.includes("тормоз") ||
      normalizedText.includes("проблем")
    ) {
      return `Анализ ситуации за последние 14 дней показывает 3 системных риска.

1. **Зависимость от собственника** — критический риск
   Влияние: 47% задач заблокированы ожиданием решения.

2. **Нет единой системы контроля** — средний риск
   Влияние: 23% задач выполняются с отклонением от сроков.

3. **Договорённости после встреч не фиксируются** — средний риск
   Влияние: 8 протоколов встреч требуют подтверждения.

Рекомендация: начать с обязательного протоколирования встреч и назначения ответственного за каждую задачу.`;
    }

    if (
      normalizedText.includes("совещ") ||
      normalizedText.includes("план")
    ) {
      return `План совещаний на неделю:

**Понедельник · 10:00**
Планёрка по операциям
• Обзор показателей за прошлую неделю
• Приоритеты текущей недели
• Блокирующие факторы

**Среда · 12:30**
Продажи
• Выполнение плана продаж
• Работа с воронкой
• Ключевые сделки

**Пятница · 15:00**
Финансовый срез
• Cash flow
• План-факт анализ
• Прогноз на следующую неделю`;
    }

    if (
      normalizedText.includes("письм") ||
      normalizedText.includes("напиш")
    ) {
      return `Черновик письма команде:

Тема: Новые цели компании на ближайший квартал

Коллеги, добрый день!

На основе анализа текущей ситуации и стратегических приоритетов определяем следующие цели:

1. **Главная цель:** увеличить выручку с 50 до 100 млн ₽.

2. **Приоритеты квартала:**
   • Оптимизация операционных процессов
   • Развитие команды руководителей
   • Внедрение системы контроля задач

Прошу ознакомиться с целями и подготовить планы по вашим направлениям до конца недели.

С уважением,
Руководитель`;
    }

    return `Понял ваш вопрос.

Чтобы дать точный ответ, мне нужно сопоставить запрос с данными компании:

• Целями и показателями
• Текущими задачами
• Историей встреч
• Договорённостями
• Документами и регламентами

Задайте более конкретный вопрос или загрузите документы, которые нужно проанализировать.`;
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();

    if ((!text && !uploadedFiles.length) || isLoading) {
      return;
    }

    const files = [...uploadedFiles];

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
      files,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setUploadedFiles([]);
    resetTextareaHeight();
    setIsLoading(true);

    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: getAIResponse(text, files),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="relative min-h-full bg-void font-body text-mist">
      <Starfield />

      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.09), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)",
        }}
      />

      <div className="noise-overlay" />

      <header className="header-solid sticky top-0 z-40 border-b border-line/40">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
              <LuBot className="h-4 w-4 text-ion" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 truncate font-display text-[13px] font-bold tracking-[0.08em] text-snow sm:tracking-[0.12em]">
                  ИИ-операционный директор
                </h1>

                <span className="hidden rounded border border-flux/30 bg-flux/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-flux sm:inline-flex">
                  База знаний
                </span>
              </div>

              <p className="mono-label truncate text-[8px] text-fog/45 sm:text-[9px]">
                Операционная аналитика
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-line/50 bg-hull/20 px-2.5 py-1.5 sm:flex">
              <span
                className="dot-live"
                style={{
                  backgroundColor: "var(--color-ok)",
                }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-fog/65">
                12 источников
              </span>
            </div>

            <button
              onClick={() => setIsContextOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-hull/25 px-2.5 py-1.5 text-[10px] text-fog/75 transition-colors hover:border-flux/40 hover:text-flux"
            >
              <LuDatabase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Контекст</span>
              <LuChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px] flex-col px-2 py-2 sm:px-4 sm:py-4 lg:px-6">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line/50 bg-hull/15 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)]">
          <div className="flex h-9 shrink-0 items-center gap-2 overflow-x-auto border-b border-line/40 px-3 scrollbar-none sm:h-10 sm:px-4">
            <div className="flex shrink-0 items-center gap-1.5 text-[9px] text-fog/60">
              <LuBuilding2 className="h-3.5 w-3.5 text-ion/70" />
              <span className="font-medium text-mist/80">
                Компания «Акме»
              </span>
            </div>

            <span className="h-3 w-px shrink-0 bg-line/60" />

            <div className="flex shrink-0 items-center gap-1.5 text-[9px] text-fog/50">
              <LuTarget className="h-3 w-3" />4 цели
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-[9px] text-fog/50">
              <LuListTodo className="h-3 w-3" />
              28 задач
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-[9px] text-fog/50">
              <LuCalendarDays className="h-3 w-3" />3 встречи
            </div>

            <div className="ml-auto hidden shrink-0 items-center gap-1.5 text-[8px] text-fog/35 md:flex">
              <span
                className="dot-live"
                style={{
                  backgroundColor: "var(--color-ok)",
                }}
              />
              Синхронизировано 4 мин назад
            </div>
          </div>

          <section className="relative min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 lg:px-10">
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
                        Я анализирую данные вашей компании и помогаю
                        находить проблемы, принимать решения и
                        готовить следующие шаги.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      {QUICK_PROMPTS.map(
                        ({
                          title,
                          description,
                          icon: Icon,
                        }) => (
                          <button
                            key={title}
                            onClick={() =>
                              handleQuickPrompt(description)
                            }
                            className="group rounded-xl border border-line/50 bg-hull/25 p-3.5 text-left transition-all duration-200 hover:border-flux/35 hover:bg-hull/40 sm:p-4"
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
                <div className="mx-auto w-full max-w-4xl space-y-6">
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2.5 sm:gap-3 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ion/40 bg-ion/10 sm:h-8 sm:w-8">
                            <LuBot className="h-3.5 w-3.5 text-ion sm:h-4 sm:w-4" />
                          </div>
                        )}

                        <div
                          className={`min-w-0 ${
                            isUser
                              ? "max-w-[88%] sm:max-w-[75%]"
                              : "max-w-[92%] sm:max-w-[82%]"
                          }`}
                        >
                          {!isUser && (
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="font-display text-[9px] font-bold tracking-[0.12em] text-ion">
                                ИИ-операционный директор
                              </span>

                              <span className="text-[8px] text-fog/30">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          )}

                          <div
                            className={`rounded-xl border px-3.5 py-3 sm:px-4 sm:py-3.5 ${
                              isUser
                                ? "border-flux/20 bg-flux/10 text-snow"
                                : "border-line/50 bg-hull/30 text-mist"
                            }`}
                          >
                            {message.content && (
                              <div className="whitespace-pre-wrap text-[12px] leading-[1.7] sm:text-[13px]">
                                {message.content}
                              </div>
                            )}

                            {message.files &&
                              message.files.length > 0 && (
                                <div
                                  className={`space-y-2 ${
                                    message.content
                                      ? "mt-3"
                                      : ""
                                  }`}
                                >
                                  {message.files.map(
                                    (file) => (
                                      <div
                                        key={`${file.name}-${file.size}-${file.lastModified}`}
                                        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-line/50 bg-void/20 px-3 py-2"
                                      >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-flux/10 text-flux">
                                          <LuFileText className="h-3.5 w-3.5" />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="truncate text-[10px] font-medium text-mist">
                                            {file.name}
                                          </p>

                                          <p className="text-[8px] uppercase tracking-[0.08em] text-fog/35">
                                            {(
                                              file.size /
                                              1024 /
                                              1024
                                            ).toFixed(1)}{" "}
                                            МБ
                                          </p>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>

                          {isUser && (
                            <p className="mt-1.5 text-right text-[8px] text-fog/30">
                              {formatTime(message.timestamp)}
                            </p>
                          )}
                        </div>

                        {isUser && (
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-flux to-ion sm:h-8 sm:w-8">
                            <span className="text-[10px] font-bold text-void">
                              Вы
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ion/40 bg-ion/10 sm:h-8 sm:w-8">
                        <LuBot className="h-3.5 w-3.5 text-ion sm:h-4 sm:w-4" />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="font-display text-[9px] font-bold tracking-[0.12em] text-ion">
                            ИИ-операционный директор
                          </span>
                        </div>

                        <div className="rounded-xl border border-line/50 bg-hull/30 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="dot-live"
                              style={{
                                backgroundColor:
                                  "var(--color-flux)",
                              }}
                            />
                            <span className="text-[10px] text-fog/60">
                              Анализирую данные...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </section>

          <div className="shrink-0 border-t border-line/40 bg-void/20 p-2.5 sm:p-3">
            <div className="mx-auto w-full max-w-4xl">
              {!hasConversation && (
                <div className="mb-2.5 flex gap-2 overflow-x-auto scrollbar-none">
                  {QUICK_PROMPTS.map(
                    ({ title, description, icon: Icon }) => (
                      <button
                        key={title}
                        onClick={() =>
                          handleQuickPrompt(description)
                        }
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line/50 bg-hull/20 px-2.5 py-1.5 text-[9px] text-fog/60 transition-colors hover:border-flux/30 hover:text-flux"
                      >
                        <Icon className="h-3 w-3" />
                        {title}
                      </button>
                    ),
                  )}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mb-2.5 flex gap-2 overflow-x-auto scrollbar-none">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex max-w-[240px] shrink-0 items-center gap-2 rounded-lg border border-flux/25 bg-flux/5 px-2.5 py-1.5"
                    >
                      <LuFileText className="h-3 w-3 shrink-0 text-flux" />

                      <span className="truncate text-[9px] text-mist">
                        {file.name}
                      </span>

                      <button
                        onClick={() => removeFile(index)}
                        className="shrink-0 text-fog/40 transition-colors hover:text-crit"
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
                  onClick={openFilePicker}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fog/60 transition-colors hover:bg-hull/60 hover:text-flux"
                  title="Прикрепить файл"
                  aria-label="Прикрепить файл"
                >
                  <LuPaperclip className="h-4 w-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(event) =>
                    setInputValue(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Задайте вопрос ИИ-операционному директору..."
                  rows={1}
                  disabled={isLoading}
                  className="min-h-[40px] max-h-[120px] flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[12px] leading-5 text-mist outline-none placeholder:text-fog/35 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={
                    isLoading ||
                    (!inputValue.trim() &&
                      uploadedFiles.length === 0)
                  }
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flux text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] transition-all duration-200 hover:bg-ice disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Отправить сообщение"
                >
                  <LuSend className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
                <p className="mono-label truncate text-[7px] text-fog/25 sm:text-[8px]">
                  {SUPPORTED_FORMATS.join(" · ")}
                </p>

                <p className="hidden shrink-0 text-[8px] text-fog/25 sm:block">
                  Enter — отправить · Shift + Enter — новая строка
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
        onChange={handleFileUpload}
        className="hidden"
      />

      {isContextOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            onClick={() => setIsContextOpen(false)}
            aria-label="Закрыть контекст"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line/60 bg-[#060b18] shadow-2xl sm:w-[360px]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line/50 px-4">
              <div>
                <p className="font-display text-[11px] font-bold tracking-[0.16em] text-snow">
                  КОНТЕКСТ
                </p>

                <p className="mt-0.5 text-[9px] text-fog/40">
                  Контекст ИИ-операционного директора
                </p>
              </div>

              <button
                onClick={() => setIsContextOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line/50 text-fog/60 transition-colors hover:border-line hover:text-mist"
                aria-label="Закрыть"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-5">
                <section>
                  <p className="mono-label mb-2 text-[8px] uppercase tracking-[0.16em] text-fog/35">
                    Компания
                  </p>

                  <div className="rounded-xl border border-line/50 bg-hull/25 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-ion/30 bg-ion/10">
                        <LuBuilding2 className="h-4 w-4 text-ion" />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-mist">
                          Компания «Акме»
                        </p>

                        <p className="mt-0.5 text-[9px] text-fog/40">
                          Текущее рабочее пространство
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mono-label mb-2 text-[8px] uppercase tracking-[0.16em] text-fog/35">
                    Данные компании
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Цели",
                        value: "4",
                        icon: LuTarget,
                      },
                      {
                        label: "Задачи",
                        value: "28",
                        icon: LuListTodo,
                      },
                      {
                        label: "Встречи",
                        value: "3",
                        icon: LuCalendarDays,
                      },
                      {
                        label: "Источники",
                        value: "12",
                        icon: LuDatabase,
                      },
                    ].map(
                      ({
                        label,
                        value,
                        icon: Icon,
                      }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-line/50 bg-hull/20 p-3"
                        >
                          <Icon className="mb-2 h-3.5 w-3.5 text-fog/45" />

                          <p className="text-lg font-semibold text-snow">
                            {value}
                          </p>

                          <p className="text-[8px] uppercase tracking-[0.1em] text-fog/35">
                            {label}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="mono-label text-[8px] uppercase tracking-[0.16em] text-fog/35">
                      База знаний
                    </p>

                    <button
                      onClick={openFilePicker}
                      className="text-[9px] text-flux transition-colors hover:text-ice"
                    >
                      + Добавить
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      "Стратегия компании.pdf",
                      "Финансовый отчёт.xlsx",
                      "Цели 3-го квартала.docx",
                      "Операционные процессы.pptx",
                    ].map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-2.5 rounded-lg border border-line/40 bg-hull/15 px-3 py-2.5"
                      >
                        <LuFileText className="h-3.5 w-3.5 shrink-0 text-fog/45" />

                        <span className="truncate text-[9px] text-mist/75">
                          {file}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="mono-label mb-2 text-[8px] uppercase tracking-[0.16em] text-fog/35">
                    Статус базы знаний
                  </p>

                  <div className="rounded-xl border border-flux/15 bg-flux/5 p-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="dot-live"
                        style={{
                          backgroundColor:
                            "var(--color-ok)",
                        }}
                      />

                      <span className="text-[10px] font-medium text-mist">
                        База знаний активна
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[8px] text-fog/40">
                      <LuClock3 className="h-3 w-3" />
                      Последняя синхронизация 4 минуты назад
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="shrink-0 border-t border-line/50 p-4">
              <button
                onClick={openFilePicker}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line/60 bg-hull/25 px-3 py-2.5 text-[10px] font-medium text-mist transition-colors hover:border-flux/40 hover:text-flux"
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