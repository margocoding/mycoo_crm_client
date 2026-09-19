import { useState, type FormEvent } from "react";
import {
  LuArrowRight,
  LuCalendarDays,
  LuCheck,
  LuSparkles,
  LuUsers,
} from "react-icons/lu";
import { useTasks, type Task } from "@/context/TasksContext";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
const priorityOptions = [
  { value: "low", label: "Низкий", color: "var(--color-ok)" },
  { value: "medium", label: "Средний", color: "var(--color-warn)" },
  { value: "high", label: "Высокий", color: "var(--color-crit)" },
] as const;
const criteriaTemplates: Record<string, string> = {
  "коммерческое предложение": "КП отправлено клиенту и подтверждено получение",
  встречу: "Встреча проведена, зафиксированы договорённости и следующие шаги",
  документацию: "Документация актуализирована и размещена в репозитории",
  аналитику: "Данные собираются и отображаются в реальном времени",
  отчёт: "Отчёт подготовлен и направлен заинтересованным сторонам",
  найм: "Кандидат прошёл собеседование и получил оффер",
};
const inputClass =
  "w-full min-w-0 rounded-md border border-line bg-void/50 px-3.5 py-3 text-[13px] text-snow placeholder:text-fog/35 outline-none transition-all duration-200 focus:border-flux/60 focus:bg-hull/30 focus:ring-1 focus:ring-flux/20";
