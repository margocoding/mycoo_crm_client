import { useEffect, useRef, useState } from "react";
import { LuCheck, LuArrowRight } from "react-icons/lu";
import { Modal } from "../../../ui/Modal";
import RiskItem from "../../../ui/RiskItem";
import Dial from "../../../ui/Dial";
import Button from "../../../ui/Button";
import type { Profile } from "./Onboarding/Onboarding";
import { errorMessage } from "@/api/base.api";
import { workspaceApi } from "@/api/workspace.api";
import type { Analysis, Workspace } from "@/types/workspace.types";
import { useModalRouter } from "@/hooks/useModalRouter";
import { useLaunch } from "@/store/launch.store";
import { useAuthStore } from "@/store/auth.store";
import { cacheWorkspace } from "@/lib/workspace";

interface Q { id: string; q: string; opts: Array<{ t: string; s: number }>; }
interface Answer { opt?: number; text: string; skip?: boolean; }
const SCAN_LINES = ["ответы сохранены", "анализируем ответы…", "ожидаем управленческий профиль…"];

export function DiagnosticsOverlay() {
  const { state, closeModal, openModal } = useModalRouter();
  const user = useAuthStore((s) => s.user);
  const { workspace, profile, loadedFor, loading, error, launchWorkspace } = useLaunch();
  const ready = Boolean(user) && loadedFor === user?.id && !loading && !error;
  const open = state.modal === "diagnostics";
  useEffect(() => {
    if (open && ready && !workspace?.onboardingComplete) openModal("onboarding");
  }, [open, ready, workspace?.onboardingComplete, openModal]);
  if (!open || !ready || !workspace?.onboardingComplete) return null;
  return <DiagnosticsForm open={open} onClose={closeModal} onLaunch={launchWorkspace} profile={profile} workspace={workspace} />;
}

