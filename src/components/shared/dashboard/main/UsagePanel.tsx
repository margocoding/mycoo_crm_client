import { useUsage } from '@/hooks/useUsage';

const number = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
const rub = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽';
const date = (value: string) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const plans = { TRIAL: 'Пробный период', START: 'Старт', MISSION: 'Бизнес', ENTERPRISE: 'Корпорация' };

export default function UsagePanel({ workspaceId, departmentId }: { workspaceId: string; departmentId?: string }) {
  const { data, error, reload } = useUsage(workspaceId, departmentId);
  if (!data) return <section className="glass mt-6 rounded-xl p-5" aria-label="Использование тарифа">
    <h2 className="font-display text-sm font-bold text-mist">Использование тарифа</h2>
    {error ? <p role="alert" className="mt-3 text-sm text-crit">{error} <button onClick={reload} className="underline">Повторить</button></p>
      : <p role="status" className="mt-3 text-sm text-fog">Загружаем расход и лимиты…</p>}
  </section>;
  const { used, reserved, limits } = data;
  const percent = used.costRub / limits.budgetRub * 100;
  const unavailable = used.costRub + reserved.costRub >= limits.budgetRub
    || (limits.inputTokens !== null && used.inputTokens + reserved.inputTokens >= limits.inputTokens)
    || (limits.outputTokens !== null && used.outputTokens + reserved.outputTokens >= limits.outputTokens);
  const tone = unavailable ? 'var(--color-crit)' : percent >= 80 ? 'var(--color-warn)' : 'var(--color-ok)';
  const resources = [
    { name: 'Пользователи', used: used.users, max: limits.users, label: `${number(used.users)} / ${number(limits.users)}` },
    { name: 'Незавершённые задачи', used: used.tasks, max: limits.tasks, label: `${number(used.tasks)} / ${number(limits.tasks)}` },
    { name: 'Распознавание', used: used.audioSeconds + reserved.audioSeconds, max: limits.audioSeconds,
      label: `${number(used.audioSeconds / 3600)} / ${number(limits.audioSeconds / 3600)} ч` },
    { name: 'Хранилище', used: used.storageBytes + reserved.storageBytes, max: limits.storageBytes,
      label: `${number(used.storageBytes / 1e9)} / ${number(limits.storageBytes / 1e9)} ГБ` },
    ...(limits.inputTokens === null ? [] : [{ name: 'Входные токены', used: used.inputTokens + reserved.inputTokens,
      max: limits.inputTokens, label: `${number(used.inputTokens)} / ${number(limits.inputTokens)}` }]),
    ...(limits.outputTokens === null ? [] : [{ name: 'Выходные токены', used: used.outputTokens + reserved.outputTokens,
      max: limits.outputTokens, label: `${number(used.outputTokens)} / ${number(limits.outputTokens)}` }]),
  ];
  return <section className="mt-6" aria-labelledby="usage-title">
    {error && <p role="alert" className="mb-3 text-sm text-warn">{error} Показан предыдущий расход. <button className="underline" onClick={reload}>Повторить</button></p>}
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="glass corner min-w-0 rounded-xl p-5 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="usage-title" className="font-display text-sm font-bold text-snow">AI-бюджет компании</h2>
          <span className="rounded-md border border-line px-2 py-1 text-xs text-fog">{plans[data.plan]}</span>
        </header>
        <p className="mt-2 text-xs text-fog">{date(data.periodStart)}{data.periodEnd ? ` — ${date(data.periodEnd)}` : ''}
          {data.plan !== 'TRIAL' && ' · обновляется ежемесячно'}</p>
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-fog">Израсходовано</p>
          <p className="tabular-nums"><strong className="font-display text-2xl text-snow">{rub(used.costRub)}</strong><span className="text-sm text-fog"> / {rub(limits.budgetRub)}</span></p>
        </div>
        <div role="progressbar" aria-label="Использование AI-бюджета" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(percent))}
          aria-valuetext={`${rub(used.costRub)} из ${rub(limits.budgetRub)}`} className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-line">
          <div className="absolute inset-y-0 left-0 bg-fog/35" style={{ width: `${Math.min(100, (used.costRub + reserved.costRub) / limits.budgetRub * 100)}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, percent)}%`, background: tone }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
          <span style={{ color: tone }}>{number(percent)}% использовано</span>
          <span className="text-fog">Доступно {rub(Math.max(0, limits.budgetRub - used.costRub - reserved.costRub))}</span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-fog">Общий бюджет на GigaChat и распознавание встреч.</p>
        {reserved.costRub > 0 && <p className="mt-2 text-xs text-warn">{rub(reserved.costRub)} зарезервировано для запросов без подтверждённого результата.</p>}
        {unavailable && <p role="status" className="mt-3 rounded-lg border border-crit/30 bg-crit/5 p-3 text-sm text-crit">AI-лимит исчерпан или занят текущими запросами. Новые запросы ограничены до обновления лимита или смены тарифа.</p>}
        <div className="mt-5 grid gap-3 border-t border-line/70 pt-4 text-xs sm:grid-cols-3 sm:gap-2">
          {[{ at: 80, label: 'Предупреждение' }, { at: 90, label: 'Повторное' }, { at: 100, label: 'Остановка AI' }].map(item =>
            <div key={item.at} className="flex min-w-0 items-baseline justify-between gap-2 sm:block"><p className={`font-semibold ${percent >= item.at ? item.at === 100 ? 'text-crit' : 'text-warn' : 'text-mist'}`}>{item.at}%</p><p className="mt-1 leading-relaxed text-fog">{item.label}</p></div>)}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fog">Предупреждения приходят собственнику и администраторам.</p>
      </div>
      <div className="glass corner min-w-0 rounded-xl p-5 md:p-6">
        <h2 className="font-display text-sm font-bold text-snow">{data.rankingScope === 'personal' ? 'Ваш расход токенов' : 'Топ-10 по расходу токенов'}</h2>
        <p className="mt-2 text-xs text-fog">{data.rankingScope === 'company' ? 'Вся компания' : data.rankingScope === 'departments' ? 'Доступные вам отделы' : 'Только ваши запросы'} · за этот период</p>
        {data.topEmployees.length ? <ol className="mt-5 divide-y divide-line/60">
          {data.topEmployees.map((person, index) => <li key={person.id} className="flex items-start gap-3 py-3">
            <span className="w-4 shrink-0 pt-0.5 text-xs tabular-nums text-fog">{index + 1}</span>
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-mist">{person.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-fog">Вход: {number(person.inputTokens)} · выход: {number(person.outputTokens)}</p></div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-flux">{number(person.totalTokens)}</span>
          </li>)}
        </ol> : <p className="my-8 text-sm leading-relaxed text-fog">Расходов пока нет. Здесь появятся данные после первых AI-запросов.</p>}
        <p className="mt-4 border-t border-line/70 pt-4 text-xs leading-relaxed text-fog">Автоматические AI-сводки: {rub(data.automaticCostRub)}. Их расход не относится к сотрудникам.</p>
      </div>
    </div>
    <details className="glass mt-4 rounded-xl px-5 py-4">
      <summary className="cursor-pointer text-sm font-semibold text-mist">Лимиты компании</summary>
      <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map(resource => <div key={resource.name} className="min-w-0">
          <dt className="text-xs text-fog">{resource.name}</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-mist">{resource.label}</dd>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line"><div className={resource.used >= resource.max ? 'h-full bg-crit' : 'h-full bg-flux/70'} style={{ width: `${Math.min(100, resource.used / resource.max * 100)}%` }} /></div>
        </div>)}
      </dl>
      {(reserved.storageBytes > 0 || data.storagePending) && <p className="mt-4 text-xs text-fog">Часть места зарезервирована под записи и загружаемые файлы. Размер уточняется после обработки.</p>}
      {reserved.audioSeconds > 0 && <p className="mt-3 text-xs text-fog">На обработку записей зарезервировано {number(reserved.audioSeconds / 60)} мин.</p>}
    </details>
  </section>;
}
