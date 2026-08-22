import { useMemo, useState } from 'react';
import { useTasks } from '../context/TasksContext';
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuUser,
} from 'react-icons/lu';

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

const monthNames = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function formatDate(date: Date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastDate(date: Date) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

function TaskPriority({
  priority,
}: {
  priority: string;
}) {
  const color = priorityColors[priority] ?? priorityColors.medium;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold"
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />

      {priorityLabels[priority] ?? priority}
    </span>
  );
}

export default function TaskCalendar() {
  const { tasks } = useTasks();

  const today = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(today);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);

    // JS: Sunday = 0, Monday = 1...
    // Convert to Monday-based index.
    const startingDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
    ).getDate();

    const result: Array<{
      day: number | null;
      date: Date | null;
      key: string;
    }> = [];

    for (let i = 0; i < startingDay; i++) {
      result.push({
        day: null,
        date: null,
        key: `empty-${i}`,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);

      result.push({
        day,
        date,
        key: getDateKey(currentYear, currentMonth, day),
      });
    }

    return result;
  }, [currentMonth, currentYear]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();

    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const existing = map.get(task.dueDate) ?? [];

      map.set(task.dueDate, [...existing, task]);
    });

    return map;
  }, [tasks]);

  const selectedDateKey = getDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );

  const selectedTasks = tasksByDate.get(selectedDateKey) ?? [];

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentYear, currentMonth - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentYear, currentMonth + 1, 1),
    );
  };

  const goToToday = () => {
    const todayDate = new Date();

    setCurrentDate(
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1,
      ),
    );

    setSelectedDate(todayDate);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const monthTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;

      const date = new Date(task.dueDate);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }, [tasks, currentMonth, currentYear]);

  const priorityCounts = useMemo(() => {
    return {
      high: monthTasks.filter((task) => task.priority === 'high').length,
      medium: monthTasks.filter((task) => task.priority === 'medium').length,
      low: monthTasks.filter((task) => task.priority === 'low').length,
    };
  }, [monthTasks]);

  return (
    <div className="glass corner overflow-hidden rounded-xl">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-line/30 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          {/* Month */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flux/10 text-flux sm:flex">
              <LuCalendarDays className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-snow sm:text-lg">
                {monthNames[currentMonth]} {currentYear}
              </h3>

              <p className="mt-0.5 text-[10px] text-fog/50">
                {monthTasks.length}{' '}
                {monthTasks.length === 1
                  ? 'задача'
                  : monthTasks.length < 5
                    ? 'задачи'
                    : 'задач'}{' '}
                с дедлайном
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="
                hidden
                rounded-md
                border border-line/40
                bg-hull/30
                px-3
                py-2
                text-[10px]
                font-medium
                text-fog/70
                transition-colors
                hover:border-line
                hover:text-snow
                sm:block
              "
            >
              Сегодня
            </button>

            <button
              type="button"
              onClick={goToPreviousMonth}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-md
                border border-line/40
                bg-hull/20
                text-fog/60
                transition-colors
                hover:border-line
                hover:bg-hull/40
                hover:text-snow
                active:scale-95
              "
              aria-label="Предыдущий месяц"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToNextMonth}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-md
                border border-line/40
                bg-hull/20
                text-fog/60
                transition-colors
                hover:border-line
                hover:bg-hull/40
                hover:text-snow
                active:scale-95
              "
              aria-label="Следующий месяц"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile today button */}
        <button
          type="button"
          onClick={goToToday}
          className="
            mt-3
            block
            w-full
            rounded-md
            border border-line/40
            bg-hull/20
            py-2
            text-[10px]
            font-medium
            text-fog/60
            transition-colors
            hover:border-line
            hover:text-snow
            sm:hidden
          "
        >
          Перейти к сегодня
        </button>
      </div>

      {/* ====================================================== */}
      {/* CALENDAR */}
      {/* ====================================================== */}

      <div className="p-3 sm:p-4 md:p-5">
        {/* Week days */}
        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`
                py-1.5
                text-center
                text-[9px]
                font-medium
                uppercase
                tracking-wider
                ${
                  index >= 5
                    ? 'text-fog/30'
                    : 'text-fog/45'
                }
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((item) => {
            if (!item.date || item.day === null) {
              return (
                <div
                  key={item.key}
                  className="min-h-[52px] sm:min-h-[76px] md:min-h-[92px]"
                />
              );
            }

            const dateKey = getDateKey(
              item.date.getFullYear(),
              item.date.getMonth(),
              item.date.getDate(),
            );

            const dayTasks = tasksByDate.get(dateKey) ?? [];

            const isToday = isSameDay(item.date, today);
            const isSelected = isSameDay(
              item.date,
              selectedDate,
            );
            const isPast = isPastDate(item.date);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectDate(item.date!)}
                className={`
                  group
                  relative
                  min-h-[52px]
                  rounded-lg
                  border
                  p-1.5
                  text-left
                  transition-all
                  sm:min-h-[76px]
                  sm:p-2
                  md:min-h-[92px]
                  ${
                    isSelected
                      ? 'border-flux/70 bg-flux/8 shadow-[inset_0_0_20px_rgba(56,189,248,0.03)]'
                      : isToday
                        ? 'border-flux/40 bg-flux/5'
                        : 'border-line/25 bg-hull/5 hover:border-line/60 hover:bg-hull/20'
                  }
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      flex
                      h-6
                      min-w-6
                      items-center
                      justify-center
                      rounded-md
                      text-xs
                      font-medium
                      ${
                        isToday
                          ? 'bg-flux text-void font-bold'
                          : isSelected
                            ? 'text-flux'
                            : isPast
                              ? 'text-fog/35'
                              : 'text-fog/70'
                      }
                    `}
                  >
                    {item.day}
                  </span>

                  {/* Task count desktop */}
                  {dayTasks.length > 0 && (
                    <span className="hidden text-[8px] text-fog/40 sm:block">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Task indicators */}
                {dayTasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {/* Desktop task previews */}
                    <div className="hidden sm:block">
                      {dayTasks.slice(0, 2).map((task) => {
                        const color =
                          priorityColors[task.priority] ??
                          priorityColors.medium;

                        return (
                          <div
                            key={task.id}
                            className="mb-1 truncate rounded px-1.5 py-1 text-[8px] leading-none"
                            style={{
                              backgroundColor: `${color}12`,
                              color,
                            }}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        );
                      })}

                      {dayTasks.length > 2 && (
                        <span className="text-[8px] text-fog/40">
                          +{dayTasks.length - 2} ещё
                        </span>
                      )}
                    </div>

                    {/* Mobile dots */}
                    <div className="flex items-center gap-1 sm:hidden">
                      {dayTasks.slice(0, 3).map((task) => (
                        <span
                          key={task.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              priorityColors[task.priority] ??
                              priorityColors.medium,
                          }}
                        />
                      ))}

                      {dayTasks.length > 3 && (
                        <span className="text-[7px] text-fog/40">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================== */}
      {/* SELECTED DAY */}
      {/* ====================================================== */}

      <div className="border-t border-line/30">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-5">
          <div>
            <p className="mono-label text-[9px] uppercase tracking-wider text-fog/40">
              Выбранный день
            </p>

            <h4 className="mt-1 text-sm font-semibold text-snow">
              {formatDate(selectedDate)}
            </h4>
          </div>

          {selectedTasks.length > 0 && (
            <span className="rounded-md bg-flux/10 px-2 py-1 text-[10px] font-medium text-flux">
              {selectedTasks.length}{' '}
              {selectedTasks.length === 1
                ? 'задача'
                : selectedTasks.length < 5
                  ? 'задачи'
                  : 'задач'}
            </span>
          )}
        </div>

        {selectedTasks.length === 0 ? (
          <div className="border-t border-line/15 px-4 py-8 text-center md:px-5">
            <p className="text-xs text-fog/40">
              На этот день задач нет
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line/15 border-t border-line/15">
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-hull/10 sm:flex-row sm:items-center sm:justify-between md:px-5"
              >
                {/* Task info */}
                <div className="min-w-0">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          priorityColors[task.priority] ??
                          priorityColors.medium,
                      }}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-snow">
                        {task.title}
                      </p>

                      {task.successCriteria && (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-fog/45">
                          {task.successCriteria}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex shrink-0 flex-wrap items-center gap-3 pl-4 sm:pl-0">
                  {task.assignee && (
                    <div className="flex items-center gap-1.5 text-[10px] text-fog/50">
                      <LuUser className="h-3.5 w-3.5" />
                      <span>{task.assignee}</span>
                    </div>
                  )}

                  <TaskPriority priority={task.priority} />

                  <span className="rounded-md border border-line/30 bg-hull/20 px-2 py-1 text-[9px] text-fog/50">
                    {task.status === 'backlog'
                      ? 'Backlog'
                      : task.status === 'in-progress'
                        ? 'В работе'
                        : task.status === 'review'
                          ? 'На проверке'
                          : 'Готово'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* LEGEND */}
      {/* ====================================================== */}

      <div className="border-t border-line/30 px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {(['high', 'medium', 'low'] as const).map((priority) => (
            <div
              key={priority}
              className="flex items-center gap-1.5"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    priorityColors[priority],
                }}
              />

              <span className="text-[10px] text-fog/50">
                {priorityLabels[priority]}:{' '}
                {priorityCounts[priority]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}