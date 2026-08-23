import { useState, useRef, useEffect } from "react";
import { LuSend, LuPaperclip, LuBot, LuUser, LuSparkles } from "react-icons/lu";
import { Logo } from "../../../icons";
import { Starfield } from "../../../ui/Ambient";

// Типы для сообщений
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Предопределённые подсказки для быстрого старта
const QUICK_PROMPTS = [
  "Что сейчас больше всего тормозит мою компанию?",
  "Подготовь план совещания на неделю",
  "Напиши письмо команде о новых целях",
  "Проанализируй последние показатели",
];

// Поддерживаемые форматы файлов
const SUPPORTED_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX"];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Привет! Я AI COO — ваш персональный операционный помощник.

Я знаю вашу компанию, цели, сотрудников, задачи и встречи. 
Могу помочь с:
• Ответами по документам компании
• Рекомендациями
• Подготовкой совещаний
• Анализом ситуации
• Написанием писем
• Подготовкой обратной связи
• Поиском информации

Загрузите документы (PDF, DOCX, XLSX, PPTX) или задайте вопрос прямо сейчас.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Обработка отправки сообщения
  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Симуляция ответа AI (здесь будет интеграция с бэкендом/RAG)
    setTimeout(() => {
      let aiResponse = "";
      
      if (uploadedFiles.length > 0) {
        aiResponse = `📎 Получено файлов: ${uploadedFiles.length}

Файлы загружены и добавлены в базу знаний:
${uploadedFiles.map((f) => `• ${f.name}`).join("\n")}

Теперь я могу использовать информацию из этих документов для ответов на ваши вопросы. Задавайте вопросы по содержанию файлов!`;
        setUploadedFiles([]);
      } else if (inputValue.toLowerCase().includes("тормоз") || inputValue.toLowerCase().includes("проблем")) {
        aiResponse = `Анализ ситуации за последние 14 дней:

Выявлено 3 повторяющиеся проблемы:

1. **Задачи часто зависят от собственника** — критический риск
   Влияние: 47% задач заблокированы ожиданием решения

2. **Нет единой системы контроля** — средний риск
   Влияние: 23% задач выполняются с отклонением от сроков

3. **Договорённости после встреч не фиксируются** — средний риск
   Влияние: 8 протоколов встреч требуют подтверждения

Рекомендация: Начните с внедрения обязательного протоколирования встреч и назначения ответственных за каждую задачу.`;
      } else if (inputValue.toLowerCase().includes("совещ") || inputValue.toLowerCase().includes("план")) {
        aiResponse = `План совещания на неделю:

**Понедельник 10:00** — Планёрка по операциям
• Обзор показателей за прошлую неделю
• Приоритеты на текущую неделю
• Блокирующие факторы

**Среда 12:30** — Продажи: план недели
• Выполнение плана продаж
• Работа с воронкой
• Ключевые сделки

**Пятница 15:00** — Финансовый срез
• Cash flow за неделю
• План-факт анализ
• Прогноз на следующую неделю

Нужно добавить что-то ещё?`;
      } else if (inputValue.toLowerCase().includes("письм") || inputValue.toLowerCase().includes("напиш")) {
        aiResponse = `Черновик письма команде:

---
Тема: Новые цели компании на ближайший квартал

Коллеги, добрый день!

На основе анализа текущей ситуации и стратегических приоритетов, определяю следующие цели:

1. **Главная цель**: Увеличить выручку с 50 до 100 млн ₽
   
2. **Приоритеты квартала**:
   - Оптимизация операционных процессов
   - Развитие команды руководителей
   - Внедрение системы контроля задач

Прошу ознакомиться и подготовить планы по вашим направлениям до конца недели.

MyCOO автоматически отслеживает прогресс по этим целям.

С уважением,
Руководитель
---

Отредактируйте текст при необходимости.`;
      } else {
        aiResponse = `Понял ваш вопрос. 

Для предоставления точного ответа мне нужно проанализировать данные вашей компании:

• Цели и показатели
• Текущие задачи и их статус
• Историю встреч и договорённости
• Документы и регламенты

Загрузите соответствующие документы или уточните вопрос, чтобы я мог дать более конкретную рекомендацию на основе данных MyCOO.`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Обработка загрузки файлов
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Проверка форматов
    const validFiles = files.filter((file) => {
      const ext = file.name.split(".").pop()?.toUpperCase();
      return ext && SUPPORTED_FORMATS.includes(ext);
    });

    if (validFiles.length !== files.length) {
      alert(`Поддерживаемые форматы: ${SUPPORTED_FORMATS.join(", ")}`);
    }

    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Обработка быстрых подсказок
  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="relative min-h-screen bg-void font-body text-mist">
      <Starfield />
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.09), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)",
        }}
      />
      <div className="noise-overlay" />

      {/* Заголовок страницы */}
      <header className="sticky top-0 z-40 header-solid">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
              <LuBot className="h-5 w-5 text-ion" />
            </div>
            <div>
              <h1 className="font-display text-[14px] font-bold tracking-[0.22em] text-snow">
                AI COO
              </h1>
              <p className="mono-label text-[9px] text-fog/60">Ваш операционный помощник</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-flux/40 bg-flux/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-flux">
              <LuSparkles className="h-3 w-3" />
              RAG активен
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-6 pt-6 md:px-6">
        <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Левая панель — База знаний */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="step-in glass corner relative rounded-xl p-4" style={{ animationDelay: "0.1s" }}>
              <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.14em] text-mist mb-3">
                База знаний
              </h2>
              
              <div className="space-y-3">
                <div className="rounded-lg border border-line/50 bg-hull/30 p-3">
                  <p className="mono-label text-[9px] text-fog/50 mb-2">Источники данных</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-[11px] text-mist">
                      <span className="dot-live" style={{ backgroundColor: "var(--color-ok)" }} />
                      Методология MyCOO
                    </li>
                    <li className="flex items-center gap-2 text-[11px] text-mist">
                      <span className="dot-live" style={{ backgroundColor: "var(--color-ok)" }} />
                      Документы пользователя
                    </li>
                    <li className="flex items-center gap-2 text-[11px] text-mist">
                      <span className="dot-live" style={{ backgroundColor: "var(--color-ok)" }} />
                      История компании
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-line/50 bg-hull/30 p-3">
                  <p className="mono-label text-[9px] text-fog/50 mb-2">Загруженные файлы</p>
                  {uploadedFiles.length > 0 ? (
                    <ul className="space-y-1">
                      {uploadedFiles.slice(0, 5).map((file, i) => (
                        <li key={i} className="text-[10px] text-fog truncate">
                          • {file.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-fog/50">Нет загруженных файлов</p>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-line/60 bg-hull/25 px-3 py-2 text-[11px] font-medium text-mist transition-colors hover:border-flux/50 hover:text-flux"
                >
                  <LuPaperclip className="h-3.5 w-3.5" />
                  Добавить файл
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </aside>

          {/* Основная область чата */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Область сообщений */}
            <div className="step-in glass corner relative flex-1 overflow-y-auto rounded-xl p-4 mb-4" style={{ animationDelay: "0.15s" }}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                        <LuBot className="h-4 w-4 text-ion" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-flux/10 border border-flux/20 text-snow"
                          : "bg-hull/30 border border-line/50 text-mist"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
                        {message.content}
                      </div>
                      <p className="mono-label mt-2 text-[8px] text-fog/40">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flux to-ion">
                        <LuUser className="h-4 w-4 text-void" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                      <LuBot className="h-4 w-4 text-ion" />
                    </div>
                    <div className="bg-hull/30 border border-line/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="dot-live" style={{ backgroundColor: "var(--color-flux)" }} />
                        <span className="text-[12px] text-fog/70">AI анализирует...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Область ввода */}
            <div className="step-in glass corner relative rounded-xl p-4" style={{ animationDelay: "0.2s" }}>
              {/* Быстрые подсказки */}
              {messages.length <= 2 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="mono-label rounded border border-line/60 bg-hull/25 px-2.5 py-1.5 text-[9px] text-fog/70 transition-colors hover:border-flux/50 hover:text-flux"
                    >
                      {prompt.length > 35 ? prompt.slice(0, 35) + "..." : prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Отображение загруженных файлов */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded border border-flux/30 bg-flux/5 px-2.5 py-1.5"
                    >
                      <LuPaperclip className="h-3 w-3 text-flux" />
                      <span className="text-[10px] text-mist">{file.name}</span>
                      <button
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-fog/50 hover:text-crit"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Поле ввода */}
              <div className="flex items-end gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded-lg border border-line/60 bg-hull/25 p-2.5 text-fog/70 transition-colors hover:border-flux/50 hover:text-flux"
                  title="Прикрепить файл"
                >
                  <LuPaperclip className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Задайте вопрос AI COO или загрузите документы..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-line/60 bg-hull/25 px-3 py-2.5 text-[13px] text-mist placeholder:text-fog/40 focus:border-flux/50 focus:outline-none focus:ring-1 focus:ring-flux/20"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && uploadedFiles.length === 0}
                  className="shrink-0 rounded-lg bg-flux px-4 py-2.5 text-[13px] font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-flux"
                >
                  <LuSend className="h-5 w-5" />
                </button>
              </div>

              <p className="mono-label mt-2 text-[8px] text-fog/35">
                Поддерживаемые форматы: {SUPPORTED_FORMATS.join(", ")}
              </p>
            </div>
          </div>
        </div>

        <p className="mono-label mt-6 text-center text-fog/35">
          AI COO · RAG система · Данные обрабатываются локально
        </p>
      </main>
    </div>
  );
}
