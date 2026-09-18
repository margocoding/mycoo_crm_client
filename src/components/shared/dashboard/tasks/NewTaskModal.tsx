import { useState, type FormEvent } from 'react';
import { useTasks, type Task } from '@/context/TasksContext';
import { Modal } from '@/components/ui/Modal';

const fieldClass = 'w-full rounded-md border border-line bg-hull/30 px-4 py-2.5 text-mist placeholder-fog/40 focus:border-flux focus:outline-none focus:ring-1 focus:ring-flux/30';
const priorityOptions = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
] as const;

const criteriaTemplates: Record<string, string> = {
  'коммерческое предложение': 'КП отправлено клиенту и подтверждено получение',
  'встречу': 'Встреча проведена, зафиксированы договорённости и следующие шаги',
  'документацию': 'Документация актуализирована и размещена в репозитории',
  'аналитику': 'Данные собираются и отображаются в реальном времени',
  'отчёт': 'Отчёт подготовлен и направлен заинтересованным сторонам',
  'найм': 'Кандидат прошёл собеседование и получил оффер',
};

export default function NewTaskModal({ onClose, task }: { onClose: () => void; task?: Task }) {
  const { addTask, updateTask, assigneeOptions, pending, error } = useTasks();
  const [title, setTitle] = useState(task?.title ?? '');
  const [emails, setEmails] = useState(task?.assignees.map((a) => a.email) ?? []);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [successCriteria, setSuccessCriteria] = useState(task?.successCriteria ?? '');
  const [validation, setValidation] = useState('');
  const options = [...assigneeOptions, ...(task?.assignees ?? [])
    .filter((a) => !assigneeOptions.some((o) => o.email === a.email))];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!emails.length) { setValidation('Выберите хотя бы одного исполнителя.'); return; }
    setValidation('');
    const data = { title: title.trim(), assigneeEmails: emails, dueDate, priority, successCriteria: successCriteria.trim() };
    const saved = task ? await updateTask(task.id, data) : await addTask(data);
    if (saved) onClose();
  }

  return <Modal isOpen onClose={() => !pending && onClose()} maxWidth="max-w-lg" showLogo={false}
    title={task ? 'Редактировать задачу' : 'Новая задача'} ariaLabel={task ? 'Редактировать задачу' : 'Новая задача'}>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-60">
        <label className="block">
          <span className="block mono-label text-fog/70 mb-2">Название</span>
          <input autoFocus required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Подготовить коммерческое предложение" className={fieldClass} />
        </label>
        <fieldset>
          <legend className="mono-label text-fog/70 mb-2">Исполнители</legend>
          <div className="max-h-40 overflow-y-auto rounded-md border border-line bg-hull/20 p-2 space-y-1">
            {options.map((person) => <label key={person.email} className="flex items-start gap-2 p-2 rounded hover:bg-hull/50 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-flux" checked={emails.includes(person.email)}
                onChange={(e) => setEmails((current) => e.target.checked ? [...current, person.email] : current.filter((v) => v !== person.email))} />
              <span className="min-w-0 text-sm text-mist break-words">{person.name || person.email}
                <span className="block text-xs text-fog/60">{person.name ? person.email : ''}{!person.userId ? ' · Приглашён, ещё не присоединился' : ''}</span>
              </span>
            </label>)}
            {!options.length && <p className="p-2 text-sm text-fog">Сначала пригласите участника в департамент.</p>}
          </div>
        </fieldset>
        <label className="block">
          <span className="block mono-label text-fog/70 mb-2">Срок</span>
          <input type="date" required min="1900-01-01" max="9999-12-31" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
        </label>
        <fieldset>
          <legend className="mono-label text-fog/70 mb-2">Приоритет</legend>
          <div className="flex gap-2">
            {priorityOptions.map((opt) => <button key={opt.value} type="button" aria-pressed={priority === opt.value}
              onClick={() => setPriority(opt.value)} className={'flex-1 rounded-md border px-2 py-2.5 text-sm transition-colors ' +
                (priority === opt.value ? 'border-flux bg-flux/10 text-snow' : 'border-line bg-hull/20 text-fog')}>
              {opt.label}
            </button>)}
          </div>
        </fieldset>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="task-criteria" className="mono-label text-fog/70">Критерий результата</label>
            <button type="button" disabled={!title.trim()} className="text-xs text-ion disabled:opacity-40"
              onClick={() => setSuccessCriteria(Object.entries(criteriaTemplates).find(([key]) => title.toLowerCase().includes(key))?.[1]
                ?? 'Задача выполнена и результат подтверждён ответственным')}>
              Подставить шаблон
            </button>
          </div>
          <textarea id="task-criteria" rows={3} maxLength={3000} value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder="КП отправлено клиенту и получена обратная связь" className={fieldClass + ' resize-none'} />
        </div>
      </fieldset>
      {(validation || error) && <p role="alert" className="text-sm text-crit">{validation || error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending || !title.trim()} className="flex-1 rounded-md bg-flux px-4 py-3 text-sm font-bold text-void hover:bg-ice disabled:opacity-50">
          {pending ? 'Сохранение…' : task ? 'Сохранить' : 'Создать задачу'}
        </button>
        <button type="button" disabled={pending} onClick={onClose} className="rounded-md border border-line px-4 py-3 text-sm text-fog hover:text-snow">Отмена</button>
      </div>
    </form>
  </Modal>;
}
