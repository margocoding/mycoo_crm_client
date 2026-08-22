import { Task, useTasks } from '../context/TasksContext';
import { LuX } from 'react-icons/lu';
import Select from './Select';

interface KanbanColumnProps {
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  title: string;
  color: string;
}

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

const statusOptions = [
  {
    value: 'backlog',
    label: 'Backlog',
    color: 'var(--color-fog)',
  },
  {
    value: 'in-progress',
    label: 'В работе',
    color: 'var(--color-flux)',
  },
  {
    value: 'review',
    label: 'На проверке',
    color: 'var(--color-warn)',
  },
  {
    value: 'done',
    label: 'Готово',
    color: 'var(--color-ok)',
  },
];

function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask } = useTasks();

  const handleStatusChange = (newStatus: string) => {
    updateTask(task.id, {
      status: newStatus as Task['status'],
    });
  };

  return (
    <div className="group glass corner rounded-lg p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line/80">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-snow leading-snug">
          {task.title}
        </h4>

        <button
          onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-fog/40 hover:text-crit transition-all cursor-pointer"
          title="Удалить задачу"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="mono-label text-[9px] text-fog/50">
            ОТВЕТСТВЕННЫЙ
          </span>

          <span className="text-xs text-mist">
            {task.assignee}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="mono-label text-[9px] text-fog/50">
            СРОК
          </span>

          <span className="text-xs text-mist">
            {new Date(task.dueDate).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>

      {/* Priority + Status */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded"
          style={{
            backgroundColor: `${priorityColors[task.priority]}15`,
            color: priorityColors[task.priority],
          }}
        >
          {priorityLabels[task.priority]}
        </span>

        <Select
          options={statusOptions}
          value={task.status}
          onChange={handleStatusChange}
        />
      </div>

      {/* Success criteria */}
      {task.successCriteria && (
        <div className="pt-3 border-t border-line/40">
          <p className="mono-label text-[9px] text-ion/80 mb-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-ion" />
            Критерий результата
          </p>

          <p className="text-xs text-fog/70 leading-relaxed">
            {task.successCriteria}
          </p>
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard() {
  const { tasks } = useTasks();

  const columns: KanbanColumnProps[] = [
    {
      status: 'backlog',
      title: 'Backlog',
      color: 'var(--color-fog)',
    },
    {
      status: 'in-progress',
      title: 'В работе',
      color: 'var(--color-flux)',
    },
    {
      status: 'review',
      title: 'На проверке',
      color: 'var(--color-warn)',
    },
    {
      status: 'done',
      title: 'Готово',
      color: 'var(--color-ok)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const columnTasks = tasks.filter(
          (task) => task.status === col.status
        );

        return (
          <div
            key={col.status}
            className="flex flex-col min-h-[400px]"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-line/40">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: col.color,
                    boxShadow: `0 0 8px ${col.color}60`,
                  }}
                />

                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-mist">
                  {col.title}
                </h3>
              </div>

              <span className="mono-label text-[10px] text-fog/50 bg-hull/30 px-2 py-0.5 rounded">
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks */}
            {/* ВАЖНО: здесь больше нет overflow-y-auto */}
            <div className="space-y-3 pr-1">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                  />
                ))
              ) : (
                <div className="glass rounded-lg p-6 text-center border border-dashed border-line/30">
                  <p className="text-xs text-fog/40">
                    Нет задач
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}