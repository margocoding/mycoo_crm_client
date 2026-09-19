import { Task, useTasks } from "../../../../context/TasksContext";
import { TaskActions, TaskStatusSelect } from "./TaskControls";
import { taskAssigneeNames } from "@/types/task.types";
import { LuCalendarDays, LuCircleCheck, LuUsers } from "react-icons/lu";
interface KanbanColumnProps {
  status: "backlog" | "in-progress" | "review" | "done";
  title: string;
  color: string;
}
const priorityColors: Record<string, string> = {
  low: "var(--color-ok)",
  medium: "var(--color-warn)",
  high: "var(--color-crit)",
};
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};
function TaskCard({ task }: { task: Task }) {
  const priorityColor = priorityColors[task.priority];
  const priorityLabel = priorityLabels[task.priority];
  return (
    <article className="group relative overflow-hidden rounded-md border border-line/60 bg-hull/35 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-hull/55">
      {" "}
      <div
        className="absolute inset-y-0 left-0 w-px opacity-60 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: priorityColor }}
      />{" "}
      <div className="min-w-0 p-3.5 pl-4 sm:p-4 sm:pl-[17px]">
        {" "}
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          {" "}
          <div className="min-w-0 flex-1">
            {" "}
            <h4 className="break-words text-[13px] font-semibold leading-snug text-snow sm:text-[13.5px]">
              {" "}
              {task.title}{" "}
            </h4>{" "}
          </div>{" "}
          <div className="shrink-0">
            {" "}
            <TaskActions task={task} />{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-3 flex min-w-0 flex-col gap-2 text-[11px] text-fog/75 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5">
          {" "}
          <div className="flex min-w-0 items-center gap-1.5">
            {" "}
            <LuUsers className="h-3.5 w-3.5 shrink-0 text-fog/45" />{" "}
            <span className="min-w-0 truncate">
              {" "}
              {taskAssigneeNames(task)}{" "}
            </span>{" "}
          </div>{" "}
          <div className="flex shrink-0 items-center gap-1.5">
            {" "}
            <LuCalendarDays className="h-3.5 w-3.5 shrink-0 text-fog/45" />{" "}
            <span>
              {" "}
              {new Date(task.dueDate).toLocaleDateString("ru-RU")}{" "}
            </span>{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {" "}
          <span
            className="inline-flex w-fit items-center rounded px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em]"
            style={{
              backgroundColor: `${priorityColor}12`,
              color: priorityColor,
            }}
          >
            {" "}
            {priorityLabel}{" "}
          </span>{" "}
          <div className="min-w-0 sm:max-w-[55%]">
            {" "}
            <TaskStatusSelect task={task} />{" "}
          </div>{" "}
        </div>{" "}
        {task.successCriteria && (
          <div className="mt-3 border-t border-line/40 pt-3">
            {" "}
            <div className="flex min-w-0 items-start gap-2">
              {" "}
              <LuCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ion/70" />{" "}
              <div className="min-w-0 flex-1">
                {" "}
                <p className="mono-label text-[8px] text-fog/45">
                  {" "}
                  критерий результата{" "}
                </p>{" "}
                <p className="mt-1 break-words text-[11px] leading-relaxed text-fog/75 sm:text-[11.5px]">
                  {" "}
                  {task.successCriteria}{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </article>
  );
}
function ColumnHeader({
  column,
  count,
}: {
  column: KanbanColumnProps;
  count: number;
}) {
  return (
    <div className="mb-3">
      {" "}
      <div className="flex min-w-0 items-center justify-between gap-3">
        {" "}
        <div className="flex min-w-0 items-center gap-2">
          {" "}
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: column.color,
              boxShadow: `0 0 10px ${column.color}70`,
            }}
          />{" "}
          <h3 className="font-display min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-mist sm:text-[12px] sm:tracking-[0.14em]">
            {" "}
            {column.title}{" "}
          </h3>{" "}
        </div>{" "}
        <span
          className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold"
          style={{
            borderColor: `${column.color}30`,
            color: column.color,
            backgroundColor: `${column.color}08`,
          }}
        >
          {" "}
          {String(count).padStart(2, "0")}{" "}
        </span>{" "}
      </div>{" "}
      <div className="mt-2 h-px bg-line/40">
        {" "}
        <div
          className="h-px w-8 transition-all duration-300"
          style={{
            backgroundColor: column.color,
            boxShadow: `0 0 8px ${column.color}60`,
          }}
        />{" "}
      </div>{" "}
    </div>
  );
}
export default function KanbanBoard() {
  const { tasks } = useTasks();
  const columns: KanbanColumnProps[] = [
    { status: "backlog", title: "Backlog", color: "var(--color-fog)" },
    { status: "in-progress", title: "В работе", color: "var(--color-flux)" },
    { status: "review", title: "На проверке", color: "var(--color-warn)" },
    { status: "done", title: "Готово", color: "var(--color-ok)" },
  ];
  return (
    <div className="min-w-0">
      {" "}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        {" "}
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.status,
          );
          return (
            <section key={column.status} className="min-w-0">
              {" "}
              <ColumnHeader column={column} count={columnTasks.length} />{" "}
              <div className="space-y-2.5">
                {" "}
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="flex min-h-[76px] items-center justify-center rounded-md border border-dashed border-line/35 bg-hull/15 px-4 sm:min-h-[100px]">
                    {" "}
                    <div className="text-center">
                      {" "}
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-fog/30">
                        {" "}
                        empty{" "}
                      </p>{" "}
                      <p className="mt-1 text-[11px] text-fog/35">
                        {" "}
                        Нет задач{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </section>
          );
        })}{" "}
      </div>{" "}
    </div>
  );
}
