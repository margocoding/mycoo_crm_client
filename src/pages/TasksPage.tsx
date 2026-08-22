import { useState, ComponentType } from 'react';
import { useTasks, TasksProvider, ViewMode } from '../context/TasksContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskList from '../components/TaskList';
import TaskCalendar from '../components/TaskCalendar';
import NewTaskModal from '../components/NewTaskModal';
import { LuKanban, LuList, LuCalendar, LuPlus } from 'react-icons/lu';

function TasksContent() {
  const { viewMode, setViewMode } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const viewModes: { value: ViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { value: 'kanban', label: 'Канбан', icon: LuKanban },
    { value: 'list', label: 'Список', icon: LuList },
    { value: 'calendar', label: 'Календарь', icon: LuCalendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-snow">Задачи</h2>
          <p className="text-sm text-fog/70 mt-1">Управляйте задачами команды</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 glass rounded-lg p-1">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === mode.value
                      ? 'bg-flux/15 text-snow'
                      : 'text-fog/60 hover:text-mist'
                  }`}
                  title={mode.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-md bg-flux px-4 py-2.5 text-sm font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] hover:bg-ice transition-all"
          >
            <LuPlus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Новая задача</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {viewMode === 'kanban' && <KanbanBoard />}
        {viewMode === 'list' && <TaskList />}
        {viewMode === 'calendar' && <TaskCalendar />}
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default function TasksPage() {
  return (
    <TasksProvider>
      <TasksContent />
    </TasksProvider>
  );
}