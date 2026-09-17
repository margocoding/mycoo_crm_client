import { useRef } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuChevronRight,
  LuLock,
  LuCircleCheck,
} from "react-icons/lu";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Segmented from "@/components/ui/Segmented";
import ValidationError from "@/components/ui/ValidationError";
import OnboardingFooter from "./OnboardingFooter";
import Textarea from "@/components/ui/Textarea";
import { StatusDot } from "@/components/ui/Ambient";
import { toneDot } from "@/lib/tone";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { useOnboardingStore } from "@/store/onboarding.store";

export type { OnboardingProfile as Profile } from "@/store/onboarding.store";

const PHASES = [
  { id: "00", code: "BRIEF", label: "Знакомство" },
  { id: "01", code: "COMPANY", label: "Компания" },
  { id: "02", code: "OWNER", label: "Собственник" },
  { id: "03", code: "GOALS", label: "Цели" },
  { id: "04", code: "SYNC", label: "Синхронизация" },
];

const INDUSTRIES = [
  "IT и SaaS",
  "Ритейл и e-commerce",
  "Производство",
  "Услуги и B2B",
  "Финансы",
  "Строительство",
  "Логистика",
  "Другое",
];

const STAGES = [
  {
    v: "startup",
    t: "Стартап",
    d: "ищем продукт и рынок",
  },
  {
    v: "growth",
    t: "Рост",
    d: "масштабируем продажи и команду",
  },
  {
    v: "mature",
    t: "Зрелость",
    d: "процессы стабильны — важна эффективность",
  },
  {
    v: "transform",
    t: "Трансформация",
    d: "меняем модель или выходим на новые рынки",
  },
];

const EMPLOYEES = ["1–5", "6–20", "21–50", "51–200", "200+"];
const MANAGERS = ["1", "2–3", "4–10", "10+"];

const REVENUE = [
  "до 50 млн ₽",
  "50–100 млн ₽",
  "100–500 млн ₽",
  "500 млн – 1 млрд ₽",
  "1 млрд ₽ +",
  "не указывать",
];

const ROLES = [
  "Собственник",
  "Основатель",
  "Генеральный директор",
  "Управляющий партнёр",
  "Другое",
];

const EXAMPLES = [
  "Увеличить выручку с 50 до 100 млн ₽",
  "Снизить зависимость бизнеса от собственника",
  "Настроить работу руководителей",
];

const INTRO_CARDS = [
  {
    t: "Компания",
    n: "7 полей",
    d: "масштаб, отрасль, стадия",
  },
  {
    t: "Собственник",
    n: "3 поля",
    d: "кто принимает решения",
  },
  {
    t: "Цели",
    n: "5 полей",
    d: "цель, проблема, приоритеты",
  },
];

