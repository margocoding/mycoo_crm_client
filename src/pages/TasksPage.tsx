import { useEffect, useState, ComponentType } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTeam } from '@/components/shared/team/TeamProvider';
import { useTasks, TasksProvider, ViewMode } from '../context/TasksContext';
import KanbanBoard from '../components/shared/dashboard/tasks/KanbanBoard';
import TaskList from '../components/shared/dashboard/tasks/TaskList';
import TaskCalendar from '../components/shared/dashboard/tasks/TaskCalendar';
import NewTaskModal from '../components/shared/dashboard/tasks/NewTaskModal';
import { LuKanban, LuList, LuCalendar, LuPlus } from 'react-icons/lu';

function TasksContent() {
  const { viewMode, setViewMode, canManage, pending, loading, error, reload, tasks, editingTask, setEditingTask } = useTasks();
  const [params, setParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (params.get('new') === '1' && canManage && !loading) {
      setIsModalOpen(true);
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  }, [params, canManage, loading, setParams]);

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
          <p className="text-sm text-fog/70 mt-1">{canManage ? 'Управляйте задачами команды' : 'Ваши задачи. Статус «Готово» устанавливает администратор.'}</p>
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

          {canManage && <button
            onClick={() => setIsModalOpen(true)}
            disabled={pending || loading}
            aria-label="Новая задача"
            className="btn-primary flex items-center gap-2 rounded-md bg-flux px-4 py-2.5 text-sm font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] hover:bg-ice transition-all"
          >
            <LuPlus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Новая задача</span>
          </button>}
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-crit/30 p-4 text-sm text-crit">{error}
        <button disabled={pending || loading} onClick={() => void reload()} className="ml-3 underline">Повторить</button>
      </div>}
      {!loading && !error && !tasks.length && canManage && <div className="glass rounded-lg p-4 text-sm text-fog">
        Создайте первую задачу: укажите срок и выберите исполнителей. Назначать можно и тем, кто ещё не принял приглашение.
      </div>}
      {loading ? <p role="status" className="text-fog">Загрузка задач…</p> : <div className="min-h-[500px]">
        {viewMode === 'kanban' && <KanbanBoard />}
        {viewMode === 'list' && <TaskList />}
        {viewMode === 'calendar' && <TaskCalendar />}
      </div>}

      {canManage && (isModalOpen || editingTask) && <NewTaskModal key={editingTask?.id ?? 'new'} task={editingTask ?? undefined}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }} />}
    </div>
  );
}

export default function TasksPage() {
  const { data, loading, error, reload } = useTeam();
  const { departmentId } = useParams();
  const navigate = useNavigate();
  if (!data) return <div className="text-sm text-fog">{loading ? 'Загрузка департаментов…' : error}
    {!loading && <button onClick={() => void reload()} className="ml-3 underline">Повторить</button>}</div>;
  const department = departmentId ? data.departments.find((d) => d.id === departmentId) : data.departments[0];
  if (!department) return <div className="glass rounded-lg p-6 text-sm text-fog">
    {departmentId ? 'Департамент недоступен.' : 'Для работы с задачами нужен департамент.'}
    <Link className="ml-3 text-flux underline" to="/dashboard/team?setup=1">Перейти к команде</Link>
  </div>;
  const departments = data.isOwner ? data.departments : [department];
  const assigneeOptions = departments.flatMap((d) => {
    const members = data.members.filter((m) => m.isOwner || m.departments.some((item) => item.id === d.id))
      .map((m) => ({ departmentId: d.id, email: m.email, name: m.name, userId: m.id as string | null }));
    return [...members, ...data.invitations.filter((i) => i.departmentId === d.id && !members.some((m) => m.email === i.email))
      .map((i) => ({ departmentId: d.id, email: i.email, name: i.name, userId: null }))];
  });
  return (
    <TasksProvider key={data.workspaceId + ':' + department.id} workspaceId={data.workspaceId} departmentId={department.id}
      departments={departments} isOwner={data.isOwner} assigneeOptions={assigneeOptions}>
      <label className="block mb-6 text-sm text-fog">Департамент
        <select aria-label="Департамент" value={department.id} onChange={(e) => navigate('/dashboard/tasks/' + e.target.value)}
          className="ml-3 max-w-full rounded-md border border-line bg-hull px-3 py-2 text-mist">
          {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </label>
      <TasksContent />
    </TasksProvider>
  );
}
