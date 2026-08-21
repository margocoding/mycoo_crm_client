import { useEffect, useMemo, useState } from "react";
import { Logo, IconCheck, IconArrow } from "./icons";
import { StatusChip, StatusDot } from "./ambient";
import { useCountUp, useReducedMotion } from "../lib/motion";
import type { Profile } from "./Onboarding";

/* ================= data ================= */

interface Opt {
  t: string;
  s: number;
}
interface Q {
  id: string;
  q: string;
  opts: Opt[];
}

const QUESTIONS: Q[] = [
  {
    id: "q1",
    q: "Как сейчас ставятся задачи?",
    opts: [
      { t: "Устно, в моменте", s: 0.2 },
      { t: "В мессенджерах и чатах", s: 0.45 },
      { t: "В таск-трекере", s: 0.8 },
      { t: "На регулярном планировании", s: 1 },
    ],
  },
  {
    id: "q2",
    q: "Где фиксируются задачи?",
    opts: [
      { t: "В памяти и переписке", s: 0.2 },
      { t: "В таблицах", s: 0.5 },
      { t: "В таск-системе", s: 0.85 },
      { t: "В единой системе компании", s: 1 },
    ],
  },
  {
    id: "q3",
    q: "Кто контролирует выполнение?",
    opts: [
      { t: "Собственник лично", s: 0.2 },
      { t: "Руководители вручную", s: 0.6 },
      { t: "Есть регулярная отчётность", s: 0.9 },
      { t: "Система плюс руководители", s: 1 },
    ],
  },
  {
    id: "q4",
    q: "Как проходят совещания?",
    opts: [
      { t: "Ситуативно, без повестки", s: 0.3 },
      { t: "Регулярно, без протоколов", s: 0.5 },
      { t: "С протоколами, без продолжения", s: 0.7 },
      { t: "С протоколами и задачами по итогам", s: 1 },
    ],
  },
  {
    id: "q5",
    q: "Как принимаются решения?",
    opts: [
      { t: "Интуитивно, по ситуации", s: 0.3 },
      { t: "После обсуждения с руководителями", s: 0.7 },
      { t: "Фиксируются и доводятся до команды", s: 0.9 },
      { t: "Фиксируются с ответственными и сроками", s: 1 },
    ],
  },
  {
    id: "q6",
    q: "Какие показатели контролируются еженедельно?",
    opts: [
      { t: "Практически никакие", s: 0.2 },
      { t: "Только выручка", s: 0.5 },
      { t: "Финансовые и операционные", s: 0.8 },
      { t: "Полный набор метрик с ответственными", s: 1 },
    ],
  },
  {
    id: "q7",
    q: "Что чаще всего приходится контролировать лично собственнику?",
    opts: [
      { t: "Практически всё", s: 0.1 },
      { t: "Ключевые задачи руководителей", s: 0.4 },
      { t: "Только отклонения", s: 0.8 },
      { t: "Почти ничего — работает система", s: 1 },
    ],
  },
  {
    id: "q8",
    q: "Превращаются ли договорённости после встреч в задачи?",
    opts: [
      { t: "Почти никогда", s: 0.1 },
      { t: "Иногда, если напомнить", s: 0.5 },
      { t: "Обычно да", s: 0.8 },
      { t: "Всегда, со сроками и ответственными", s: 1 },
    ],
  },
  {
    id: "q9",
    q: "Как быстро вы узнаёте о проблемах в процессах?",
    opts: [
      { t: "Когда уже «горят» сроки", s: 0.2 },
      { t: "Постфактум, на планёрках", s: 0.4 },
      { t: "В течение дня", s: 0.75 },
      { t: "В реальном времени", s: 1 },
    ],
  },
];

const SCAN_LINES = [
  "получаю ответы…",
  "сверяю с операционной моделью…",
  "оцениваю контур управления…",
  "выявляю узкие места…",
  "формирую управленческий профиль…",
];

interface Answer {
  opt?: number;
  text: string;
  skip?: boolean;
}

interface Risk {
  tone: "crit" | "warn" | "ok";
  t: string;
}

/* ================= scoring ================= */

