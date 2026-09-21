import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../../icons";
import { Starfield, StatusDot } from "../../../ui/Ambient";
import { useCountUp } from "../../../../lib/motion";
import { useLaunch } from "@/store/launch.store";
import { useAuthStore } from "@/store/auth.store";
import { useTeam } from "@/components/shared/team/TeamProvider";
import { useDashboard } from "@/hooks/useDashboard";

const toneVar = {
  crit: "var(--color-crit)",
  warn: "var(--color-warn)",
  ok: "var(--color-ok)",
};

function Stat({
  value,
  label,
  tone,
  delay,
  pulse,
}: {
  value: number | null;
  label: string;
  tone: string;
  delay: number;
  pulse?: boolean;
}) {
  const n = useCountUp(value ?? 0, value !== null, 1300);
  return (
    <div
      className="step-in group rounded-lg border border-line/70 bg-hull/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="flex items-center gap-2">
        <span className="font-display text-3xl font-bold" style={{ color: tone }}>
          {value === null ? '—' : n}
        </span>
        {pulse && <StatusDot color={tone} />}
      </p>
      <p className="mono-label mt-1.5 break-words text-[9px] tracking-[0.08em] text-fog/70 sm:text-[10px] sm:tracking-[0.12em]">{label}</p>
    </div>
  );
}

