import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Segmented from "@/components/ui/Segmented";
import ValidationError from "@/components/ui/ValidationError";
import { useRef } from "react";
import { LuCheck, LuArrowRight, LuLock } from "react-icons/lu";
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
  { v: "startup", t: "Стартап", d: "ищем продукт и рынок" },
  { v: "growth", t: "Рост", d: "масштабируем продажи и команду" },
  { v: "mature", t: "Зрелость", d: "процессы стабильны — важна эффективность" },
  { v: "transform", t: "Трансформация", d: "меняем модель или выходим на новые рынки" },
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
const ROLES = ["Собственник", "Основатель", "Генеральный директор", "Управляющий партнёр", "Другое"];

const EXAMPLES = [
  "Увеличить выручку с 50 до 100 млн ₽",
  "Снизить зависимость бизнеса от собственника",
  "Настроить работу руководителей",
];

export function OnboardingOverlay() {
  const { profile, setField, next, back, complete, open, closeModal, ...flow } = useOnboardingFlow();

  const companyRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  const clearError = useOnboardingStore(state => state.clearError)

  const insertExample = (text: string) => {
    if (!profile.goal.trim()) setField("goal", text);
    else if (!profile.problem.trim()) setField("problem", text);
    else if (!profile.p1.trim()) setField("p1", text);
    else if (!profile.p2.trim()) setField("p2", text);
    else if (!profile.p3.trim()) setField("p3", text);
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
          MYCOO <span className="text-fog/60">/</span> <span className="text-ion">ONBOARDING</span>
        </>
      }
      subtitle={<>бриф компании · ~5 минут · {flow.step + 1}/5</>}
      statusChip={{
        tone: flow.step === 4 ? "ok" : "ion",
        text: flow.step === 4 ? "sync" : "data intake",
      }}
      showProgress
      progress={flow.progress}
      progressColor="var(--color-ion)"
      maxWidth="max-w-5xl"
    >
      <div className="grid md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line/60 p-6 md:block">
          <p className="mono-label mb-5 text-fog/60">маршрут брифа</p>
          <ol className="relative space-y-6">
            <span className="absolute bottom-2 left-[11px] top-2 w-px bg-line/70" />
            {PHASES.map((ph, i) => {
              const state = i < flow.step ? "done" : i === flow.step ? "active" : "idle";
              return (
                <li key={ph.code} className="relative flex items-center gap-3.5">
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                      state === "done"
                        ? "border-ok/60 bg-ok/10 text-ok"
                        : state === "active"
                          ? "border-ion bg-void text-ion shadow-[0_0_16px_-2px_rgba(139,133,248,0.8)]"
                          : "border-line bg-void text-fog/50"
                    }`}
                  >
                    {state === "done" ? <LuCheck className="h-3 w-3" /> : ph.id}
                  </span>
                  <div>
                    <p
                      className={`font-mono text-[10px] font-bold tracking-[0.2em] ${
                        state === "active" ? "text-ion" : state === "done" ? "text-ok/80" : "text-fog/50"
                      }`}
                    >
                      T·{ph.code}
                    </p>
                    <p className={`text-[12.5px] font-medium ${state === "idle" ? "text-fog/60" : "text-mist"}`}>
                      {ph.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-9 rounded-md border border-line/60 bg-hull/30 p-3.5">
            <p className="mono-label text-fog/50">приватность</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog/80">
              Данные отправляются в защищённый контур MyCOO.
            </p>
          </div>
        </aside>

        <fieldset disabled={flow.loading} aria-busy={flow.loading} className="min-w-0 min-h-[460px] p-6 md:p-8">
          {flow.step === 0 && (
            <div className="step-in">
              <div className="flex items-start gap-4">
                <span className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full border border-ion/30 [animation-duration:2.6s]" />
                  <span className="h-3 w-3 rounded-full bg-ion shadow-[0_0_14px_rgba(139,133,248,0.9)]" />
                </span>
                <div className="flex-1 rounded-lg rounded-tl-none border border-line/70 bg-hull/40 px-5 py-4">
                  <p className="mono-label text-ion">mycoo · говорит</p>
                  <p className="font-display mt-2 text-lg font-semibold leading-snug text-snow md:text-xl">
                    Давайте познакомимся с вашей компанией. Это займёт около 5 минут.
                  </p>
                  <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-fog">
                    <LuLock className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    Нужны только данные, которые действительно используются системой.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { t: "Компания", n: "7 полей", d: "масштаб, отрасль, стадия" },
                  { t: "Собственник", n: "3 поля", d: "кто принимает решения" },
                  { t: "Цели", n: "5 полей", d: "цель, проблема, приоритеты" },
                ].map((c, i) => (
                  <div
                    key={c.t}
                    className="rounded-lg border border-line/70 bg-hull/30 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-ion/40"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-[13.5px] font-semibold text-snow">{c.t}</p>
                      <span className="font-mono text-[10px] text-ion/80">{c.n}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-fog">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button
                  iconRight={<LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
                  onClick={() => next()}
                >
                  Начать знакомство
                </Button>
                <span className="mono-label text-fog/45">оборот и сайт — по желанию</span>
              </div>
            </div>
          )}

          {flow.step === 1 && (
            <div key={`c-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 01 · компания</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Расскажите о компании
              </h3>

              <div className="mt-6 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    ref={companyRef}
                    label="название"
                    autoFocus
                    autoComplete="off"
                    value={profile.company}
                    onChange={(e) => setField("company", e.target.value)}
                    placeholder="ООО «Вектор»"
                  />
                  <Input
                    label="сайт"
                    optional
                    autoComplete="off"
                    value={profile.site}
                    onChange={(e) => setField("site", e.target.value)}
                    placeholder="company.ru"
                  />
                </div>

                <div>
                  <FormField>отрасль</FormField>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <Chip key={ind} active={profile.industry === ind} onClick={() => setField("industry", ind)}>
                        {ind}
                      </Chip>
                    ))}
                  </div>
                  {profile.industry === "Другое" && (
                    <Input
                      autoFocus
                      autoComplete="off"
                      value={profile.industryOther}
                      onChange={(e) => setField("industryOther", e.target.value)}
                      placeholder="Чем занимается компания — опишите своими словами"
                      wrapperClassName="mt-3"
                    />
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FormField>сотрудников</FormField>
                    <Segmented
                      label="Количество сотрудников"
                      options={EMPLOYEES}
                      value={profile.employees}
                      onChange={(v) => setField("employees", v)}
                    />
                  </div>
                  <div>
                    <FormField>руководителей</FormField>
                    <Segmented
                      label="Количество руководителей"
                      options={MANAGERS}
                      value={profile.managers}
                      onChange={(v) => setField("managers", v)}
                    />
                  </div>
                </div>

                <div>
                  <FormField optional>примерный оборот</FormField>
                  <div className="flex flex-wrap gap-2">
                    {REVENUE.map((r) => (
                      <Chip key={r} active={profile.revenue === r} onClick={() => setField("revenue", r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <FormField>стадия бизнеса</FormField>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {STAGES.map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setField("stage", s.v)}
                        className={`rounded-lg border p-3.5 text-left transition-all duration-300 ${
                          profile.stage === s.v
                            ? "border-ion/70 bg-ion/10 shadow-[0_0_20px_-8px_rgba(139,133,248,0.7)]"
                            : "border-line bg-hull/30 hover:border-ion/40"
                        }`}
                      >
                        <p className={`font-display text-[13.5px] font-semibold ${profile.stage === s.v ? "text-snow" : "text-mist"}`}>
                          {s.t}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-fog">{s.d}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <ValidationError message={flow.error} />
              <OnboardingFooter onNext={next} onBack={() => back(0)} />
            </div>
          )}

          {flow.step === 2 && (
            <div key={`o-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 02 · собственник</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Кто принимает решения
              </h3>
              <p className="mt-2 text-[13.5px] text-fog">MyCOO эскалирует ключевые решения именно вам.</p>

              <div className="mt-6 grid gap-5">
                <Input
                  ref={ownerRef}
                  label="имя"
                  autoFocus
                  autoComplete="off"
                  value={profile.ownerName}
                  onChange={(e) => setField("ownerName", e.target.value)}
                  placeholder="Как к вам обращаться"
                />
                <div>
                  <FormField>должность</FormField>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <Chip key={r} active={profile.ownerRole === r} onClick={() => setField("ownerRole", r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                  {profile.ownerRole === "Другое" && (
                    <Input
                      autoFocus
                      autoComplete="off"
                      value={profile.roleOther}
                      onChange={(e) => setField("roleOther", e.target.value)}
                      placeholder="Ваша должность — например, коммерческий директор"
                      wrapperClassName="mt-3"
                    />
                  )}
                </div>
                <Input
                  label="email"
                  type="email"
                  autoComplete="off"
                  value={profile.ownerEmail}
                  onChange={(e) => setField("ownerEmail", e.target.value)}
                  placeholder="you@company.ru"
                  hint={
                    flow.regEmail && profile.ownerEmail === flow.regEmail ? (
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ok">
                        <LuCheck className="h-3 w-3" /> подставлен из регистрации
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <ValidationError message={flow.error} />
              <OnboardingFooter onNext={next} onBack={() => back(1)} />
            </div>
          )}

          {flow.step === 3 && (
            <div key={`g-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-ion">шаг 03 · цели</p>
              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">Куда летим</h3>

              <div className="mt-6 grid gap-5">
                <Textarea
                  ref={goalRef}
                  label="главная цель компании"
                  rows={2}
                  autoFocus
                  value={profile.goal}
                  onChange={(e) => setField("goal", e.target.value)}
                  placeholder="Например: увеличить выручку с 50 до 100 млн ₽"
                />
                <Textarea
                  label="главная проблема сейчас"
                  rows={2}
                  value={profile.problem}
                  onChange={(e) => setField("problem", e.target.value)}
                  placeholder="Что мешает двигаться быстрее"
                />

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <FormField>3 главных приоритета</FormField>
                    <span className="font-mono text-[10.5px] text-fog/60">
                      заполнено {flow.prioCount} / 3
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {(["p1", "p2", "p3"] as const).map((k, i) => (
                      <div key={k} className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${
                            profile[k].trim() ? "border-ok/50 text-ok" : "border-line text-fog/50"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Input
                          value={profile[k]}
                          onChange={(e) => setField(k, e.target.value)}
                          placeholder={`Приоритет ${i + 1}`}
                          wrapperClassName="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-line/70 bg-hull/30 p-4">
                  <p className="mono-label text-fog/60">примеры — нажмите, чтобы подставить</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <Button key={ex} variant="pill" onClick={() => insertExample(ex)}>
                        «{ex}»
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <ValidationError message={flow.error} />
              <OnboardingFooter onNext={next} onBack={() => back(2)} nextLabel="Передать MyCOO" />
            </div>
          )}

          {flow.step === 4 && (
            <div className="step-in">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-700 ${
                    flow.synced
                      ? "border-ok/50 bg-ok/10 shadow-[0_0_28px_-6px_rgba(52,211,153,0.5)]"
                      : "border-ion/50 bg-ion/10"
                  }`}
                >
                  {flow.synced ? (
                    <LuCheck className="h-6 w-6 text-ok [&>path]:draw-path" strokeWidth={2} />
                  ) : (
                    <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-ion shadow-[0_0_16px_rgba(139,133,248,0.9)]" />
                  )}
                </span>
                <div>
                  <p className="mono-label text-ion">шаг 04 · синхронизация</p>
                  <h3 className="font-display mt-1.5 text-xl font-bold text-snow md:text-2xl">
                    {flow.synced ? "Контекст принят. Контур собран." : "MyCOO принимает контекст…"}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-2 rounded-md border border-line/70 bg-void/60 p-4 font-mono text-[12px]">
                {[
                  { t: "контекст компании принят", d: 0.2 },
                  { t: `масштаб откалиброван · ${profile.employees} сотрудников · ${profile.managers} руководителей`, d: 0.6 },
                  { t: "цели и приоритеты зафиксированы в контуре", d: 1.0 },
                  { t: "операционная модель сформирована", d: 1.5 },
                  { t: "mycoo готов к первой телеметрии", d: 2.0 },
                ].map((l) => (
                  <p
                    key={l.t}
                    className="log-in flex items-center gap-2.5 text-fog/85"
                    style={{ animationDelay: `${l.d}s` }}
                  >
                    <span className="text-ion">▸</span> {l.t}
                    {l.t.includes("телеметрии") && <StatusDot color={toneDot.ok} />}
                  </p>
                ))}
              </div>

              {flow.synced && (
                <div className="step-in mt-5">
                  <div className="rounded-md border border-line/70 bg-hull/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="mono-label text-fog/60">бриф · {profile.company}</p>
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ok">
                        <StatusDot color={toneDot.ok} /> сохранён
                      </span>
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {flow.summary.map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-baseline justify-between gap-3 border-b border-line/40 pb-1.5"
                        >
                          <dt className="mono-label shrink-0 text-fog/55">{k}</dt>
                          <dd className="text-right text-[12.5px] font-medium text-mist" title={v}>
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      iconRight={<LuArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
                      onClick={complete}
                      disabled={flow.loading}
                    >
                      {flow.loading ? "Сохранение…" : "Перейти к экспресс-диагностике"}
                    </Button>
                    <Button
                      variant="secondary"
                      href={`mailto:hello@mycoo.ai?subject=MyCOO бриф · ${encodeURIComponent(profile.company)}`}
                    >
                      Отправить бриф оператору
                    </Button>
                    <Button variant="ghost" mono onClick={closeModal} className="sm:ml-auto">
                      позже
                    </Button>
                  </div>
                  {flow.error && (
                    <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-crit">
                      <StatusDot color="var(--color-crit)" /> {flow.error}
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