function computeProfile(answers: Record<string, Answer>) {
  const vals = QUESTIONS.map((q) => {
    const a = answers[q.id];
    if (!a || a.skip) return 0.6;
    if (a.opt !== undefined) return q.opts[a.opt].s;
    if (a.text.trim()) return 0.62;
    return 0.6;
  });
  let score = Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 100);
  score = Math.max(38, Math.min(89, score));

  const pick = (id: string) => answers[id]?.opt;
  const risks: Risk[] = [];

  if (pick("q7") === 0 || pick("q7") === 1 || pick("q3") === 0)
    risks.push({ tone: "crit", t: "Задачи часто зависят от собственника" });
  if (pick("q2") !== undefined && pick("q2")! <= 1)
    risks.push({ tone: "warn", t: "Нет единой системы контроля" });
  if (
    (pick("q8") !== undefined && pick("q8")! <= 1) ||
    (pick("q4") !== undefined && pick("q4")! <= 1)
  )
    risks.push({ tone: "warn", t: "Договорённости после встреч не фиксируются" });
  if (pick("q5") !== undefined && pick("q5")! <= 0 && risks.length < 3)
    risks.push({ tone: "warn", t: "Решения не фиксируются с ответственными" });
  if (
    pick("q3") !== undefined &&
    pick("q3")! >= 2 &&
    (pick("q1") !== undefined && pick("q1")! >= 2)
  )
    risks.push({ tone: "ok", t: "Структура руководителей сформирована" });

  if (risks.filter((r) => r.tone !== "ok").length === 0)
    risks.unshift({ tone: "warn", t: "Контроль держится на ручном управлении" });
  if (!risks.some((r) => r.tone === "ok"))
    risks.push({ tone: "ok", t: "Команда готова к единому контуру управления" });

  return { score, risks: risks.slice(0, 4) };
}

const band = (s: number) =>
  s < 55
    ? { label: "Управление держится на ручном контроле", tone: "var(--color-crit)" }
    : s < 75
      ? { label: "База есть — нужен единый операционный контур", tone: "var(--color-warn)" }
      : { label: "Операционный контур почти замкнут", tone: "var(--color-ok)" };

/* ================= overlay ================= */