function Card({
  title,
  code,
  delay,
  children,
  className = "",
}: {
  title: string;
  code: string;
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`step-in glass corner group/card relative rounded-xl p-5 transition-colors duration-300 hover:border-line ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
          {title}
        </h3>
        <span className="mono-label text-fog/45">{code}</span>
      </header>
      {children}
    </section>
  );
}

/* ================= workspace ================= */

export default function Workspace() {
  const { exitToSite, resetDemo, workspace } = useLaunch();
  const user = useAuthStore(s => s.user);
  const { data: team } = useTeam();
  const [departmentId, setDepartmentId] = useState('');
  const { data, error, reload } = useDashboard(workspace?.id, departmentId);
  const [ready, setReady] = useState(false);
  const isOwner = workspace?.ownerId === user?.id;
  const trialStart = workspace?.trialStartedAt ? Date.parse(workspace.trialStartedAt) : Date.now();
  const daysLeft = Math.max(0, 10 - Math.floor((Date.now() - trialStart) / 86400000));

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const analysis = data?.ai.analysis;
  const goalPct = useCountUp(analysis?.goalProgress ?? 0, ready, 1500);
  const score = useCountUp(workspace?.diagnosticsAnalysis?.score ?? 0, ready, 1500);
  const risks = analysis?.risks ?? [];
  const company = workspace?.company || "Моя компания";
  const owner = user?.name || (isOwner ? workspace?.ownerName : null) || 'коллега';
  const goal = workspace?.goal || "Цель пока не указана";
  const priorities = [workspace?.priority1, workspace?.priority2, workspace?.priority3].filter(Boolean) as string[];
  const aiMessage = !data ? 'Загружаем сводку…' : data.ai.status === 'restricted'
    ? 'AI-сводка доступна собственнику, руководителю и администратору департамента.'
    : data.ai.status === 'updating' ? 'AI-сводка обновляется…'
    : data.ai.status === 'unavailable' ? 'AI-сводка временно недоступна. Повторим автоматически.'
    : data.ai.status === 'stale' ? 'Показана предыдущая оценка. Обновление временно недоступно.' : '';
  const updatedAt = data?.ai.generatedAt ? new Date(data.ai.generatedAt).toLocaleString('ru-RU') : null;

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

      {/* app bar */}
      <header className="header-solid sticky top-0 z-40 max-sm:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="font-display text-[14px] font-bold tracking-[0.22em] text-snow">MYCOO</span>
            <span className="hidden h-4 w-px bg-line sm:block" />
            <span className="font-display hidden truncate text-[12px] font-semibold tracking-[0.14em] text-flux sm:block">
              МОЙ БИЗНЕС
            </span>
            <span className="hidden max-w-[180px] truncate rounded border border-line bg-hull/60 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-fog md:block">
              {company}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-2 rounded border border-flux/40 bg-flux/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-flux sm:inline-flex">
              <StatusDot />
              trial · {daysLeft} дн
            </span>
            <button
              onClick={exitToSite}
              className="rounded-md border border-line px-3.5 py-2 text-[12.5px] font-semibold text-fog transition-all duration-300 hover:border-flux/50 hover:text-snow"
            >
              На сайт
            </button>
            <button
              onClick={resetDemo}
              title="Выйти из аккаунта"
              className="mono-label hidden rounded-md px-3 py-2 text-fog/50 transition-colors hover:text-crit sm:block"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-8">
        {/* trial banner */}
        <section className="step-in glass corner relative overflow-hidden rounded-xl p-5 md:p-6">
          <span className="cx pointer-events-none absolute inset-0" />
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono-label text-flux">пробный период</p>
              <p className="mt-1.5 text-[15px] font-medium text-mist">
                До окончания пробного периода:{" "}
                <span className="font-display text-xl font-bold text-snow">
                  {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}
                </span>
              </p>
              <p className="mt-1 text-[12.5px] text-fog/70">
                Trial запущен после диагностики — MyCOO уже работает с контекстом {company}.
              </p>
            </div>
            <div className="w-full md:w-[300px]">
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-sm transition-all duration-700 ${
                      i < daysLeft
                        ? "bg-flux shadow-[0_0_8px_rgba(56,189,248,0.55)]"
                        : "bg-hull"
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="mono-label text-fog/45">день 0</span>
                <span className="mono-label text-fog/45">день 10</span>
              </div>
            </div>
          </div>
        </section>

        {/* greeting */}
        <div className="step-in mt-8 flex flex-wrap items-end justify-between gap-3" style={{ animationDelay: "0.1s" }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-snow md:text-3xl">
              Добро пожаловать, {owner}
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-fog">
              Задачи и команда обновляются автоматически. AI-сводка рассчитывается
              раз в 24 часа по задачам за последние 7 дней.
            </p>
          </div>
          {isOwner && workspace?.diagnosticsAnalysis && (
            <div className="flex items-center gap-3 rounded-lg border border-ion/30 bg-ion/5 px-4 py-2.5">
              <span className="font-display text-xl font-bold text-ion">{score}</span>
              <span className="mono-label leading-tight text-fog/70">
                управляемость
                <br />
                по диагностике
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm text-fog" htmlFor="dashboard-department">Обзор</label>
          <select id="dashboard-department" className="min-w-0 max-w-full rounded-md border border-line bg-hull px-3 py-2 text-sm text-mist"
            value={departmentId || (isOwner ? '' : data?.scope.departmentId ?? team?.departments[0]?.id ?? '')}
            onChange={event => setDepartmentId(event.target.value)}>
            {isOwner && <option value="">Вся компания</option>}
            {team?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {data?.scope.personal && <span className="text-xs text-fog">Ваши задачи и участие в отделе</span>}
        </div>
        {error && <div role="alert" className="mt-4 rounded-md border border-crit/40 p-3 text-sm text-crit">
          {error} {data && 'Показаны последние загруженные данные.'}
          <button className="ml-2 underline" onClick={reload}>Повторить</button>
        </div>}
        {aiMessage && <p role="status" className="mt-4 text-sm text-fog">{aiMessage}</p>}

        {/* grid */}
        <div className="mt-7 grid gap-4 lg:grid-cols-12">
          {/* Цели */}
          <Card title="Цели" code="SYS·GOALS" delay={0.15} className="lg:col-span-5">
            <p className="mono-label text-fog/60">главная цель месяца</p>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-snow">{goal}</p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-flux">{analysis?.goalProgress == null ? '—' : `${goalPct}%`}</span>
              <span className="mono-label text-fog/60">оценка AI по задачам недели</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hull/80">
              <div
                className="h-full rounded-full bg-flux shadow-[0_0_12px_rgba(56,189,248,0.6)] transition-all duration-[1500ms] ease-out"
                style={{ width: ready ? `${analysis?.goalProgress ?? 0}%` : "0%" }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-fog">{analysis?.goalExplanation || aiMessage || 'Недостаточно данных для оценки.'}</p>
            {priorities.length > 0 && (
              <div className="mt-5">
                <p className="mono-label mb-2 text-fog/55">приоритеты</p>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((pr, i) => (
                    <span key={i} className="rounded border border-line bg-hull/40 px-2.5 py-1.5 text-[12px] font-medium text-mist">
                      <span className="mr-1.5 font-mono text-[10px] text-ion">{String(i + 1).padStart(2, "0")}</span>
                      {pr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Задачи */}
          <Card title="Задачи" code="SYS·TASKS" delay={0.22} className="lg:col-span-7">
            <div className="grid grid-cols-3 max-md:grid-cols-1 gap-3">
              <Stat value={data?.tasks.active ?? null} label="активных" tone="var(--color-flux)" delay={0.3} />
              <Stat value={data?.tasks.overdue ?? null} label="просроченных" tone="var(--color-crit)" delay={0.38} pulse={Boolean(data?.tasks.overdue)} />
              <Stat value={data?.tasks.completed ?? null} label="выполнено" tone="var(--color-ok)" delay={0.46} />
            </div>
            <div className="mt-4 space-y-2">
              {data?.tasks.items.map(row => {
                const overdue = row.dueDate < data.today;
                const today = row.dueDate === data.today;
                const tone = overdue ? toneVar.crit : today ? toneVar.warn : 'var(--color-flux)';
                return <Link
                  key={row.id} to={row.departmentId ? '/dashboard/tasks/' + row.departmentId : '/dashboard/tasks'}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 transition-colors duration-300 hover:border-line sm:flex sm:gap-3"
                >
                  <span>
                    <StatusDot color={tone} />
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[13px] font-medium text-mist">{row.title}</span>
                  <span className="col-start-2 font-mono text-[10.5px] uppercase tracking-[0.1em] sm:ml-auto sm:shrink-0" style={{ color: tone }}>
                    {overdue ? 'Просрочена · ' : today ? 'Срок сегодня · ' : 'До '}{new Date(row.dueDate).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}
                  </span>
                </Link>;
              })}
              {data && !data.tasks.items.length && <p className="text-sm text-fog">Активных задач пока нет.</p>}
            </div>
            <p className="mono-label mt-4 text-fog/40">{data ? `обновлено: ${new Date(data.updatedAt).toLocaleTimeString('ru-RU')}` : 'загружаем задачи'}</p>
          </Card>

          {/* Команда */}
          <Card title="Команда" code="SYS·CREW" delay={0.28} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={data?.team.employees ?? null} label="сотрудников" tone="var(--color-mist)" delay={0.36} />
              <Stat value={data?.team.managers ?? null} label="руководителей" tone="var(--color-ion)" delay={0.44} />
            </div>
            {isOwner && !data?.scope.departmentId && workspace?.employees && workspace?.managers && (
              <p className="mt-4 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 font-mono text-[11px] text-fog/70">
                по брифу: сотрудников {workspace.employees} · руководителей {workspace.managers}
              </p>
            )}
            <p className="mono-label mt-4 text-fog/40">{data?.scope.personal ? 'ваше участие в департаменте' : 'принявшие приглашение · руководители входят в общее число'}</p>
          </Card>

          {/* Встречи */}
          <Card title="Встречи" code="SYS·MEET" delay={0.34} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={0} label="предстоящих" tone="var(--color-flux)" delay={0.42} />
              <Stat value={0} label="протокола ждут" tone="var(--color-warn)" delay={0.5} />
            </div>
            <p className="mt-4 text-sm text-fog">Встреч пока нет.</p>
          </Card>

          {/* Риски */}
          <Card title="Риски" code="SYS·RISK" delay={0.4} className="lg:col-span-4">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-warn">
                {analysis ? risks.length : '—'}
              </span>
              <span className="mono-label text-fog/60">требуют внимания</span>
            </p>
            <ul className="mt-4 space-y-2">
              {risks.map((r) => (
                <li
                  key={r.text}
                  className="flex items-center gap-3 rounded-md border border-line/60 bg-hull/25 px-3.5 py-2.5 transition-colors duration-300 hover:border-line"
                >
                  <StatusDot color={toneVar[r.tone]} />
                  <span className="text-[13px] font-medium leading-snug text-mist">{r.text}</span>
                </li>
              ))}
            </ul>
            {analysis && !risks.length && <p className="mt-3 text-sm text-fog">По данным недели риски не выявлены.</p>}
            <p className="mono-label mt-4 text-fog/40">{updatedAt ? `AI · ${updatedAt}` : aiMessage}</p>
          </Card>

          {/* AI-рекомендация */}
          <section
            className="step-in glass corner relative overflow-hidden rounded-xl p-5 lg:col-span-7"
            style={{ animationDelay: "0.46s" }}
          >
            <span className="cx pointer-events-none absolute inset-0" />
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-ion/50 bg-ion/10">
                  <span className="pulse-glow h-2.5 w-2.5 rounded-full bg-ion" />
                </span>
                <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-mist">
                  AI-рекомендация
                </h3>
              </div>
              <span className="mono-label text-fog/45">mycoo advisory</span>
            </header>

            <blockquote className="border-l-2 border-ion pl-4">
              <p className="text-[14.5px] font-medium leading-relaxed text-snow">
                {analysis?.recommendation || aiMessage}
              </p>
            </blockquote>

            {data?.ai.periodStart && data.ai.periodEnd && <p className="mt-5 text-xs text-fog">
              Задачи за {new Date(data.ai.periodStart).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}–{new Date(data.ai.periodEnd).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}.
              {' '}Обновлено: {updatedAt}.
            </p>}
          </section>

          {/* Журнал */}
          <Card title="Операционный журнал" code="SYS·LOG" delay={0.52} className="lg:col-span-5">
            <p className="text-sm text-fog">Записей пока нет.</p>
          </Card>
        </div>

        <p className="mono-label mt-10 text-center text-fog/35">
          mycoo workspace · {data?.scope.name ?? company}
        </p>
      </main>
    </div>
  );
}
