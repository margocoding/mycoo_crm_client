import { useEffect, useRef, useState } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuCircle,
  LuCircleDot,
  LuChevronLeft,
  LuCircleCheck,
  LuLoaderCircle,
} from "react-icons/lu";
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

interface Q {
  id: string;
  q: string;
  opts: Array<{ t: string; s: number }>;
}

interface Answer {
  opt?: number;
  text: string;
  skip?: boolean;
}

const SCAN_LINES = [
  "ответы сохранены",
  "анализируем ответы…",
  "ожидаем управленческий профиль…",
];

export function DiagnosticsOverlay() {
  const { state, closeModal, openModal } = useModalRouter();
  const user = useAuthStore((s) => s.user);
  const {
    workspace,
    profile,
    loadedFor,
    loading,
    error,
    launchWorkspace,
  } = useLaunch();

  const ready =
    Boolean(user) &&
    loadedFor === user?.id &&
    !loading &&
    !error;

  const open = state.modal === "diagnostics";

  useEffect(() => {
    if (open && ready && !workspace?.onboardingComplete) {
      openModal("onboarding");
    }
  }, [open, ready, workspace?.onboardingComplete, openModal]);

  if (!open || !ready || !workspace?.onboardingComplete) {
    return null;
  }

  return (
    <DiagnosticsForm
      open={open}
      onClose={closeModal}
      onLaunch={launchWorkspace}
      profile={profile}
      workspace={workspace}
    />
  );
}