function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex min-w-0 items-center gap-2">
      {" "}
      {icon && <span className="shrink-0 text-fog/45"> {icon} </span>}{" "}
      <span className="mono-label min-w-0 truncate text-[9px] text-fog/60">
        {" "}
        {children}{" "}
      </span>{" "}
    </div>
  );
}
export default function NewTaskModal({
  onClose,
  task,
}: {
  onClose: () => void;
  task?: Task;
}) {
  const { addTask, updateTask, assigneeOptions, departmentId, departments, isOwner, pending, error } = useTasks();
  const [title, setTitle] = useState(task?.title ?? "");
  const [assignments, setAssignments] = useState(
    task?.assignees.map(({ email, departmentId }) => ({ email, departmentId })) ?? [],
  );
  const [selectedDepartments, setSelectedDepartments] = useState(task?.departments.map((d) => d.id) ?? [departmentId]);
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [priority, setPriority] = useState<Task["priority"]>(
    task?.priority ?? "medium",
  );
  const [successCriteria, setSuccessCriteria] = useState(
    task?.successCriteria ?? "",
  );
  const [validation, setValidation] = useState("");
  const options = [
    ...assigneeOptions,
    ...(task?.assignees ?? []).filter(
      (a) => !assigneeOptions.some((o) => o.email === a.email && o.departmentId === a.departmentId),
    ),
  ].filter((a) => selectedDepartments.includes(a.departmentId));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (selectedDepartments.some((id) => !assignments.some((a) => a.departmentId === id))) {
      setValidation("Выберите хотя бы одного исполнителя в каждом выбранном департаменте.");
      return;
    }
    if (!startDate || !dueDate || startDate > dueDate) {
      setValidation("Укажите даты начала и окончания: начало не должно быть позже окончания.");
      return;
    }
    setValidation("");
    const data = {
      title: title.trim(),
      assignees: assignments,
      startDate,
      dueDate,
      priority,
      successCriteria: successCriteria.trim(),
    };
    const saved = task ? await updateTask(task.id, data) : await addTask(data);
    if (saved) {
      onClose();
    }
  }
  function insertCriteriaTemplate() {
    const normalized = title.toLowerCase();
    const template =
      Object.entries(criteriaTemplates).find(([key]) =>
        normalized.includes(key),
      )?.[1] ?? "Задача выполнена и результат подтверждён ответственным";
    setSuccessCriteria(template);
  }
  function toggleAssignee(email: string, departmentId: string, checked: boolean) {
    setAssignments((current) => {
      const rest = current.filter((a) => a.email !== email || a.departmentId !== departmentId);
      return checked ? [...rest, { email, departmentId }] : rest;
    });
  }
  function toggleDepartment(id: string, checked: boolean) {
    setSelectedDepartments((current) => checked ? [...current, id] : current.filter((item) => item !== id));
    if (!checked) setAssignments((current) => current.filter((a) => a.departmentId !== id));
  }
  return (
    <Modal
      isOpen
      onClose={() => !pending && onClose()}
      maxWidth="max-w-xl"
      showLogo={false}
      title={
        <>
          {" "}
          MYCOO <span className="text-fog/40">/</span>{" "}
          <span className="text-flux">
            {" "}
            {task ? "EDIT TASK" : "NEW TASK"}{" "}
          </span>{" "}
        </>
      }
      subtitle={
        task
          ? "редактирование операционной задачи"
          : "создание операционной задачи"
      }
      ariaLabel={task ? "Редактировать задачу" : "Новая задача"}
      statusChip={{
        tone: pending ? "warn" : "ion",
        text: pending ? "saving" : task ? "editing" : "new task",
      }}
    >
      {" "}
      <form onSubmit={submit} className="min-w-0 overflow-hidden">
        {" "}
        <fieldset
          disabled={pending}
          className="min-w-0 space-y-5 disabled:opacity-60"
        >
          {" "}
          <div className="min-w-0 rounded-md border border-line/60 bg-hull/20 p-3.5 sm:p-4">
            {" "}
            <SectionLabel> Название задачи </SectionLabel>{" "}
            <input
              autoFocus
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Подготовить коммерческое предложение"
              className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-snow outline-none placeholder:text-fog/30"
            />{" "}
            <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
              {" "}
              <span className="mono-label min-w-0 truncate text-[8px] text-fog/35">
                {" "}
                ОПЕРАЦИОННАЯ ЗАДАЧА{" "}
              </span>{" "}
              <span className="shrink-0 font-mono text-[8px] text-fog/30">
                {" "}
                {title.length}/200{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
          {isOwner && departments.length > 1 && <fieldset className="min-w-0">
            <legend className="mb-2 text-xs text-fog">Департаменты</legend>
            <div className="flex flex-wrap gap-3">
              {departments.map((d) => <label key={d.id} className="flex min-w-0 items-center gap-2 text-xs text-mist">
                <input type="checkbox" checked={selectedDepartments.includes(d.id)} disabled={d.id === departmentId}
                  onChange={(e) => toggleDepartment(d.id, e.target.checked)} className="accent-flux" />
                <span className="break-words">{d.name}</span>
              </label>)}
            </div>
            <p className="mt-2 text-[11px] text-fog/60">Одна задача с общим статусом для выбранных департаментов.</p>
          </fieldset>}
          <fieldset className="min-w-0">
            {" "}
            <SectionLabel icon={<LuUsers className="h-3.5 w-3.5" />}>
              {" "}
              Исполнители{" "}
            </SectionLabel>{" "}
            <div className="min-w-0 overflow-hidden rounded-md border border-line/60 bg-hull/15">
              {" "}
              {options.length > 0 ? (
                <div className="max-h-52 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain">
                  {" "}
                  {options.map((person, index) => {
                    const selected = assignments.some((a) => a.email === person.email && a.departmentId === person.departmentId);
                    return (
                      <label
                        key={person.departmentId + ':' + person.email}
                        className={`flex min-w-0 cursor-pointer items-center gap-2.5 px-3 py-3 transition-colors sm:gap-3 sm:px-3.5 ${index > 0 ? "border-t border-line/40" : ""} ${selected ? "bg-flux/8" : "hover:bg-hull/40"}`}
                      >
                        {" "}
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${selected ? "border-flux bg-flux text-void" : "border-line bg-void/50 text-transparent"}`}
                        >
                          {" "}
                          {selected && <LuCheck className="h-3 w-3" />}{" "}
                        </span>{" "}
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected}
                          onChange={(e) =>
                            toggleAssignee(person.email, person.departmentId, e.target.checked)
                          }
                        />{" "}
                        <span className="min-w-0 flex-1 overflow-hidden">
                          {" "}
                          <span className="block truncate text-[12.5px] font-medium text-mist">
                            {" "}
                            {person.name || person.email}{" "}
                          </span>{" "}
                          {selectedDepartments.length > 1 && <span className="block text-[10px] text-ion/80">
                            {departments.find((d) => d.id === person.departmentId)?.name}
                          </span>}
                          {(person.name || !person.userId) && (
                            <span className="mt-0.5 block truncate text-[10px] text-fog/45">
                              {" "}
                              {person.name ? person.email : ""}{" "}
                              {!person.userId &&
                                " · приглашён, ещё не присоединился"}{" "}
                            </span>
                          )}{" "}
                        </span>{" "}
                      </label>
                    );
                  })}{" "}
                </div>
              ) : (
                <p className="px-3.5 py-4 text-[12px] leading-relaxed text-fog/55">
                  {" "}
                  Сначала пригласите участника в департамент.{" "}
                </p>
              )}{" "}
            </div>{" "}
            {assignments.length > 0 && (
              <p className="mt-1.5 font-mono text-[8px] text-fog/35">
                {" "}
                выбрано назначений: {assignments.length}{" "}
              </p>
            )}{" "}
          </fieldset>{" "}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <SectionLabel icon={<LuCalendarDays className="h-3.5 w-3.5" />}>Срок выполнения — с</SectionLabel>
              <DatePicker value={startDate} onChange={setStartDate} min="1900-01-01" max={dueDate || "9999-12-31"}
                required disabled={pending} placeholder="Дата начала" ariaLabel="Начало выполнения" caption="НАЧАЛО" className="min-w-0" />
            </div>
            {" "}
            <div className="min-w-0">
              {" "}
              <SectionLabel icon={<LuCalendarDays className="h-3.5 w-3.5" />}>
                {" "}
                Срок выполнения — по{" "}
              </SectionLabel>{" "}
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                min={startDate || "1900-01-01"}
                max="9999-12-31"
                required
                disabled={pending}
                placeholder="Дата окончания"
                ariaLabel="Окончание выполнения"
                caption="ОКОНЧАНИЕ"
                className="min-w-0"
              />{" "}
            </div>{" "}
            <fieldset className="min-w-0">
              {" "}
              <SectionLabel> Приоритет </SectionLabel>{" "}
              <Select
                value={priority}
                onChange={(value) => setPriority(value as Task["priority"])}
                options={priorityOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                  color: option.color,
                }))}
                className="min-w-0 w-full"
                ariaLabel="Приоритет задачи"
                disabled={pending}
              />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="min-w-0">
            {" "}
            <div className="mb-2.5 flex min-w-0 items-center justify-between gap-2">
              {" "}
              <SectionLabel icon={<LuSparkles className="h-3.5 w-3.5" />}>
                {" "}
                Критерий результата{" "}
              </SectionLabel>{" "}
              <Button
                type="button"
                variant="ghost"
                mono
                disabled={!title.trim()}
                onClick={insertCriteriaTemplate}
                className="shrink-0 px-1 py-1 text-[8px] text-ion"
              >
                {" "}
                + шаблон{" "}
              </Button>{" "}
            </div>{" "}
            <textarea
              id="task-criteria"
              rows={3}
              maxLength={3000}
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              placeholder="КП отправлено клиенту и получена обратная связь"
              className={`${inputClass} resize-none`}
            />{" "}
            <div className="mt-1.5 flex justify-end">
              {" "}
              <span className="font-mono text-[8px] text-fog/30">
                {" "}
                {successCriteria.length}/3000{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </fieldset>{" "}
        {(validation || error) && (
          <div
            role="alert"
            className="mt-4 min-w-0 break-words rounded-md border border-crit/30 bg-crit/5 px-3 py-2.5 text-[11px] leading-relaxed text-crit"
          >
            {" "}
            {validation || error}{" "}
          </div>
        )}{" "}
        <div className="mt-5 flex min-w-0 flex-col-reverse gap-2.5 sm:flex-row">
          {" "}
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {" "}
            Отмена{" "}
          </Button>{" "}
          <Button
            type="submit"
            tone="flux"
            disabled={pending || !title.trim()}
            iconRight={
              !pending ? <LuArrowRight className="h-4 w-4" /> : undefined
            }
            className="w-full min-w-0 flex-1"
          >
            {" "}
            {pending
              ? "Сохранение…"
              : task
                ? "Сохранить изменения"
                : "Создать задачу"}{" "}
          </Button>{" "}
        </div>{" "}
      </form>{" "}
    </Modal>
  );
}