export function DiagnosticsOverlay({
  open,
  onClose,
  onLaunch,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  onLaunch: () => void;
  profile: Profile | null;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"ask" | "scan" | "profile">("ask");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [text, setText] = useState("");
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPhase("ask");
    setIdx(0);
    setAnswers({});
    setText("");
    setScanLine(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* scan animation */
  useEffect(() => {
    if (phase !== "scan") return;
    if (reduced) {
      setPhase("profile");
      return;
    }
    if (scanLine >= SCAN_LINES.length) {
      const t = setTimeout(() => setPhase("profile"), 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setScanLine((v) => v + 1), 460);
    return () => clearTimeout(t);
  }, [phase, scanLine, reduced]);

  const result = useMemo(
    () => (phase === "profile" ? computeProfile(answers) : null),
    [phase, answers]
  );

  /* persist profile */
  useEffect(() => {
    if (!result) return;
    try {
      localStorage.setItem("mycoo_mgmt_profile", JSON.stringify(result));
    } catch {
      /* demo mode */
    }
  }, [result]);

  const q = QUESTIONS[idx];
  const a = answers[q.id];
  const answered = !!a && (a.opt !== undefined || a.text.trim() !== "" || a.skip);

  const commit = (val: Answer) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const goNext = () => {
    commit({ opt: a?.opt, text, skip: false });
    setText("");
    if (idx < QUESTIONS.length - 1) {
      const n = idx + 1;
      setIdx(n);
      setText(answers[QUESTIONS[n].id]?.text ?? "");
    } else {
      setPhase("scan");
    }
  };
  const goBack = () => {
    if (idx === 0) return;
    commit({ opt: a?.opt, text, skip: false });
    const n = idx - 1;
    setIdx(n);
    setText(answers[QUESTIONS[n].id]?.text ?? "");
  };
  const skip = () => {
    commit({ text: "", skip: true });
    setText("");
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
    else setPhase("scan");
  };

  const score = useCountUp(result?.score ?? 0, phase === "profile", 1600);
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 100);

  if (!open) return null;

  const toneDot: Record<Risk["tone"], string> = {
    crit: "var(--color-crit)",
    warn: "var(--color-warn)",
    ok: "var(--color-ok)",
  };
  const toneName: Record<Risk["tone"], string> = {
    crit: "критично",
    warn: "внимание",
    ok: "норма",
  };

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-void/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Экспресс-диагностика MyCOO"
    >
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="corner glass step-in relative w-full max-w-3xl rounded-xl shadow-[0_0_90px_-20px_rgba(139,133,248,0.4)]">
          <span className="cx pointer-events-none absolute inset-0" />

          {/* header */}
          <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 md:px-7">
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-7" />
              <div>
                <p className="font-display text-[13px] font-bold tracking-[0.18em] text-snow">
                  MYCOO <span className="text-fog/60">/</span>{" "}
                  <span className="text-ion">EXPRESS SCAN</span>
                </p>
                <p className="mono-label text-fog/50">
                  {profile?.company ? `объект: ${profile.company}` : "экспресс-диагностика"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block">
                <StatusChip tone={phase === "profile" ? "ok" : "ion"}>
                  {phase === "profile" ? "profile ready" : "ai interview"}
                </StatusChip>
              </span>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-fog transition-all duration-300 hover:border-crit/60 hover:text-crit"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </div>
          </div>

          {/* progress */}
          <div className="flex gap-1 px-5 pt-4 md:px-7">
            {QUESTIONS.map((qq, i) => {
              const done = answers[qq.id] && (answers[qq.id].opt !== undefined || answers[qq.id].text.trim() || answers[qq.id].skip);
              return (
                <span
                  key={qq.id}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    phase !== "ask"
                      ? "bg-ion"
                      : i < idx || done
                        ? "bg-ion/70"
                        : i === idx
                          ? "bg-ion/30"
                          : "bg-hull"
                  }`}
                />
              );
            })}
          </div>

          <div className="p-6 md:p-8">
            {/* ---------- ASK ---------- */}
            {phase === "ask" && (
              <div key={q.id} className="step-in">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="mono-label text-ion">
                    вопрос {String(idx + 1).padStart(2, "0")} / {QUESTIONS.length}
                  </p>
                  <p className="mono-label hidden text-fog/45 sm:block">
                    {profile?.ownerName ? `отвечает: ${profile.ownerName}` : "выберите вариант или опишите словами"}
                  </p>
                </div>
                <h3 className="font-display mt-3 text-lg font-bold leading-snug text-snow md:text-[22px]">
                  {q.q}
                </h3>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {q.opts.map((o, i) => {
                    const active = a?.opt === i && !a.skip;
                    return (
                      <button
                        key={o.t}
                        type="button"
                        onClick={() => commit({ opt: i, text })}
                        className={`group flex items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-all duration-300 ${
                          active
                            ? "border-ion/70 bg-ion/10 text-snow shadow-[0_0_22px_-8px_rgba(139,133,248,0.8)]"
                            : "border-line bg-hull/30 text-mist hover:-translate-y-0.5 hover:border-ion/40 hover:text-snow"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] font-bold ${active ? "text-ion" : "text-fog/50"}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13.5px] font-medium leading-snug">{o.t}</span>
                        {active && (
                          <span className="ml-auto text-ion">
                            <IconCheck className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <label className="mono-label mb-2 mt-6 block text-fog/60">
                  или своими словами
                </label>
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (e.target.value.trim()) commit({ text: e.target.value });
                  }}
                  placeholder="Например: задачи ставлю лично в Telegram, трекера нет…"
                  className="w-full resize-none rounded-md border border-line bg-void/70 px-4 py-3 text-[14px] text-snow placeholder:text-fog/40 outline-none transition-all duration-300 focus:border-ion/60 focus:shadow-[0_0_22px_-8px_rgba(139,133,248,0.65)]"
                />

                <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={idx === 0}
                    className="rounded-md px-4 py-3 text-[13px] font-semibold text-fog transition-colors enabled:hover:text-ion disabled:opacity-30"
                  >
                    ← Назад
                  </button>
                  <button
                    type="button"
                    onClick={skip}
                    className="mono-label text-fog/50 transition-colors hover:text-warn"
                  >
                    пропустить
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!answered}
                    className="btn-primary group inline-flex items-center justify-center gap-2.5 rounded-md bg-ion px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(139,133,248,0.7)] transition-all duration-300 enabled:hover:brightness-110 enabled:hover:shadow-[0_0_44px_-8px_rgba(139,133,248,0.95)] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none sm:ml-auto"
                  >
                    {idx === QUESTIONS.length - 1 ? "Сформировать профиль" : "Далее"}
                    <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------- SCAN ---------- */}
            {phase === "scan" && (
              <div className="step-in py-4">
                <p className="mono-label text-ion">mycoo анализирует</p>
                <h3 className="font-display mt-2 text-lg font-bold text-snow md:text-xl">
                  Экспресс-диагностика контура управления
                </h3>
                <div className="mt-6 space-y-2.5 rounded-md border border-line/70 bg-void/60 p-5 font-mono text-[12.5px]">
                  {SCAN_LINES.map((l, i) => (
                    <p
                      key={l}
                      className="log-in flex items-center gap-2.5 text-fog/85"
                      style={{ animationDelay: `${i * 0.42}s` }}
                    >
                      {i < scanLine ? (
                        <span className="text-ok">▸</span>
                      ) : i === scanLine ? (
                        <span className="pulse-glow text-ion">●</span>
                      ) : (
                        <span className="text-fog/25">·</span>
                      )}
                      {l}
                    </p>
                  ))}
                </div>
                <p className="mono-label mt-4 text-fog/45">
                  ~9 ответов · без передачи данных · демо-режим
                </p>
              </div>
            )}

            {/* ---------- PROFILE ---------- */}
            {phase === "profile" && result && (
              <div className="step-in">
                <p className="mono-label text-ok">диагностика завершена</p>
                <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                  Ваш управленческий профиль
                </h3>

                <div className="mt-6 grid items-center gap-7 sm:grid-cols-[190px_1fr]">
                  {/* dial */}
                  <div className="relative mx-auto h-[190px] w-[190px]">
                    <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                      <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-hull)" strokeWidth="9" />
                      <circle
                        cx="70"
                        cy="70"
                        r={R}
                        fill="none"
                        stroke="url(#diag-grad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 8px rgba(139,133,248,0.5))" }}
                      />
                      <defs>
                        <linearGradient id="diag-grad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--color-flux)" />
                          <stop offset="100%" stopColor="var(--color-ion)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-4xl font-bold text-snow">{score}</span>
                      <span className="mono-label mt-1 text-fog/60">/ 100 · управляемость</span>
                    </div>
                  </div>

                  {/* risks */}
                  <div>
                    <p className="mono-label mb-3 text-fog/60">основные риски и точки роста</p>
                    <ul className="space-y-2.5">
                      {result.risks.map((r, i) => (
                        <li
                          key={r.t}
                          className="log-in flex items-center gap-3 rounded-md border border-line/60 bg-hull/30 px-3.5 py-3"
                          style={{ animationDelay: `${0.3 + i * 0.18}s` }}
                        >
                          <StatusDot color={toneDot[r.tone]} />
                          <span className="text-[13.5px] font-medium text-mist">{r.t}</span>
                          <span
                            className="ml-auto font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]"
                            style={{ color: toneDot[r.tone] }}
                          >
                            {toneName[r.tone]}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[13px] font-semibold" style={{ color: band(result.score).tone }}>
                      {band(result.score).label}
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-md border border-line/70 bg-void/60 px-4 py-3.5">
                  <p className="text-[13px] leading-relaxed text-fog">
                    Профиль сохранён — MyCOO будет учитывать его в ежедневной работе.
                    Уже сейчас видно, где система снимет с вас ручное управление.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onLaunch}
                    className="btn-primary group inline-flex items-center justify-center gap-2.5 rounded-md bg-flux px-6 py-3.5 text-[14px] font-bold text-void shadow-[0_0_30px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice hover:shadow-[0_0_44px_-8px_rgba(56,189,248,0.95)]"
                  >
                    Запустить trial · 10 дней
                    <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-md border border-line px-6 py-3.5 text-[13.5px] font-semibold text-mist transition-all duration-300 hover:border-flux/50 hover:text-snow"
                  >
                    Вернуться на сайт
                  </button>
                </div>
                <p className="mono-label mt-4 text-fog/45">
                  trial стартует после онбординга — вы уже знаете, что именно тестируете
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
