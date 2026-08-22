import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  successCriteria: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  createdAt: string;
}

export type ViewMode = 'kanban' | 'list' | 'calendar';

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  generateSuccessCriteria: (title: string) => Promise<string>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Подготовить коммерческое предложение',
    assignee: 'Иван',
    dueDate: '2024-09-15',
    priority: 'high',
    successCriteria: 'КП отправлено клиенту и получена обратная связь',
    status: 'in-progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Провести встречу с командой',
    assignee: 'Анна',
    dueDate: '2024-09-10',
    priority: 'medium',
    successCriteria: 'Все участники согласовали план работ',
    status: 'done',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Обновить документацию',
    assignee: 'Петр',
    dueDate: '2024-09-20',
    priority: 'low',
    successCriteria: 'Документация опубликована в базе знаний',
    status: 'backlog',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Настроить аналитику',
    assignee: 'Мария',
    dueDate: '2024-09-18',
    priority: 'high',
    successCriteria: 'Метрики отображаются в дашборде корректно',
    status: 'review',
    createdAt: new Date().toISOString(),
  },
];

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem('mycoo_tasks');
      return stored ? JSON.parse(stored) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  useEffect(() => {
    localStorage.setItem('mycoo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Имитация AI-генерации критерия результата
  const generateSuccessCriteria = async (title: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const templates: Record<string, string> = {
      'коммерческое предложение': 'КП отправлено клиенту и подтверждено получение',
      'встречу': 'Встреча проведена, зафиксированы договорённости и следующие шаги',
      'документацию': 'Документация актуализирована и размещена в репозитории',
      'аналитику': 'Данные собираются и отображаются в реальном времени',
      'отчёт': 'Отчёт подготовлен и направлен заинтересованным сторонам',
      'найм': 'Кандидат прошёл собеседование и получил оффер',
    };

    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(templates)) {
      if (lowerTitle.includes(key)) {
        return value;
      }
    }

    return `Задача выполнена и результат подтверждён ответственным`;
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        viewMode,
        setViewMode,
        generateSuccessCriteria,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
