export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export interface TaskAssignee { departmentId: string; email: string; name: string | null; userId: string | null; }
export interface Task {
  id: string;
  departmentId: string;
  departments: Array<{ id: string; name: string }>;
  isShared: boolean;
  canManage: boolean;
  canComplete: boolean;
  title: string;
  assignees: TaskAssignee[];
  startDate: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  successCriteria: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
export interface TaskInput {
  title: string;
  assignees: Array<Pick<TaskAssignee, 'departmentId' | 'email'>>;
  startDate: string;
  dueDate: string;
  priority: Task['priority'];
  successCriteria: string;
}
export function taskAssigneeNames(task: Task) {
  return [...new Map(task.assignees.map((a) => [a.email, (a.name || a.email) + (a.userId ? '' : ' (приглашён)')])).values()].join(', ') || 'Не назначены';
}

export function taskDateRange(task: Pick<Task, 'startDate' | 'dueDate'>) {
  const format = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('ru-RU');
  return task.startDate === task.dueDate ? format(task.dueDate) : format(task.startDate) + ' — ' + format(task.dueDate);
}