function DiagnosticsForm({ open, onClose, onLaunch, profile, workspace }: {
  open: boolean; onClose: () => void; onLaunch: (workspace: Workspace) => void;
  profile: Profile | null; workspace: Workspace;
}) {
  const [phase, setPhase] = useState<"ask" | "scan" | "profile">("ask");
  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [text, setText] = useState("");
  const [scanLine, setScanLine] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Analysis | null>(null);
  const [completedWorkspace, setCompletedWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setQuestions([]);
    workspaceApi.questions(controller.signal)
      .then((items) => {
        if (!Array.isArray(items) || !items.length || items.some((item) => !item.id || !item.question || !Array.isArray(item.options) || !item.options.length)) {
          throw new Error("Сервер не вернул вопросы диагностики.");
        }
        setQuestions(items.map((q) => ({ id: q.id, q: q.question, opts: q.options.map((o) => ({ t: o.text, s: o.score })) })));
        setIdx((current) => Math.min(current, items.length - 1));
      })
      .catch((error) => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, workspace.id, reload]);

  useEffect(() => {
    const saved = Object.fromEntries((workspace.diagnosticsAnswers ?? []).map((a) => [
      a.questionId, { opt: a.opt ?? undefined, text: a.text ?? "", skip: a.skip },
    ]));
    setAnswers(saved); setIdx(0); setText(""); setScanLine(0);
    setResult(workspace.diagnosticsAnalysis ?? null);
    setCompletedWorkspace(workspace.diagnosticsComplete ? workspace : null);
    setPhase(workspace.diagnosticsAnalysis ? "profile" : "ask");
  }, [workspace.id]);

  useEffect(() => {
    if (phase !== "scan") return;
    const timer = setInterval(() => setScanLine((line) => Math.min(line + 1, SCAN_LINES.length - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const q = questions[idx];
  const a = q ? answers[q.id] : undefined;
  const answered = a?.opt !== undefined || Boolean(text.trim());
  useEffect(() => { setText(q ? answers[q.id]?.text ?? "" : ""); }, [q?.id]);

  const submit = async (next: Record<string, Answer>) => {
    if (pendingRef.current) return;
    if (!Object.values(next).some((a) => !a.skip && (a.opt !== undefined || a.text.trim()))) {
      setError("Ответьте хотя бы на один вопрос диагностики."); return;
    }
    pendingRef.current = true; setPending(true); setError(""); setPhase("scan"); setScanLine(0);
    try {
      const updated = await workspaceApi.completeDiagnostics(workspace.id,
        Object.entries(next).map(([questionId, a]) => ({ questionId, ...a })));
      if (!updated.diagnosticsComplete || !updated.diagnosticsAnalysis) throw new Error("Результат диагностики ещё не готов. Повторите попытку.");
      cacheWorkspace(updated); setCompletedWorkspace(updated);
      setResult(updated.diagnosticsAnalysis); setPhase("profile");
    } catch (error) { setError(errorMessage(error)); setPhase("ask"); }
    finally { pendingRef.current = false; setPending(false); }
  };

  const commit = (value: Answer) => {
    if (!q) return answers;
    const next = { ...answers, [q.id]: value };
    setAnswers(next); return next;
  };
  const goNext = () => {
    if (!q || pendingRef.current) return;
    const next = commit({ opt: a?.opt, text, skip: false });
    if (idx < questions.length - 1) setIdx(idx + 1);
    else void submit(next);
  };
  const goBack = () => {
    if (!q || idx === 0 || pendingRef.current) return;
    commit({ opt: a?.opt, text, skip: a?.skip }); setIdx(idx - 1);
  };
  const skip = () => {
    if (!q || pendingRef.current) return;
    const next = commit({ text: "", skip: true });
    if (idx < questions.length - 1) setIdx(idx + 1);
    else void submit(next);
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => { if (!pending) onClose(); }}
      ariaLabel="Экспресс-диагностика MyCOO"
      title={
        <>
          MYCOO <span className="text-fog/60">/</span> <span className="text-ion">EXPRESS SCAN</span>
        </>
      }
      subtitle={<>{profile?.company ? `объект: ${profile.company}` : "экспресс-диагностика"}</>}
      statusChip={{
        tone: phase === "profile" ? "ok" : "ion",
        text: phase === "profile" ? "profile ready" : "ai interview",
      }}
      maxWidth="max-w-3xl"
    >
      <div className="mb-6 flex gap-1 px-5 pt-4 md:px-7">
        {questions.map((qq, i) => {
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
        {loading && <p role="status" className="text-fog">Загружаем вопросы диагностики…</p>}
        {error && <div role="alert" className="mb-5 rounded-md border border-crit/50 p-4 text-sm text-mist">
          <p>{error}</p>
          {questions.length === 0 ? <Button onClick={() => setReload((n) => n + 1)} className="mt-3">Загрузить вопросы снова</Button>
            : <div className="mt-3 flex flex-wrap gap-3">
                <Button onClick={() => { void submit(answers); }} disabled={pending}>Повторить диагностику</Button>
                <Button variant="ghost" onClick={() => { setError(""); setPhase("ask"); }}>Изменить ответы</Button>
              </div>}
        </div>}
        {phase === "ask" && q && !loading && (
          <div key={q.id} className="step-in">
            <div className="flex items-baseline justify-between gap-4">
              <p className="mono-label text-ion">
                вопрос {String(idx + 1).padStart(2, "0")} / {questions.length}
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
                    <span className={`font-mono text-[10px] font-bold ${active ? "text-ion" : "text-fog/50"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13.5px] font-medium leading-snug">{o.t}</span>
                    {active && <LuCheck className="ml-auto h-4 w-4 text-ion" />}
                  </button>
                );
              })}
            </div>

            <label className="mono-label mb-2 mt-6 block text-fog/60">или своими словами</label>
            <textarea
              rows={2}
              maxLength={1000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                commit({ opt: a?.opt, text: e.target.value, skip: false });
              }}
              placeholder="Например: задачи ставлю лично в Telegram, трекера нет…"
              className="w-full resize-none rounded-md border border-line bg-void/70 px-4 py-3 text-[14px] text-snow placeholder:text-fog/40 outline-none transition-all duration-300 focus:border-ion/60 focus:shadow-[0_0_22px_-8px_rgba(139,133,248,0.65)]"
            />

            <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
              <Button variant="ghost" onClick={goBack} disabled={idx === 0}>
                ← Назад
              </Button>
              <button
                type="button"
                onClick={skip}
                className="mono-label text-fog/50 transition-colors hover:text-warn"
              >
                пропустить
              </button>
              <Button
                tone="ion"
                onClick={goNext}
                disabled={!answered || pending}
                iconRight={<LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
                className="sm:ml-auto"
              >
                {idx === questions.length - 1 ? "Сформировать профиль" : "Далее"}
              </Button>
            </div>
          </div>
        )}

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
            <p className="mono-label mt-4 text-fog/45">Ответы сохранены. Ожидаем результат анализа…</p>
          </div>
        )}

        {phase === "profile" && result && (
          <div className="step-in">
            <p className="mono-label text-ok">диагностика завершена</p>
            <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
              Ваш управленческий профиль
            </h3>

            <div className="mt-6 grid items-center gap-7 sm:grid-cols-[190px_1fr]">
              <Dial value={result.score} label="/ 100" sub="управляемость" animated={phase === "profile"} />

              <div>
                <p className="mono-label mb-3 text-fog/60">основные риски и точки роста</p>
                <ul className="space-y-2.5">
                  {result.risks.map((r, i) => (
                    <RiskItem key={i} tone={r.tone} text={r.text} delay={0.3 + i * 0.18} />
                  ))}
                </ul>
                <p className="mt-4 text-[13px] font-semibold" >
                  {result.summary}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-md border border-line/70 bg-void/60 px-4 py-3.5">
              <p className="text-[13px] leading-relaxed text-fog">
                Профиль сохранён — MyCOO будет учитывать его в ежедневной работе. Уже сейчас
                видно, где система снимет с вас ручное управление.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                tone="flux"
                onClick={() => completedWorkspace && onLaunch(completedWorkspace)}
                iconRight={<LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
              >
                Открыть рабочее пространство
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Вернуться на сайт
              </Button>
            </div>
            <p className="mono-label mt-4 text-fog/45">
              Пробный период начат после успешной диагностики
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
