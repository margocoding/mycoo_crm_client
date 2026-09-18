import { api } from './base.api';
import type { Task, TaskInput, TaskStatus } from '@/types/task.types';

const path = (workspaceId: string, departmentId: string) =>
  '/workspace/' + encodeURIComponent(workspaceId) + '/departments/' + encodeURIComponent(departmentId) + '/tasks';

export const tasksApi = {
  list: (workspaceId: string, departmentId: string, signal?: AbortSignal) =>
    api.get<{ canManage: boolean; tasks: Task[] }>(path(workspaceId, departmentId), { signal }).then((r) => r.data),
  create: (workspaceId: string, departmentId: string, data: TaskInput) =>
    api.post<Task>(path(workspaceId, departmentId), data).then((r) => r.data),
  update: (workspaceId: string, departmentId: string, id: string, data: TaskInput) =>
    api.patch<Task>(path(workspaceId, departmentId) + '/' + id, data).then((r) => r.data),
  status: (workspaceId: string, departmentId: string, id: string, status: TaskStatus) =>
    api.patch<Task>(path(workspaceId, departmentId) + '/' + id + '/status', { status }).then((r) => r.data),
  remove: (workspaceId: string, departmentId: string, id: string) =>
    api.delete(path(workspaceId, departmentId) + '/' + id),
};
