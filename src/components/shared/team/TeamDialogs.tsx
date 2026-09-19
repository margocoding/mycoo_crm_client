import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  LuCheck,
  LuCopy,
  LuMail,
  LuSearch,
  LuShield,
  LuUserPlus,
} from "react-icons/lu";
import { Modal } from "@/components/ui/Modal";
import Input, { INPUT_CLS } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { teamApi } from "@/api/team.api";
import { errorMessage } from "@/api/base.api";
import { useAuthStore } from "@/store/auth.store";
import { useLaunchStore } from "@/store/launch.store";
import {
  ROLE_LABELS,
  type Department,
  type DepartmentRole,
  type Invitation,
  type InvitationInput,
  type TeamMember,
} from "@/types/team.types";

function DialogHeader({
  eyebrow,
  description,
}: {
  eyebrow: string;
  description?: string;
}) {
  return (
    <div className="mb-5 sm:mb-6">
      <p className="mono-label text-ion">{eyebrow}</p>

      {description && (
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-fog sm:text-[13px]">
          {description}
        </p>
      )}
    </div>
  );
}

function DialogError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex min-w-0 items-start gap-2.5 rounded-md border border-crit/40 bg-crit/5 px-3.5 py-3 font-mono text-[10.5px] leading-relaxed text-crit sm:text-[11px]"
    >
      <span className="mt-0.5 shrink-0">!</span>
      <span className="min-w-0 break-words">{message}</span>
    </p>
  );
}