export function OnboardingOverlay() {
  const {
    profile,
    setField,
    next,
    back,
    complete,
    open,
    closeModal,
    ...flow
  } = useOnboardingFlow();

  const companyRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  const clearError = useOnboardingStore(
    (state) => state.clearError,
  );

  const insertExample = (text: string) => {
    if (!profile.goal.trim()) {
      setField("goal", text);
    } else if (!profile.problem.trim()) {
      setField("problem", text);
    } else if (!profile.p1.trim()) {
      setField("p1", text);
    } else if (!profile.p2.trim()) {
      setField("p2", text);
    } else if (!profile.p3.trim()) {
      setField("p3", text);
    }

    clearError();
  };

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={closeModal}
      ariaLabel="Знакомство с компанией"
      title={
        <>
          MYCOO <span className="text-fog/60">/</span>{" "}
          <span className="text-ion">ONBOARDING</span>
        </>
      }
      subtitle={
        <>
          бриф компании · ~5 минут · {flow.step + 1}/5
        </>
      }
      statusChip={{
        tone: flow.step === 4 ? "ok" : "ion",
        text: flow.step === 4 ? "sync" : "data intake",
      }}
      showProgress
      progress={flow.progress}
      progressColor="var(--color-ion)"
      maxWidth="max-w-5xl"
    >
      <div className="grid min-w-0 md:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line/60 p-5 max-sm:p-0 md:block lg:p-6">
          <p className="mono-label mb-5 text-fog/60">
            маршрут брифа
          </p>

          <ol className="relative space-y-5">
            <span className="absolute bottom-2 left-[11px] top-2 w-px bg-line/70" />

            {PHASES.map((ph, i) => {
              const state =
                i < flow.step
                  ? "done"
                  : i === flow.step
                    ? "active"
                    : "idle";

              return (
                <li
                  key={ph.code}
                  className="relative flex items-center gap-3"
                >
                  <span
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                      state === "done"
                        ? "border-ok/60 bg-ok/10 text-ok"
                        : state === "active"
                          ? "border-ion bg-void text-ion shadow-[0_0_16px_-2px_rgba(139,133,248,0.8)]"
                          : "border-line bg-void text-fog/50"
                    }`}
                  >
                    {state === "done" ? (
                      <LuCheck className="h-3 w-3" />
                    ) : (
                      ph.id
                    )}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`truncate font-mono text-[9.5px] font-bold tracking-[0.18em] ${
                        state === "active"
                          ? "text-ion"
                          : state === "done"
                            ? "text-ok/80"
                            : "text-fog/50"
                      }`}
                    >
                      T·{ph.code}
                    </p>

                    <p
                      className={`text-[12px] font-medium ${
                        state === "idle"
                          ? "text-fog/60"
                          : "text-mist"
                      }`}
                    >
                      {ph.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 rounded-md border border-line/60 bg-hull/30 p-3">
            <p className="mono-label text-fog/50">
              приватность
            </p>

            <p className="mt-1.5 text-[11px] leading-relaxed text-fog/80">
              Данные отправляются в защищённый контур MyCOO.
            </p>
          </div>
        </aside>

        <fieldset
          disabled={flow.loading}
          aria-busy={flow.loading}
          className="min-h-[420px] min-w-0 p-4 sm:p-5 md:min-h-[460px] max-sm:p-0 md:p-6 lg:p-7"
        >
          {flow.step === 0 && (
            <div className="step-in">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10 sm:h-10 sm:w-10">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full border border-ion/30 [animation-duration:2.6s]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ion shadow-[0_0_14px_rgba(139,133,248,0.9)] sm:h-3 sm:w-3" />
                </span>

                <div className="min-w-0 flex-1 rounded-lg rounded-tl-none border border-line/70 bg-hull/40 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <p className="mono-label text-ion">
                    mycoo · говорит
                  </p>

                  <p className="font-display mt-1.5 text-base font-semibold leading-snug text-snow sm:mt-2 sm:text-lg md:text-xl">
                    Давайте познакомимся с вашей компанией. Это
                    займёт около 5 минут.
                  </p>

                  <p className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-relaxed text-fog sm:mt-3 sm:text-[13px]">
                    <LuLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok sm:h-4 sm:w-4" />
                    <span>
                      Нужны только данные, которые действительно
                      используются системой.
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-3">
                {INTRO_CARDS.map((card, i) => (
                  <div
                    key={card.t}
                    className="min-w-0 rounded-md border border-line/70 bg-hull/30 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-ion/40 sm:p-3.5"
                    style={{
                      transitionDelay: `${i * 40}ms`,
                    }}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate font-display text-[13px] font-semibold text-snow">
                        {card.t}
                      </p>

                      <span className="shrink-0 font-mono text-[9.5px] text-ion/80">
                        {card.n}
                      </span>
                    </div>

                    <p className="mt-1 text-[11.5px] leading-relaxed text-fog">
                      {card.d}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:mt-7 sm:flex-row sm:items-center">
                <Button
                  iconRight={
                    <LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  }
                  onClick={() => next()}
                  className="w-full sm:w-auto"
                >
                  Начать знакомство
                </Button>

                <span className="mono-label text-center text-fog/45 sm:text-left">
                  оборот и сайт — по желанию
                </span>
              </div>
            </div>
          )}

          {flow.step === 1 && (
            <div
              key={`c-${flow.attempt}`}
              className={
                flow.attempt ? "shake" : "step-in"
              }
            >
              <StepHeading
                step="01"
                label="компания"
                title="Расскажите о компании"
              />

              <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <Input
                    ref={companyRef}
                    label="название"
                    autoFocus
                    autoComplete="off"
                    value={profile.company}
                    onChange={(e) =>
                      setField("company", e.target.value)
                    }
                    placeholder="ООО «Вектор»"
                  />

                  <Input
                    label="сайт"
                    optional
                    autoComplete="off"
                    value={profile.site}
                    onChange={(e) =>
                      setField("site", e.target.value)
                    }
                    placeholder="company.ru"
                  />
                </div>

                <div>
                  <FormField>отрасль</FormField>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {INDUSTRIES.map((industry) => (
                      <Chip
                        key={industry}
                        active={profile.industry === industry}
                        onClick={() =>
                          setField("industry", industry)
                        }
                      >
                        {industry}
                      </Chip>
                    ))}
                  </div>

                  {profile.industry === "Другое" && (
                    <Input
                      autoFocus
                      autoComplete="off"
                      value={profile.industryOther}
                      onChange={(e) =>
                        setField(
                          "industryOther",
                          e.target.value,
                        )
                      }
                      placeholder="Чем занимается компания — опишите своими словами"
                      wrapperClassName="mt-2.5 sm:mt-3"
                    />
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="min-w-0">
                    <FormField>сотрудников</FormField>

                    <Segmented
                      label="Количество сотрудников"
                      options={EMPLOYEES}
                      value={profile.employees}
                      onChange={(value) =>
                        setField("employees", value)
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <FormField>руководителей</FormField>

                    <Segmented
                      label="Количество руководителей"
                      options={MANAGERS}
                      value={profile.managers}
                      onChange={(value) =>
                        setField("managers", value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <FormField optional>
                    примерный оборот
                  </FormField>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {REVENUE.map((revenue) => (
                      <Chip
                        key={revenue}
                        active={
                          profile.revenue === revenue
                        }
                        onClick={() =>
                          setField("revenue", revenue)
                        }
                      >
                        {revenue}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <FormField>стадия бизнеса</FormField>

                  <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
                    {STAGES.map((stage) => {
                      const active =
                        profile.stage === stage.v;

                      return (
                        <button
                          key={stage.v}
                          type="button"
                          onClick={() =>
                            setField("stage", stage.v)
                          }
                          className={`min-w-0 rounded-md border p-3 text-left transition-all duration-300 sm:p-3.5 ${
                            active
                              ? "border-ion/70 bg-ion/10 shadow-[0_0_20px_-8px_rgba(139,133,248,0.7)]"
                              : "border-line bg-hull/30 hover:border-ion/40"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-display text-[13px] font-semibold ${
                                  active
                                    ? "text-snow"
                                    : "text-mist"
                                }`}
                              >
                                {stage.t}
                              </p>

                              <p className="mt-1 text-[11.5px] leading-relaxed text-fog">
                                {stage.d}
                              </p>
                            </div>

                            {active && (
                              <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-ion" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <ValidationError message={flow.error} />

              <OnboardingFooter
                onNext={next}
                onBack={() => back(0)}
              />
            </div>
          )}

          {flow.step === 2 && (
            <div
              key={`o-${flow.attempt}`}
              className={
                flow.attempt ? "shake" : "step-in"
              }
            >
              <StepHeading
                step="02"
                label="собственник"
                title="Кто принимает решения"
              />

              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-fog">
                MyCOO эскалирует ключевые решения именно вам.
              </p>

              <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
                <Input
                  ref={ownerRef}
                  label="имя"
                  autoFocus
                  autoComplete="off"
                  value={profile.ownerName}
                  onChange={(e) =>
                    setField("ownerName", e.target.value)
                  }
                  placeholder="Как к вам обращаться"
                />

                <div>
                  <FormField>должность</FormField>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {ROLES.map((role) => (
                      <Chip
                        key={role}
                        active={
                          profile.ownerRole === role
                        }
                        onClick={() =>
                          setField("ownerRole", role)
                        }
                      >
                        {role}
                      </Chip>
                    ))}
                  </div>

                  {profile.ownerRole === "Другое" && (
                    <Input
                      autoFocus
                      autoComplete="off"
                      value={profile.roleOther}
                      onChange={(e) =>
                        setField(
                          "roleOther",
                          e.target.value,
                        )
                      }
                      placeholder="Ваша должность — например, коммерческий директор"
                      wrapperClassName="mt-2.5 sm:mt-3"
                    />
                  )}
                </div>

                <Input
                  label="email"
                  type="email"
                  autoComplete="off"
                  value={profile.ownerEmail}
                  onChange={(e) =>
                    setField(
                      "ownerEmail",
                      e.target.value,
                    )
                  }
                  placeholder="you@company.ru"
                  hint={
                    flow.regEmail &&
                    profile.ownerEmail === flow.regEmail ? (
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-ok">
                        <LuCheck className="h-3 w-3 shrink-0" />
                        подставлен из регистрации
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <ValidationError message={flow.error} />

              <OnboardingFooter
                onNext={next}
                onBack={() => back(1)}
              />
            </div>
          )}

          {flow.step === 3 && (
            <div
              key={`g-${flow.attempt}`}
              className={
                flow.attempt ? "shake" : "step-in"
              }
            >
              <StepHeading
                step="03"
                label="цели"
                title="Куда летим"
              />

              <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
                <Textarea
                  ref={goalRef}
                  label="главная цель компании"
                  rows={2}
                  autoFocus
                  value={profile.goal}
                  onChange={(e) =>
                    setField("goal", e.target.value)
                  }
                  placeholder="Например: увеличить выручку с 50 до 100 млн ₽"
                />

                <Textarea
                  label="главная проблема сейчас"
                  rows={2}
                  value={profile.problem}
                  onChange={(e) =>
                    setField("problem", e.target.value)
                  }
                  placeholder="Что мешает двигаться быстрее"
                />

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <FormField>
                      3 главных приоритета
                    </FormField>

                    <span className="font-mono text-[10px] text-fog/60">
                      заполнено {flow.prioCount} / 3
                    </span>
                  </div>

                  <div className="grid gap-2.5">
                    {(["p1", "p2", "p3"] as const).map(
                      (key, i) => (
                        <div
                          key={key}
                          className="flex min-w-0 items-center gap-2.5 sm:gap-3"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-[9px] font-bold sm:h-9 sm:w-9 sm:text-[10px] ${
                              profile[key].trim()
                                ? "border-ok/50 text-ok"
                                : "border-line text-fog/50"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          <Input
                            value={profile[key]}
                            onChange={(e) =>
                              setField(
                                key,
                                e.target.value,
                              )
                            }
                            placeholder={`Приоритет ${i + 1}`}
                            wrapperClassName="min-w-0 flex-1"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-line/70 bg-hull/30 p-3 sm:p-3.5">
                  <p className="mono-label text-fog/60">
                    примеры — нажмите, чтобы подставить
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
                    {EXAMPLES.map((example) => (
                      <Button
                        key={example}
                        variant="pill"
                        onClick={() =>
                          insertExample(example)
                        }
                      >
                        «{example}»
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <ValidationError message={flow.error} />

              <OnboardingFooter
                onNext={next}
                onBack={() => back(2)}
                nextLabel="Передать MyCOO"
              />
            </div>
          )}

          {flow.step === 4 && (
            <div className="step-in">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-700 sm:h-12 sm:w-12 ${
                    flow.synced
                      ? "border-ok/50 bg-ok/10 shadow-[0_0_28px_-6px_rgba(52,211,153,0.5)]"
                      : "border-ion/50 bg-ion/10"
                  }`}
                >
                  {flow.synced ? (
                    <LuCheck
                      className="h-5 w-5 text-ok [&>path]:draw-path sm:h-6 sm:w-6"
                      strokeWidth={2}
                    />
                  ) : (
                    <span className="h-3 w-3 animate-pulse rounded-full bg-ion shadow-[0_0_16px_rgba(139,133,248,0.9)] sm:h-3.5 sm:w-3.5" />
                  )}
                </span>

                <div className="min-w-0">
                  <p className="mono-label text-ion">
                    шаг 04 · синхронизация
                  </p>

                  <h3 className="font-display mt-1 text-lg font-bold leading-snug text-snow sm:text-xl md:text-2xl">
                    {flow.synced
                      ? "Контекст принят. Контур собран."
                      : "MyCOO принимает контекст…"}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-md border border-line/70 bg-void/60 p-3.5 font-mono text-[11.5px] sm:mt-6 sm:p-4 sm:text-[12px]">
                {[
                  {
                    t: "контекст компании принят",
                    d: 0.2,
                  },
                  {
                    t: `масштаб откалиброван · ${profile.employees} сотрудников · ${profile.managers} руководителей`,
                    d: 0.6,
                  },
                  {
                    t: "цели и приоритеты зафиксированы в контуре",
                    d: 1.0,
                  },
                  {
                    t: "операционная модель сформирована",
                    d: 1.5,
                  },
                  {
                    t: "mycoo готов к первой телеметрии",
                    d: 2.0,
                  },
                ].map((line) => (
                  <p
                    key={line.t}
                    className="log-in flex min-w-0 items-start gap-2.5 text-fog/85"
                    style={{
                      animationDelay: `${line.d}s`,
                    }}
                  >
                    <LuChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ion" />

                    <span className="min-w-0 flex-1 break-words">
                      {line.t}
                    </span>

                    {line.t.includes("телеметрии") && (
                      <StatusDot color={toneDot.ok} />
                    )}
                  </p>
                ))}
              </div>

              {flow.synced && (
                <div className="step-in mt-4 sm:mt-5">
                  <div className="rounded-md border border-line/70 bg-hull/30 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="mono-label min-w-0 truncate text-fog/60">
                        бриф · {profile.company}
                      </p>

                      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ok sm:text-[10px] sm:tracking-[0.16em]">
                        <StatusDot color={toneDot.ok} />
                        сохранён
                      </span>
                    </div>

                    <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                      {flow.summary.map(([key, value]) => (
                        <div
                          key={key}
                          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-3 border-b border-line/40 pb-1.5"
                        >
                          <dt className="mono-label min-w-0 text-fog/55">
                            {key}
                          </dt>

                          <dd
                            className="min-w-0 break-words text-right text-[11.5px] font-medium leading-snug text-mist sm:text-[12.5px]"
                            title={value}
                          >
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
                    <Button
                      iconRight={
                        <LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      }
                      onClick={complete}
                      disabled={flow.loading}
                      className="w-full sm:w-auto"
                    >
                      {flow.loading
                        ? "Сохранение…"
                        : "Перейти к экспресс-диагностике"}
                    </Button>

                    <Button
                      variant="secondary"
                      href={`mailto:hello@mycoo.io?subject=MyCOO бриф · ${encodeURIComponent(profile.company)}`}
                      className="w-full sm:w-auto"
                    >
                      Отправить бриф оператору
                    </Button>

                    <Button
                      variant="ghost"
                      mono
                      onClick={closeModal}
                      className="w-full sm:ml-auto sm:w-auto"
                    >
                      позже
                    </Button>
                  </div>

                  {flow.error && (
                    <p className="mt-3 flex items-start gap-2 font-mono text-[10.5px] leading-relaxed text-crit sm:text-[11px]">
                      <StatusDot
                        color="var(--color-crit)"
                      />
                      <span className="min-w-0">
                        {flow.error}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </div>
    </Modal>
  );
}

function StepHeading({
  step,
  label,
  title,
}: {
  step: string;
  label: string;
  title: string;
}) {
  return (
    <>
      <p className="mono-label text-ion">
        шаг {step} · {label}
      </p>

      <h3 className="font-display mt-1.5 text-xl font-bold leading-snug text-snow sm:mt-2 md:text-2xl">
        {title}
      </h3>
    </>
  );
}