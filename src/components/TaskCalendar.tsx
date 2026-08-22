import { useTasks } from '../context/TasksContext';

const priorityColors: Record<string, string> = {
  low: 'var(--color-ok)',
  medium: 'var(--color-warn)',
  high: 'var(--color-crit)',
};

export default function TaskCalendar() {
  const { tasks } = useTasks();

  // Get current month and year
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
  const totalDays = lastDay.getDate();

  // Generate calendar days
  const days = [];
  for (let i = 1; i < startingDay; i++) {
    days.push({ type: 'empty', key: `empty-${i}` });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ type: 'day', day: i, key: `day-${i}` });
  }

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => t.dueDate === dateStr);
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="glass corner rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-snow">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-flux" />
          <span className="mono-label text-[9px] text-fog/60">Дедлайны задач</span>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="mono-label text-[9px] text-fog/50 text-center py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((item: any) => {
          if (item.type === 'empty') {
            return <div key={item.key} className="aspect-square" />;
          }

          const dayTasks = getTasksForDay(item.day);
          const isToday = item.day === today.getDate();

          return (
            <div
              key={item.key}
              className={`aspect-square rounded-lg border p-1.5 transition-colors ${
                isToday
                  ? 'border-flux bg-flux/5'
                  : 'border-line/30 hover:border-line/60 hover:bg-hull/20'
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday ? 'text-flux font-bold' : 'text-fog/70'
                }`}
              >
                {item.day}
              </span>

              {dayTasks.length > 0 && (
                <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[70%] custom-scrollbar">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-[8px] truncate rounded px-1 py-0.5"
                      style={{
                        backgroundColor: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority],
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[7px] text-fog/50 text-center">
                      +{dayTasks.length - 3} ещё
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-line/30 flex flex-wrap gap-4">
        {['high', 'medium', 'low'].map((p) => {
          const count = tasks.filter((t) => t.priority === p && 
            new Date(t.dueDate).getMonth() === currentMonth &&
            new Date(t.dueDate).getFullYear() === currentYear
          ).length;
          
          return (
            <div key={p} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: priorityColors[p] }}
              />
              <span className="text-xs text-fog/60 capitalize">
                {p === 'high' ? 'Высокий' : p === 'medium' ? 'Средний' : 'Низкий'}: {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
