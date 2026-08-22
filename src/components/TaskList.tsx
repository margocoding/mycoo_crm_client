import { useTasks } from '../context/TasksContext';

const priorityColors: Record<string, string> = {
  low: 'var(--color-ok)',
  medium: 'var(--color-warn)',
  high: 'var(--color-crit)',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  'in-progress': 'В работе',
  review: 'На проверке',
  done: 'Готово',
};

export default function TaskList() {
  const { tasks, updateTask, deleteTask } = useTasks();

  if (tasks.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center border border-dashed border-line/30">
        <p className="text-fog/50">Нет задач. Создайте первую задачу!</p>
      </div>
    );
  }

  return (
    <div className="glass corner rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line/40">
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-left px-4 py-3">
                Название
              </th>
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-left px-4 py-3">
                Ответственный
              </th>
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-left px-4 py-3">
                Срок
              </th>
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-center px-4 py-3">
                Приоритет
              </th>
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-center px-4 py-3">
                Статус
              </th>
              <th className="mono-label text-[10px] text-fog/50 font-normal uppercase tracking-wider text-right px-4 py-3">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr
                key={task.id}
                className={`border-b border-line/20 hover:bg-hull/20 transition-colors ${
                  index % 2 === 0 ? '' : 'bg-hull/10'
                }`}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-snow">{task.title}</p>
                    {task.successCriteria && (
                      <p className="mono-label text-[9px] text-ion/70 mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-ion" />
                        {task.successCriteria}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-mist">{task.assignee}</td>
                <td className="px-4 py-3 text-sm text-mist">
                  {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="text-[10px] font-medium px-2.5 py-1 rounded"
                    style={{
                      backgroundColor: `${priorityColors[task.priority]}15`,
                      color: priorityColors[task.priority],
                    }}
                  >
                    {task.priority === 'low' ? 'Низкий' : task.priority === 'medium' ? 'Средний' : 'Высокий'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                    className="mono-label text-[9px] bg-hull/40 border border-line rounded px-2 py-1 text-fog/70 focus:border-flux focus:outline-none cursor-pointer"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Готово</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-fog/40 hover:text-crit transition-colors"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
