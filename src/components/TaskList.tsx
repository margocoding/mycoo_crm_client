import { useTasks } from '../context/TasksContext';
import { LuCalendarDays, LuUser, LuTrash2 } from 'react-icons/lu';

const priorityColors: Record<string, string> = {
  low: 'var(--color-ok)',
  medium: 'var(--color-warn)',
  high: 'var(--color-crit)',
};

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  'in-progress': 'В работе',
  review: 'На проверке',
  done: 'Готово',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(date: string, status: string) {
  if (status === 'done') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = priorityColors[priority];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />

      {priorityLabels[priority] ?? priority}
    </span>
  );
}

function StatusSelect({
  status,
  onChange,
}: {
  status: string;
  onChange: (status: string) => void;
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full
        appearance-none
        rounded-lg
        border border-line/50
        bg-hull/50
        px-3
        py-2
        text-xs
        text-mist
        outline-none
        transition-colors
        hover:border-line
        focus:border-flux
        sm:w-auto
        sm:min-w-[125px]
      "
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default function TaskList() {
  const { tasks, updateTask, deleteTask } = useTasks();

  if (tasks.length === 0) {
    return (
      <div className="glass corner rounded-xl border border-dashed border-line/30 p-10 text-center sm:p-12">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-hull/50 text-fog/40">
          <LuCalendarDays className="h-5 w-5" />
        </div>

        <p className="text-sm text-fog/50">
          Нет задач. Создайте первую задачу!
        </p>
      </div>
    );
  }

  return (
    <div className="glass corner overflow-hidden rounded-xl">
      {/* ========================= */}
      {/* DESKTOP */}
      {/* ========================= */}

      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line/40">
              <th className="px-5 py-3 text-left">
                <span className="mono-label text-[10px] font-normal uppercase tracking-wider text-fog/50">
                  Название
                </span>
              </th>

              <th className="px-4 py-3 text-left">
                <span className="mono-label text-[10px] font-normal uppercase tracking-wider text-fog/50">
                  Ответственный
                </span>
              </th>

              <th className="px-4 py-3 text-left">
                <span className="mono-label text-[10px] font-normal uppercase tracking-wider text-fog/50">
                  Срок
                </span>
              </th>

              <th className="px-4 py-3 text-center">
                <span className="mono-label text-[10px] font-normal uppercase tracking-wider text-fog/50">
                  Приоритет
                </span>
              </th>

              <th className="px-4 py-3 text-center">
                <span className="mono-label text-[10px] font-normal uppercase tracking-wider text-fog/50">
                  Статус
                </span>
              </th>

              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {tasks.map((task, index) => {
              const overdue = isOverdue(task.dueDate, task.status);

              return (
                <tr
                  key={task.id}
                  className={`
                    border-b border-line/20
                    transition-colors
                    hover:bg-hull/20
                    ${index % 2 === 0 ? '' : 'bg-hull/10'}
                  `}
                >
                  {/* Title */}
                  <td className="max-w-[360px] px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-snow">
                        {task.title}
                      </p>

                      {task.successCriteria && (
                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-ion" />

                          <p className="truncate text-[10px] text-ion/70">
                            {task.successCriteria}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-mist">
                      <LuUser className="h-3.5 w-3.5 text-fog/40" />
                      <span>{task.assignee || '—'}</span>
                    </div>
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        overdue ? 'text-crit' : 'text-mist'
                      }`}
                    >
                      <LuCalendarDays className="h-3.5 w-3.5 opacity-60" />

                      <span>{formatDate(task.dueDate)}</span>
                    </div>

                    {overdue && (
                      <span className="mt-1 block text-[9px] text-crit/70">
                        Просрочено
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-4 text-center">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusSelect
                      status={task.status}
                      onChange={(status) =>
                        updateTask(task.id, {
                          status: status as any,
                        })
                      }
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="
                        rounded-md
                        p-2
                        text-fog/30
                        transition-colors
                        hover:bg-crit/10
                        hover:text-crit
                      "
                      title="Удалить"
                      aria-label={`Удалить задачу ${task.title}`}
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================= */}
      {/* MOBILE */}
      {/* ========================= */}

      <div className="divide-y divide-line/20 md:hidden">
        {tasks.map((task) => {
          const overdue = isOverdue(task.dueDate, task.status);

          return (
            <article
              key={task.id}
              className="p-4 transition-colors active:bg-hull/20"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-5 text-snow">
                    {task.title}
                  </h3>

                  {task.successCriteria && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ion" />

                      <p className="line-clamp-2 text-[10px] leading-4 text-ion/70">
                        {task.successCriteria}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="
                    shrink-0
                    rounded-lg
                    p-2
                    -mr-1
                    -mt-1
                    text-fog/30
                    transition-colors
                    active:bg-crit/10
                    active:text-crit
                  "
                  title="Удалить"
                  aria-label={`Удалить задачу ${task.title}`}
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Assignee */}
                <div className="flex items-center gap-1.5 text-[11px] text-fog/60">
                  <LuUser className="h-3.5 w-3.5 text-fog/40" />
                  <span>{task.assignee || 'Не назначен'}</span>
                </div>

                {/* Due date */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${
                    overdue ? 'text-crit' : 'text-fog/60'
                  }`}
                >
                  <LuCalendarDays className="h-3.5 w-3.5 opacity-60" />
                  <span>{formatDate(task.dueDate)}</span>

                  {overdue && (
                    <span className="text-[9px] font-medium uppercase">
                      Просрочено
                    </span>
                  )}
                </div>

                {/* Priority */}
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Status */}
              <div className="mt-4">
                <StatusSelect
                  status={task.status}
                  onChange={(status) =>
                    updateTask(task.id, {
                      status: status as any,
                    })
                  }
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}