function DiagnosticsForm({
  open,
  onClose,
  onLaunch,
  profile,
  workspace,
}: {
  open: boolean;
  onClose: () => void;
  onLaunch: (workspace: Workspace) => void;
  profile: Profile | null;
  workspace: Workspace;
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
  const [completedWorkspace, setCompletedWorkspace] =
    useState<Workspace | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setQuestions([]);

    workspaceApi
      .questions(controller.signal)
      .then((items) => {
        if (
          !Array.isArray(items) ||
          !items.length ||
          items.some(
            (item) =>
              !item.id ||
              !item.question ||
              !Array.isArray(item.options) ||
              !item.options.length,
          )
        ) {
          throw new Error("Сервер не вернул вопросы диагностики.");
        }

        setQuestions(
          items.map((q) => ({
            id: q.id,
            q: q.question,
            opts: q.options.map((o) => ({
              t: o.text,
              s: o.score,
            })),
          })),
        );

        setIdx((current) => Math.min(current, items.length - 1));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, workspace.id, reload]);

  useEffect(() => {
    const saved = Object.fromEntries(
      (workspace.diagnosticsAnswers ?? []).map((a) => [
        a.questionId,
        {
          opt: a.opt ?? undefined,
          text: a.text ?? "",
          skip: a.skip,
        },
      ]),
    );

    setAnswers(saved);
    setIdx(0);
    setText("");
    setScanLine(0);
    setResult(workspace.diagnosticsAnalysis ?? null);
    setCompletedWorkspace(
      workspace.diagnosticsComplete ? workspace : null,
    );
    setPhase(workspace.diagnosticsAnalysis ? "profile" : "ask");
  }, [workspace.id]);

  useEffect(() => {
    if (phase !== "scan") return;

    const timer = setInterval(() => {
      setScanLine((line) =>
        Math.min(line + 1, SCAN_LINES.length - 1),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const q = questions[idx];
  const a = q ? answers[q.id] : undefined;
  const answered =
    a?.opt !== undefined || Boolean(text.trim());

  useEffect(() => {
    setText(q ? answers[q.id]?.text ?? "" : "");
  }, [q?.id]);

  const submit = async (next: Record<string, Answer>) => {
    if (pendingRef.current) return;

    if (
      !Object.values(next).some(
        (a) =>
          !a.skip &&
          (a.opt !== undefined || a.text.trim()),
      )
    ) {
      setError("Ответьте хотя бы на один вопрос диагностики.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError("");
    setPhase("scan");
    setScanLine(0);

    try {
      const updated = await workspaceApi.completeDiagnostics(
        workspace.id,
        Object.entries(next).map(([questionId, a]) => ({
          questionId,
          ...a,
        })),
      );

      if (
        !updated.diagnosticsComplete ||
        !updated.diagnosticsAnalysis
      ) {
        throw new Error(
          "Результат диагностики ещё не готов. Повторите попытку.",
        );
      }

      cacheWorkspace(updated);
      setCompletedWorkspace(updated);
      setResult(updated.diagnosticsAnalysis);
      setPhase("profile");
    } catch (error) {
      setError(errorMessage(error));
      setPhase("ask");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const commit = (value: Answer) => {
    if (!q) return answers;

    const next = {
      ...answers,
      [q.id]: value,
    };

    setAnswers(next);
    return next;
  };

  const goNext = () => {
    if (!q || pendingRef.current) return;

    const next = commit({
      opt: a?.opt,
      text,
      skip: false,
    });

    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      void submit(next);
    }
  };

  const goBack = () => {
    if (!q || idx === 0 || pendingRef.current) return;

    commit({
      opt: a?.opt,
      text,
      skip: a?.skip,
    });

    setIdx(idx - 1);
  };

  const skip = () => {
    if (!q || pendingRef.current) return;

    const next = commit({
      text: "",
      skip: true,
    });

    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      void submit(next);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      ariaLabel="Экспресс-диагностика MyCOO"
      title={
        <>
          MYCOO <span className="text-fog/60">/</span>{" "}
          <span className="text-ion">EXPRESS SCAN</span>
        </>
      }
      subtitle={
        <>
          {profile?.company
            ? `объект: ${profile.company}`
            : "экспресс-диагностика"}
        </>
      }
      statusChip={{
        tone: phase === "profile" ? "ok" : "ion",
        text: phase === "profile" ? "profile ready" : "ai interview",
      }}
      maxWidth="max-w-3xl"
    >
      <div className="mb-4 flex gap-1 px-4 pt-3 max-sm:p-0 sm:mb-5 sm:px-5 sm:pt-4 md:px-6">
        {questions.map((qq, i) => {
          const done =
            answers[qq.id] &&
            (answers[qq.id].opt !== undefined ||
              answers[qq.id].text.trim() ||
              answers[qq.id].skip);

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

      <div className="px-4 pb-5 sm:px-5 sm:pb-6 md:px-6">
        {loading && (
          <div
            role="status"
            className="flex items-center gap-2.5 py-3 text-sm text-fog"
          >
            <LuLoaderCircle className="h-4 w-4 animate-spin text-ion" />
            Загружаем вопросы диагностики…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-crit/50 bg-crit/5 p-3.5 sm:p-4"
          >
            <p className="text-sm leading-relaxed text-mist">
              {error}
            </p>

            {questions.length === 0 ? (
              <Button
                onClick={() => setReload((n) => n + 1)}
                className="mt-3 w-full sm:w-auto"
              >
                Загрузить вопросы снова
              </Button>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => {
                    void submit(answers);
                  }}
                  disabled={pending}
                  className="w-full sm:w-auto"
                >
                  Повторить диагностику
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setError("");
                    setPhase("ask");
                  }}
                  className="w-full sm:w-auto"
                >
                  Изменить ответы
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "ask" && q && !loading && (
          <div key={q.id} className="step-in">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <p className="mono-label text-ion">
                вопрос {String(idx + 1).padStart(2, "0")} /{" "}
                {questions.length}
              </p>

              <p className="mono-label hidden text-fog/45 sm:block">
                {profile?.ownerName
                  ? `отвечает: ${profile.ownerName}`
                  : "выберите вариант или опишите словами"}
              </p>
            </div>

            <h3 className="font-display mt-2.5 text-lg font-bold leading-snug text-snow sm:mt-3 md:text-[21px]">
              {q.q}
            </h3>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
              {q.opts.map((o, i) => {
                const active =
                  a?.opt === i && !a.skip;

                return (
                  <button
                    key={o.t}
                    type="button"
                    onClick={() =>
                      commit({
                        opt: i,
                        text,
                      })
                    }
                    className={`group flex min-w-0 items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-all duration-300 sm:px-4 sm:py-3.5 ${
                      active
                        ? "border-ion/70 bg-ion/10 text-snow shadow-[0_0_22px_-8px_rgba(139,133,248,0.8)]"
                        : "border-line bg-hull/30 text-mist hover:-translate-y-0.5 hover:border-ion/40 hover:text-snow"
                    }`}
                  >
                    <span
                      className={`shrink-0 pt-0.5 font-mono text-[10px] font-bold ${
                        active
                          ? "text-ion"
                          : "text-fog/50"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug sm:text-[13.5px]">
                      {o.t}
                    </span>

                    {active && (
                      <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-ion" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 sm:mt-6">
              <label className="mono-label mb-2 block text-fog/60">
                или своими словами
              </label>

              <textarea
                rows={2}
                maxLength={1000}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  commit({
                    opt: a?.opt,
                    text: e.target.value,
                    skip: false,
                  });
                }}
                placeholder="Например: задачи ставлю лично в Telegram, трекера нет…"
                className="w-full resize-none rounded-md border border-line bg-void/70 px-3.5 py-3 text-[14px] leading-relaxed text-snow placeholder:text-fog/40 outline-none transition-all duration-300 focus:border-ion/60 focus:shadow-[0_0_22px_-8px_rgba(139,133,248,0.65)] sm:px-4"
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={idx === 0}
                className="w-full sm:w-auto"
                iconLeft={
                  <LuChevronLeft className="h-4 w-4" />
                }
              >
                Назад
              </Button>

              <button
                type="button"
                onClick={skip}
                className="mono-label order-last py-1 text-fog/50 transition-colors hover:text-warn sm:order-none"
              >
                пропустить
              </button>

              <Button
                tone="ion"
                onClick={goNext}
                disabled={!answered || pending}
                iconRight={
                  <LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                }
                className="w-full sm:ml-auto sm:w-auto"
              >
                {idx === questions.length - 1
                  ? "Сформировать профиль"
                  : "Далее"}
              </Button>
            </div>
          </div>
        )}

        {phase === "scan" && (
          <div className="step-in py-2 sm:py-3">
            <p className="mono-label text-ion">
              mycoo анализирует
            </p>

            <h3 className="font-display mt-1.5 text-lg font-bold leading-snug text-snow sm:mt-2 md:text-xl">
              Экспресс-диагностика контура управления
            </h3>

            <div className="mt-5 space-y-2 rounded-md border border-line/70 bg-void/60 p-3.5 font-mono text-[12px] sm:mt-6 sm:space-y-2.5 sm:p-4 sm:text-[12.5px]">
              {SCAN_LINES.map((line, i) => (
                <p
                  key={line}
                  className="log-in flex min-w-0 items-center gap-2.5 text-fog/85"
                  style={{
                    animationDelay: `${i * 0.42}s`,
                  }}
                >
                  {i < scanLine ? (
                    <LuCircleCheck className="h-3.5 w-3.5 shrink-0 text-ok" />
                  ) : i === scanLine ? (
                    <LuCircleDot className="pulse-glow h-3.5 w-3.5 shrink-0 text-ion" />
                  ) : (
                    <LuCircle className="h-2.5 w-2.5 shrink-0 text-fog/25" />
                  )}

                  <span className="min-w-0">{line}</span>
                </p>
              ))}
            </div>

            <p className="mono-label mt-3 text-fog/45 sm:mt-4">
              Ответы сохранены. Ожидаем результат анализа…
            </p>
          </div>
        )}

        {phase === "profile" && result && (
          <div className="step-in">
            <p className="mono-label text-ok">
              диагностика завершена
            </p>

            <h3 className="font-display mt-1.5 text-xl font-bold leading-snug text-snow sm:mt-2 md:text-2xl">
              Ваш управленческий профиль
            </h3>

            <div className="mt-5 grid gap-5 sm:mt-6 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6 md:grid-cols-[180px_1fr] md:gap-7">
              <div className="flex justify-center sm:block">
                <Dial
                  value={result.score}
                  label="/ 100"
                  sub="управляемость"
                  animated={phase === "profile"}
                />
              </div>

              <div className="min-w-0">
                <p className="mono-label mb-2.5 text-fog/60">
                  основные риски и точки роста
                </p>

                <ul className="space-y-2">
                  {result.risks.map((risk, i) => (
                    <RiskItem
                      key={i}
                      tone={risk.tone}
                      text={risk.text}
                      delay={0.3 + i * 0.18}
                    />
                  ))}
                </ul>

                <p className="mt-3 text-[13px] font-semibold leading-relaxed text-mist">
                  {result.summary}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-line/70 bg-void/60 px-3.5 py-3 sm:mt-6 sm:px-4 sm:py-3.5">
              <p className="text-[13px] leading-relaxed text-fog">
                Профиль сохранён — MyCOO будет учитывать его в
                ежедневной работе. Уже сейчас видно, где система
                снимет с вас ручное управление.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
              <Button
                tone="flux"
                onClick={() =>
                  completedWorkspace &&
                  onLaunch(completedWorkspace)
                }
                iconRight={
                  <LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                }
                className="w-full sm:w-auto"
              >
                Открыть рабочее пространство
              </Button>

              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Вернуться на сайт
              </Button>
            </div>

            <p className="mono-label mt-3 text-fog/45 sm:mt-4">
              Пробный период начат после успешной диагностики
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}