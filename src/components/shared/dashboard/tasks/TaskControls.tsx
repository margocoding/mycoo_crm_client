import { LuPencil, LuTrash2 } from 'react-icons/lu';
import Select from '@/components/ui/Select';
import { useTasks, type Task } from '@/context/TasksContext';
import type { TaskStatus } from '@/types/task.types';

const statuses = [
  { value: 'backlog', label: 'Backlog', color: 'var(--color-fog)' },
  { value: 'in-progress', label: 'В работе', color: 'var(--color-flux)' },
  { value: 'review', label: 'На проверке', color: 'var(--color-warn)' },
  { value: 'done', label: 'Готово', color: 'var(--color-ok)' },
];

export function TaskStatusSelect({ task }: { task: Task }) {
  const { pending, setStatus } = useTasks();
  return <Select value={task.status} disabled={pending} ariaLabel={'Статус задачи ' + task.title}
    options={statuses.map((s) => ({ ...s, disabled: !task.canComplete && s.value === 'done' }))}
    onChange={(status) => void setStatus(task.id, status as TaskStatus)} />;
}

export function TaskActions({ task }: { task: Task }) {
  const { pending, setEditingTask, deleteTask } = useTasks();
  if (!task.canManage) return null;
  return <div className="flex items-center gap-1 shrink-0">
    <button disabled={pending} onClick={() => setEditingTask(task)} title="Редактировать"
      aria-label={'Редактировать задачу ' + task.title} className="p-1.5 text-fog/50 hover:text-flux disabled:opacity-40">
      <LuPencil className="h-4 w-4" />
    </button>
    <button disabled={pending} onClick={() => void deleteTask(task.id)} title="Удалить"
      aria-label={'Удалить задачу ' + task.title} className="p-1.5 text-fog/50 hover:text-crit disabled:opacity-40">
      <LuTrash2 className="h-4 w-4" />
    </button>
  </div>;
}

export function TaskDepartments({ task }: { task: Task }) {
  if (!task.isShared) return null;
  return <p className="mt-1.5 text-[10px] leading-relaxed text-ion">
    {task.departments.length > 1 ? task.departments.map((d) => d.name).join(' · ') : 'Общая задача нескольких департаментов'}
  </p>;
}