function DialogNotice({
  children,
  tone = "warn",
}: {
  children: ReactNode;
  tone?: "warn" | "info" | "ok";
}) {
  const styles = {
    warn: "border-warn/30 bg-warn/5 text-warn",
    info: "border-ion/30 bg-ion/5 text-ion",
    ok: "border-ok/30 bg-ok/5 text-ok",
  };

  return (
    <div
      className={`flex min-w-0 items-start gap-2.5 rounded-md border px-3.5 py-3 text-[11.5px] leading-relaxed sm:text-[12px] ${styles[tone]}`}
    >
      <span className="mt-0.5 shrink-0">◆</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

function DialogActions({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-line/50 pt-4 sm:flex-row sm:flex-wrap sm:gap-2.5 sm:pt-5">
      {children}
    </div>
  );
}

export function RoleSelect({
  value,
  onChange,
  canAssignChief,
  disabled,
  label = "Роль",
}: {
  value: DepartmentRole;
  onChange: (role: DepartmentRole) => void;
  canAssignChief: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="relative w-full min-w-0">
      <select
        aria-label={label}
        value={value}
        onChange={(event) =>
          onChange(event.target.value as DepartmentRole)
        }
        disabled={disabled}
        className={`${INPUT_CLS} w-full min-w-0 font-mono text-[12px]`}
      >
        {(Object.keys(ROLE_LABELS) as DepartmentRole[])
          .filter(
            (role) =>
              role !== "CHIEF" || canAssignChief || value === "CHIEF",
          )
          .map((role) => (
            <option key={role} value={role} className="bg-void">
              {ROLE_LABELS[role]}
            </option>
          ))}
      </select>
    </div>
  );
}

export function DepartmentDialog({
  workspaceId,
  department,
  setup,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  department?: Department;
  setup?: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(
    department?.description ?? "",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (busy.current) return;

    if (name.trim().length < 2) {
      setError("В названии должно быть не менее двух символов.");
      return;
    }

    busy.current = true;
    setPending(true);
    setError("");

    try {
      const input = {
        name: name.trim(),
        description: description.trim(),
      };

      const id = department
        ? (
            await teamApi.editDepartment(
              workspaceId,
              department.id,
              input,
            ),
            department.id
          )
        : (await teamApi.createDepartment(workspaceId, input)).id;

      onSaved(id);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const editing = Boolean(department);

  return (
    <Modal
      isOpen
      onClose={() => !busy.current && onClose()}
      maxWidth="max-w-lg"
      title={editing ? "Изменить департамент" : "Создать департамент"}
      subtitle={editing ? department?.name : "новый контур команды"}
      ariaLabel="Департамент"
    >
      <DialogHeader
        eyebrow={
          editing
            ? "TEAM / DEPARTMENT / EDIT"
            : "TEAM / DEPARTMENT / NEW"
        }
        description={
          setup
            ? "Компания готова. Создайте первый департамент и пригласите команду."
            : editing
              ? "Измените название или описание департамента."
              : "Создайте рабочий контур для распределения участников и ролей."
        }
      />

      <form onSubmit={submit} className="space-y-5">
        <Input
          id="department-name"
          label="название"
          value={name}
          autoFocus
          autoComplete="off"
          maxLength={80}
          disabled={pending}
          placeholder="Например, Продажи"
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />

        <label className="block min-w-0">
          <span className="mono-label mb-2 block text-fog/60">
            описание · необязательно
          </span>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
            maxLength={500}
            rows={3}
            placeholder="За что отвечает этот департамент"
            className={`${INPUT_CLS} w-full resize-none`}
          />
        </label>

        <DialogError message={error} />

        <DialogActions>
          <Button
            type="submit"
            tone="flux"
            disabled={pending}
            className="w-full sm:w-auto"
          >
            {pending
              ? "Сохранение…"
              : editing
                ? "Сохранить"
                : "Создать департамент"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {setup ? "Пропустить" : "Отмена"}
          </Button>
        </DialogActions>
      </form>
    </Modal>
  );
}

export function InvitationDialog({
  workspaceId,
  department,
  initial,
  onClose,
  onSaved,
  onCreateTasks,
}: {
  workspaceId: string;
  department: Department;
  initial?: InvitationInput;
  onClose: () => void;
  onSaved: () => void;
  onCreateTasks?: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<DepartmentRole>(
    initial?.role ?? "WORKER",
  );
  const [created, setCreated] = useState<{
    invitation: Invitation;
    token: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const busy = useRef(false);

  const user = useAuthStore((state) => state.user);
  const workspace = useLaunchStore((state) => state.workspace);

  const url = created
    ? new URL(
        `/invite/${created.token}`,
        window.location.origin,
      ).href
    : "";

  const inviter =
    user?.name ||
    (workspace?.ownerId === user?.id ? workspace?.ownerName : null) ||
    user?.email;

  const letter = `${inviter} приглашает вас в компанию «${workspace?.company}», департамент «${department.name}», в MyCoo AI.
Роль: ${ROLE_LABELS[role]}.
Перейти и задать пароль: ${url}`;

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (busy.current) return;

    busy.current = true;
    setPending(true);
    setError("");

    try {
      setCreated(
        await teamApi.invite(workspaceId, department.id, {
          email: email.trim(),
          name: name.trim(),
          role,
        }),
      );

      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setError("");
    } catch {
      setError("Скопируйте ссылку или текст вручную из поля ниже.");
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => !busy.current && onClose()}
      maxWidth="max-w-xl"
      title={created ? "Приглашение готово" : "Пригласить участника"}
      subtitle={department.name}
      ariaLabel="Приглашение"
    >
      {created ? (
        <div className="min-w-0 space-y-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ok/40 bg-ok/10 text-ok sm:h-10 sm:w-10">
              <LuCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <p className="mono-label text-ok">
                INVITATION / CREATED
              </p>

              <p className="font-display mt-1.5 text-sm font-semibold text-snow sm:text-base">
                Ссылка готова к отправке
              </p>

              <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog sm:text-[12.5px]">
                Приглашение отправлено на почту. При необходимости
                вы можете передать ссылку или готовый текст вручную.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-line/70 bg-hull/30 p-3.5 sm:p-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="mono-label text-fog/55">
                срок действия
              </p>

              <span className="font-mono text-[10px] text-ion">
                {new Date(
                  created.invitation.expiresAt,
                ).toLocaleDateString("ru-RU")}
              </span>
            </div>

            <p className="mt-2 text-[11.5px] leading-relaxed text-fog sm:mt-3 sm:text-[12px]">
              Ссылка принимается один раз.
            </p>
          </div>

          <div className="min-w-0">
            <Input
              label="ссылка приглашения"
              value={url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
          </div>

          <label className="block min-w-0">
            <span className="mono-label mb-2 block text-fog/60">
              текст приглашения
            </span>

            <textarea
              readOnly
              rows={6}
              value={letter}
              className={`${INPUT_CLS} w-full resize-none break-words font-mono text-[10.5px] leading-relaxed sm:text-[11px]`}
              onFocus={(event) => event.target.select()}
            />
          </label>

          <DialogActions>
            {onCreateTasks && <Button tone="flux" onClick={onCreateTasks} className="w-full sm:w-auto">
              Создать первые задачи
            </Button>}
            <Button
              tone="flux"
              iconLeft={<LuCopy />}
              onClick={() => void copy(url, "Ссылка скопирована")}
              className="w-full sm:w-auto"
            >
              Скопировать ссылку
            </Button>

            <Button
              variant="secondary"
              iconLeft={<LuCopy />}
              onClick={() => void copy(letter, "Текст скопирован")}
              className="w-full sm:w-auto"
            >
              Скопировать текст
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Готово
            </Button>
          </DialogActions>

          {copied && (
            <p
              role="status"
              className="flex items-center gap-2 font-mono text-[10px] text-ok sm:text-[10.5px]"
            >
              <LuCheck className="h-3.5 w-3.5 shrink-0" />
              {copied}
            </p>
          )}

          <DialogError message={error} />
        </div>
      ) : (
        <form onSubmit={submit} className="min-w-0 space-y-5">
          <DialogHeader
            eyebrow={
              initial
                ? "TEAM / INVITATION / RENEW"
                : "TEAM / INVITATION / NEW"
            }
            description={`Участник получит доступ к департаменту «${department.name}» после принятия приглашения.`}
          />

          {initial && (
            <DialogNotice>
              После создания новой ссылки предыдущая перестанет
              действовать.
            </DialogNotice>
          )}

          <Input
            id="invitation-email"
            type="email"
            label="email участника"
            value={email}
            required
            autoFocus
            autoComplete="email"
            maxLength={254}
            disabled={pending}
            placeholder="name@company.ru"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />

          <Input
            id="invitation-name"
            label="имя участника"
            optional
            value={name}
            maxLength={120}
            disabled={pending}
            placeholder="Имя и фамилия"
            onChange={(event) => setName(event.target.value)}
          />

          <div className="min-w-0">
            <p className="mono-label mb-2 text-fog/60">
              роль в департаменте
            </p>

            <RoleSelect
              value={role}
              onChange={setRole}
              canAssignChief={department.canAssignChief}
              disabled={pending}
            />
          </div>

          {role === "CHIEF" && (
            <DialogNotice>
              После принятия приглашения нынешний руководитель
              департамента станет администратором.
            </DialogNotice>
          )}

          <DialogError message={error} />

          <DialogActions>
            <Button
              type="submit"
              tone="flux"
              iconLeft={<LuUserPlus />}
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {pending ? "Создание…" : "Создать ссылку"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Закрыть
            </Button>
          </DialogActions>
        </form>
      )}
    </Modal>
  );
}

export function MemberDepartmentsDialog({
  workspaceId,
  member,
  departments,
  canEdit,
  isOwner,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  member: TeamMember;
  departments: Department[];
  canEdit: boolean;
  isOwner: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState(
    member.departments.map((department) => department.id),
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(normalizedSearch),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (busy.current) return;

    busy.current = true;
    setPending(true);
    setError("");

    try {
      await teamApi.setDepartments(
        workspaceId,
        member.id,
        selected,
      );

      onSaved();
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => !busy.current && onClose()}
      maxWidth="max-w-lg"
      title="Департаменты участника"
      subtitle={member.name}
      ariaLabel="Департаменты участника"
    >
      <DialogHeader
        eyebrow="TEAM / MEMBERSHIP"
        description="Определите, в каких департаментах участник работает."
      />

      <form onSubmit={submit} className="min-w-0 space-y-5">
        <Input
          label="поиск департамента"
          value={search}
          iconLeft={<LuSearch />}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="min-w-0 overflow-hidden rounded-md border border-line/70 bg-hull/20">
          <div className="border-b border-line/50 px-3.5 py-2.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/50 sm:text-[10px]">
              доступные департаменты · {filteredDepartments.length}
            </p>
          </div>

          <div className="max-h-72 divide-y divide-line/40 overflow-y-auto">
            {filteredDepartments.length ? (
              filteredDepartments.map((department) => {
                const membership = member.departments.find(
                  (item) => item.id === department.id,
                );

                const locked =
                  !canEdit ||
                  !department.canManage ||
                  (membership?.role === "CHIEF" && !isOwner);

                return (
                  <label
                    key={department.id}
                    className={`flex min-w-0 items-start gap-3 px-3.5 py-3 transition-colors ${
                      locked
                        ? "cursor-not-allowed opacity-45"
                        : "cursor-pointer hover:bg-hull/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-flux)]"
                      checked={selected.includes(department.id)}
                      disabled={pending || locked}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, department.id]
                            : current.filter(
                                (id) => id !== department.id,
                              ),
                        )
                      }
                    />

                    <span className="min-w-0 flex-1 break-words text-[12px] text-mist sm:text-[12.5px]">
                      {department.name}
                    </span>

                    <span className="max-w-24 shrink-0 text-right font-mono text-[8.5px] uppercase tracking-[0.06em] text-fog/55 sm:max-w-none sm:text-[9.5px] sm:tracking-[0.08em]">
                      {membership
                        ? ROLE_LABELS[membership.role]
                        : "Сотрудник"}
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="px-4 py-8 text-center font-mono text-[10.5px] text-fog/50">
                департаменты не найдены
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <DialogNotice tone="info">
            В новых департаментах участник получит роль сотрудника.
            {!isOwner && " Чтобы исключить руководителя из департамента, сначала назначьте ему замену."}
          </DialogNotice>
        )}

        <DialogError message={error} />

        <DialogActions>
          {canEdit && (
            <Button
              type="submit"
              tone="flux"
              disabled={pending || !selected.length}
              className="w-full sm:w-auto"
            >
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Закрыть
          </Button>
        </DialogActions>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({
  title,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  async function confirm() {
    if (busy.current) return;

    busy.current = true;
    setPending(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => !busy.current && onClose()}
      maxWidth="max-w-lg"
      title={title}
      ariaLabel="Подтверждение действия"
    >
      <div className="min-w-0 space-y-5">
        <DialogHeader
          eyebrow="SYSTEM / CONFIRMATION"
          description="Проверьте действие перед внесением изменений."
        />

        <div className="rounded-md border border-line/70 bg-hull/30 p-3.5 sm:p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ion/30 bg-ion/5 text-ion">
              <LuShield className="h-4 w-4" />
            </div>

            <div className="min-w-0 break-words text-[12px] leading-relaxed text-fog sm:text-[13px]">
              {children}
            </div>
          </div>
        </div>

        <DialogError message={error} />

        <DialogActions>
          <Button
            tone="flux"
            disabled={pending}
            onClick={() => void confirm()}
            className="w-full sm:w-auto"
          >
            {pending ? "Сохранение…" : "Подтвердить"}
          </Button>

          <Button
            variant="ghost"
            disabled={pending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
        </DialogActions>
      </div>
    </Modal>
  );
}
