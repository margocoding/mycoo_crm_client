import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { tasksApi } from '@/api/tasks.api';
import { ApiError, errorMessage } from '@/api/base.api';
import type { Task, TaskAssignee, TaskInput, TaskStatus } from '@/types/task.types';

export type { Task } from '@/types/task.types';
export type ViewMode = 'kanban' | 'list' | 'calendar';

interface TasksContextType {
  departmentId: string;
  departments: Array<{ id: string; name: string }>;
  isOwner: boolean;
  tasks: Task[];
  canManage: boolean;
  assigneeOptions: TaskAssignee[];
  loading: boolean;
  pending: boolean;
  error: string;
  reload: () => Promise<void>;
  addTask: (task: TaskInput) => Promise<boolean>;
  updateTask: (id: string, task: TaskInput) => Promise<boolean>;
  setStatus: (id: string, status: TaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const TasksContext = createContext<TasksContextType | null>(null);

export function TasksProvider({ workspaceId, departmentId, departments, isOwner, assigneeOptions, children }: {
  workspaceId: string; departmentId: string; departments: Array<{ id: string; name: string }>;
  isOwner: boolean; assigneeOptions: TaskAssignee[]; children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const result = await tasksApi.list(workspaceId, departmentId, controller.signal);
      if (!controller.signal.aborted) {
        setTasks(result.tasks);
        setCanManage(result.canManage);
        if (!result.canManage) setEditingTask(null);
        setError('');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setTasks([]);
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) setCanManage(false);
        setError(errorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [workspaceId, departmentId]);

  useEffect(() => {
    void reload();
    const onFocus = () => { if (!busy.current) void reload(); };
    window.addEventListener('focus', onFocus);
    return () => { request.current?.abort(); window.removeEventListener('focus', onFocus); };
  }, [reload]);

  async function save(action: () => Promise<unknown>) {
    if (busy.current) return false;
    busy.current = true;
    request.current?.abort();
    setPending(true);
    setError('');
    try {
      await action();
      await reload();
      return true;
    } catch (error) {
      await reload();
      setError(errorMessage(error));
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return <TasksContext.Provider value={{
    departmentId, departments, isOwner,
    tasks, canManage, assigneeOptions, loading, pending, error, reload, editingTask, setEditingTask, viewMode, setViewMode,
    addTask: (task) => save(() => tasksApi.create(workspaceId, departmentId, task)),
    updateTask: (id, task) => save(() => tasksApi.update(workspaceId, departmentId, id, task)),
    setStatus: (id, status) => save(() => tasksApi.status(workspaceId, departmentId, id, status)),
    deleteTask: (id) => save(() => tasksApi.remove(workspaceId, departmentId, id)),
  }}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('TasksProvider is required');
  return context;
}
