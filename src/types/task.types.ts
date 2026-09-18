export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export interface TaskAssignee { email: string; name: string | null; userId: string | null; }
export interface Task {
  id: string;
  departmentId: string;
  title: string;
  assignees: TaskAssignee[];
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  successCriteria: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
export interface TaskInput {
  title: string;
  assigneeEmails: string[];
  dueDate: string;
  priority: Task['priority'];
  successCriteria: string;
}
export function taskAssigneeNames(task: Task) {
  return task.assignees.map((a) => (a.name || a.email) + (a.userId ? '' : ' (приглашён)')).join(', ') || 'Не назначены';
}
