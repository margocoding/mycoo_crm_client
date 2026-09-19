import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTeam } from "@/components/shared/team/TeamProvider";
import {
  ConfirmDialog,
  DepartmentDialog,
  InvitationDialog,
  MemberDepartmentsDialog,
  RoleSelect,
} from "@/components/shared/team/TeamDialogs";
import { teamApi } from "@/api/team.api";
import { errorMessage } from "@/api/base.api";
import {
  ROLE_LABELS,
  type Department,
  type DepartmentRole,
  type Invitation,
  type InvitationInput,
  type TeamMember,
} from "@/types/team.types";

type Confirmation = {
  title: string;
  text: string;
  action: () => Promise<void>;
};

function SectionHeader({
  eyebrow,
  title,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="mono-label text-fog/50">{eyebrow}</p>

        <h2 className="font-display mt-1 text-base font-semibold text-snow">
          {title}

          {count !== undefined && (
            <span className="ml-2 font-mono text-[11px] font-normal text-fog/60">
              {String(count).padStart(2, "0")}
            </span>
          )}
        </h2>
      </div>

      {children && <div className="w-full sm:w-auto">{children}</div>}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-crit/40 bg-crit/5 px-4 py-3 font-mono text-[11px] leading-relaxed text-crit"
    >
      <span className="mt-0.5 shrink-0">!</span>
      <span className="min-w-0 break-words">{message}</span>
    </p>
  );
}

function EmptyState({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line/70 bg-hull/20 px-4 py-12 text-center sm:px-6 sm:py-14">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-line bg-void text-ion">
        {icon}
      </div>

      {eyebrow && (
        <p className="mono-label mt-4 text-fog/45">
          {eyebrow}
        </p>
      )}

      <h2 className="font-display mt-2 text-lg font-semibold text-snow">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-fog">
        {description}
      </p>
    </div>
  );
}

function LoadingState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-line/70 bg-hull/20 p-5 sm:p-8">
      <p className="mono-label text-ion">MYCOO / TEAM</p>

      <h1 className="font-display mt-2 text-2xl font-bold text-snow">
        Команда
      </h1>

      {loading ? (
        <p
          role="status"
          className="mt-5 font-mono text-[11px] text-fog"
        >
          подключение к контуру…
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <ErrorMessage message={error || "Не удалось загрузить команду."} />

          <Button
            variant="secondary"
            onClick={() => void onRetry()}
          >
            Повторить
          </Button>
        </div>
      )}
    </div>
  );
}

function MemberIdentity({ member }: { member: TeamMember }) {
  return (
    <div className="min-w-0">
      <p className="break-words font-medium text-snow">
        {member.name}
      </p>

      {member.name !== member.email && (
        <p className="mt-1 break-all font-mono text-[10.5px] leading-relaxed text-fog/65">
          {member.email}
        </p>
      )}
    </div>
  );
}

function MemberDepartments({
  member,
  pending,
  onClick,
}: {
  member: TeamMember;
  pending: boolean;
  onClick: () => void;
}) {
  if (member.isOwner) return <span className="text-xs text-fog">Все департаменты</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Департаменты: ${member.name}`}
      disabled={pending}
      className="flex max-w-full flex-wrap gap-1.5 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-flux disabled:opacity-50"
    >
      {member.departments.slice(0, 2).map((item) => (
        <span
          key={item.id}
          className="max-w-full truncate rounded border border-line/70 bg-hull/50 px-2 py-1 font-mono text-[10px] text-mist sm:max-w-40"
        >
          {item.name}
        </span>
      ))}

      {member.departments.length > 2 && (
        <span className="rounded border border-ion/30 bg-ion/5 px-2 py-1 font-mono text-[10px] text-ion">
          +{member.departments.length - 2}
        </span>
      )}
    </button>
  );
}

function MemberRole({
  member,
  role,
  department,
  canManage,
  isOwner,
  pending,
  loading,
  onChange,
}: {
  member: TeamMember;
  role: DepartmentRole;
  department: Department;
  canManage: boolean;
  isOwner: boolean;
  pending: boolean;
  loading: boolean;
  onChange: (role: DepartmentRole) => void;
}) {
  if (member.isOwner) return <span className="font-mono text-[10.5px] text-ion">Собственник</span>;
  if (canManage && (role !== "CHIEF" || isOwner)) {
    return (
      <RoleSelect
        value={role}
        onChange={onChange}
        canAssignChief={department.canAssignChief}
        disabled={pending || loading}
        label={`Роль: ${member.name}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${
        role === "CHIEF" ? "text-ion" : "text-fog"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          role === "CHIEF"
            ? "bg-ion shadow-[0_0_8px_var(--color-ion)]"
            : "bg-fog/40"
        }`}
      />

      {ROLE_LABELS[role]}
    </span>
  );
}

function MembersTable({
  members,
  department,
  canManage,
  isOwner,
  pending,
  loading,
  onRoleChange,
  onMemberDepartments,
  onRemove,
}: {
  members: TeamMember[];
  department: Department;
  canManage: boolean;
  isOwner: boolean;
  pending: boolean;
  loading: boolean;
  onRoleChange: (member: TeamMember, role: DepartmentRole) => void;
  onMemberDepartments: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-line/50 bg-void/20">
            <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog/55">
              <th className="px-5 py-3 font-normal">Участник</th>
              <th className="px-4 py-3 font-normal">Роль</th>
              <th className="px-4 py-3 font-normal">Департаменты</th>
              <th className="px-4 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line/40">
            {members.map((member) => {
              const membership = member.departments.find(
                (item) => item.id === department.id,
              );

              if (!membership && !member.isOwner) return null;

              const role = membership?.role ?? "ADMIN";

              return (
                <tr
                  key={member.id}
                  className="transition-colors duration-200 hover:bg-hull/30"
                >
                  <td className="max-w-64 px-5 py-4">
                    <MemberIdentity member={member} />
                  </td>

                  <td className="w-48 px-4 py-4">
                    <MemberRole
                      member={member}
                      role={role}
                      department={department}
                      canManage={canManage}
                      isOwner={isOwner}
                      pending={pending}
                      loading={loading}
                      onChange={(value) => onRoleChange(member, value)}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <MemberDepartments
                      member={member}
                      pending={pending}
                      onClick={() => onMemberDepartments(member)}
                    />
                  </td>

                  <td className="px-4 py-4">
                    {canManage && !member.isOwner && (
                      <button
                        type="button"
                        aria-label={`Удалить из департамента: ${member.name}`}
                        disabled={
                          pending ||
                          loading ||
                          (role === "CHIEF" && !isOwner)
                        }
                        title={
                          role === "CHIEF" && !isOwner
                            ? "Сначала назначьте другого руководителя"
                            : "Удалить из департамента"
                        }
                        className="rounded-md border border-transparent p-2 text-fog/60 transition-all hover:border-crit/30 hover:bg-crit/5 hover:text-crit disabled:cursor-not-allowed disabled:opacity-20"
                        onClick={() => onRemove(member)}
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line/40 sm:hidden">
        {members.map((member) => {
          const membership = member.departments.find(
            (item) => item.id === department.id,
          );

          if (!membership && !member.isOwner) return null;

          const role = membership?.role ?? "ADMIN";

          return (
            <article
              key={member.id}
              className="space-y-4 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <MemberIdentity member={member} />

                {canManage && !member.isOwner && (
                  <button
                    type="button"
                    aria-label={`Удалить из департамента: ${member.name}`}
                    disabled={
                      pending ||
                      loading ||
                      (role === "CHIEF" && !isOwner)
                    }
                    title={
                      role === "CHIEF" && !isOwner
                        ? "Сначала назначьте другого руководителя"
                        : "Удалить из департамента"
                    }
                    className="shrink-0 rounded-md border border-transparent p-2 text-fog/60 transition-all hover:border-crit/30 hover:bg-crit/5 hover:text-crit disabled:cursor-not-allowed disabled:opacity-20"
                    onClick={() => onRemove(member)}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                <div>
                  <p className="mono-label mb-1.5 text-fog/40">
                    РОЛЬ
                  </p>

                  <MemberRole
                    member={member}
                    role={role}
                    department={department}
                    canManage={canManage}
                    isOwner={isOwner}
                    pending={pending}
                    loading={loading}
                    onChange={(value) =>
                      onRoleChange(member, value)
                    }
                  />
                </div>

                <div>
                  <p className="mono-label mb-1.5 text-fog/40">
                    ДЕПАРТАМЕНТЫ
                  </p>

                  <MemberDepartments
                    member={member}
                    pending={pending}
                    onClick={() => onMemberDepartments(member)}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function MembersSection({
  members,
  search,
  setSearch,
  department,
  canManage,
  isOwner,
  pending,
  loading,
  onRoleChange,
  onMemberDepartments,
  onRemove,
}: {
  members: TeamMember[];
  search: string;
  setSearch: (value: string) => void;
  department: Department;
  canManage: boolean;
  isOwner: boolean;
  pending: boolean;
  loading: boolean;
  onRoleChange: (member: TeamMember, role: DepartmentRole) => void;
  onMemberDepartments: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const query = search.trim().toLowerCase();

  const filtered = members.filter((member) =>
    `${member.name} ${member.email}`
      .toLowerCase()
      .includes(query),
  );

  return (
    <section
      className="overflow-hidden rounded-lg border border-line/70 bg-hull/20"
      aria-label="Участники департамента"
    >
      <SectionHeader
        eyebrow="TEAM / MEMBERS"
        title={canManage ? "Участники" : "Ваше участие"}
        count={members.length}
      >
        {canManage && (
          <Input
            aria-label="Поиск по имени или email"
            placeholder="Поиск по имени или email"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            iconLeft={<LuSearch />}
            wrapperClassName="w-full sm:w-72"
          />
        )}
      </SectionHeader>

      {!filtered.length ? (
        <div className="px-4 py-9 sm:px-6 sm:py-10">
          <p className="mono-label text-fog/45">
            {search ? "SEARCH / NO RESULTS" : "TEAM / EMPTY"}
          </p>

          <p className="mt-2 text-[13px] leading-relaxed text-fog">
            {search
              ? "Участники не найдены. Попробуйте другой запрос."
              : "Пока никого нет — пригласите первого участника."}
          </p>
        </div>
      ) : (
        <MembersTable
          members={filtered}
          department={department}
          canManage={canManage}
          isOwner={isOwner}
          pending={pending}
          loading={loading}
          onRoleChange={onRoleChange}
          onMemberDepartments={onMemberDepartments}
          onRemove={onRemove}
        />
      )}

      {!canManage && (
        <div className="border-t border-line/50 bg-void/20 px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] leading-relaxed text-fog/55">
            состав команды и управление участниками доступны
            руководителям департамента
          </p>
        </div>
      )}
    </section>
  );
}

function InvitationsSection({
  invitations,
  department,
  pending,
  loading,
  onNewLink,
  onRevoke,
}: {
  invitations: Invitation[];
  department: Department;
  pending: boolean;
  loading: boolean;
  onNewLink: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
}) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-line/70 bg-hull/20"
      aria-label="Ожидают приглашения"
    >
      <SectionHeader
        eyebrow="TEAM / INVITATIONS"
        title="Ожидают приглашения"
        count={invitations.length}
      />

      {!invitations.length ? (
        <div className="px-4 py-8 sm:px-5">
          <p className="font-mono text-[10.5px] text-fog/55">
            активных приглашений пока нет
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line/40">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-hull/20 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="break-all font-mono text-[11px] text-snow">
                  {invitation.email}
                </p>

                <p className="mt-1.5 text-[11px] leading-relaxed text-fog/65">
                  {ROLE_LABELS[invitation.role]} · до{" "}
                  {new Date(
                    invitation.expiresAt,
                  ).toLocaleDateString("ru-RU")}
                </p>
              </div>

              {(invitation.role !== "CHIEF" ||
                department.canAssignChief) && (
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:gap-1">
                  <Button
                    variant="ghost"
                    disabled={pending || loading}
                    onClick={() =>
                      onNewLink(invitation)
                    }
                    className="w-full sm:w-auto"
                  >
                    Новая ссылка
                  </Button>

                  <Button
                    variant="ghost"
                    disabled={pending || loading}
                    onClick={() => onRevoke(invitation)}
                    className="w-full sm:w-auto"
                  >
                    Отменить
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TeamPage() {
  const { data, loading, error: loadError, reload } = useTeam();
  const { departmentId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const setup = params.get("setup") === "1";
  const inviteOnOpen = params.get("invite") === "1";

  const [search, setSearch] = useState("");
  const [departmentDialog, setDepartmentDialog] = useState<
    Department | "create" | null
  >(null);
  const [invitationDialog, setInvitationDialog] =
    useState<{
      department: Department;
      initial?: InvitationInput;
      firstTasks?: boolean;
    } | null>(null);
  const [memberDialog, setMemberDialog] =
    useState<TeamMember | null>(null);
  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);
  const [hiddenInvitations, setHiddenInvitations] =
    useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const department =
    data?.departments.find(
      (item) => item.id === departmentId,
    ) ??
    (!departmentId
      ? data?.departments[0]
      : undefined);

  useEffect(() => {
    if (
      setup &&
      data?.isOwner &&
      !data.departments.length
    ) {
      setDepartmentDialog("create");
    }
  }, [setup, data?.isOwner, data?.departments.length]);

  useEffect(() => {
    if (inviteOnOpen && department?.canManage) {
      setInvitationDialog({ department, firstTasks: data?.departments.length === 1 });

      navigate(
        `/dashboard/team/${department.id}`,
        { replace: true },
      );
    }
  }, [inviteOnOpen, department, navigate, data?.departments.length]);

  useEffect(() => {
    setSearch("");
    setError("");
  }, [departmentId]);

  if (!data) {
    return (
      <LoadingState
        loading={loading}
        error={loadError}
        onRetry={() => void reload()}
      />
    );
  }

  const workspaceId = data.workspaceId;
  const canManage = Boolean(department?.canManage);

  const members = data.members.filter((member) =>
    member.isOwner || member.departments.some(
      (item) => item.id === department?.id,
    ),
  );

  const invitations = data.invitations.filter(
    (invitation) =>
      invitation.departmentId === department?.id &&
      !hiddenInvitations.includes(invitation.id),
  );

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setError("");

    try {
      await action();
      await reload();
    } finally {
      setPending(false);
    }
  }

  function setRole(
    member: TeamMember,
    role: DepartmentRole,
  ) {
    if (!department) return;

    const action = () =>
      run(() =>
        teamApi.setRole(
          workspaceId,
          department.id,
          member.id,
          role,
        ),
      );

    if (role === "CHIEF") {
      setConfirmation({
        title: "Назначить руководителя?",
        text: `${member.name} станет руководителем департамента «${department.name}». Нынешний руководитель станет администратором.`,
        action,
      });

      return;
    }

    void action().catch((requestError) =>
      setError(errorMessage(requestError)),
    );
  }

  function removeMember(member: TeamMember) {
    if (!department) return;

    setConfirmation({
      title: "Удалить участника?",
      text: `${member.name} будет исключён из департамента «${department.name}». Если это его единственный департамент, доступ к компании будет закрыт.`,
      action: () =>
        run(() =>
          teamApi.remove(
            workspaceId,
            department.id,
            member.id,
          ),
        ),
    });
  }

  async function revoke(invitation: Invitation) {
    setHiddenInvitations((items) => [
      ...items,
      invitation.id,
    ]);

    try {
      await run(() =>
        teamApi.revoke(workspaceId, invitation.id),
      );
    } catch (requestError) {
      setHiddenInvitations((items) =>
        items.filter((id) => id !== invitation.id),
      );

      setError(errorMessage(requestError));
    }
  }

  function openNewInvitation(invitation: Invitation) {
    if (!department) return;

    setInvitationDialog({
      department,
      initial: {
        email: invitation.email,
        name: invitation.name ?? "",
        role: invitation.role,
      },
    });
  }

  function closeDepartment() {
    setDepartmentDialog(null);

    if (setup) {
      navigate("/dashboard/main");
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mono-label text-ion">
            MYCOO / TEAM
          </p>

          <h1 className="font-display mt-2 break-words text-2xl font-bold text-snow sm:text-3xl">
            {department?.name ?? "Департаменты"}
          </h1>

          {department?.description && (
            <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-[13px] leading-relaxed text-fog">
              {department.description}
            </p>
          )}

          {department?.canManage && (
            <Button
              variant="ghost"
              className="mt-1 !px-0 !py-2"
              iconLeft={<LuPencil />}
              onClick={() =>
                setDepartmentDialog(department)
              }
            >
              Изменить департамент
            </Button>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:w-auto sm:flex sm:flex-wrap sm:justify-end">
          {data.isOwner && (
            <Button
              variant="secondary"
              iconLeft={<LuPlus />}
              disabled={pending}
              onClick={() =>
                setDepartmentDialog("create")
              }
              className="w-full sm:w-auto"
            >
              Создать департамент
            </Button>
          )}

          {(data.isOwner || canManage) && (
            <Button
              tone="flux"
              iconLeft={<LuUserPlus />}
              disabled={
                !canManage ||
                pending ||
                loading
              }
              title={
                department
                  ? undefined
                  : "Сначала создайте департамент"
              }
              onClick={() =>
                department &&
                setInvitationDialog({ department })
              }
              className="w-full sm:w-auto"
            >
              Пригласить
            </Button>
          )}
        </div>
      </header>

      <ErrorMessage message={error} />

      {departmentId && !department ? (
        <div className="rounded-lg border border-line/70 bg-hull/20 px-4 py-9 sm:px-6 sm:py-10">
          <p className="mono-label text-fog/45">
            TEAM / ACCESS
          </p>

          <p className="mt-2 text-[13px] leading-relaxed text-fog">
            {loading
              ? "загрузка департамента…"
              : "Департамент не найден или у вас нет доступа к нему."}
          </p>
        </div>
      ) : !department ? (
        <EmptyState
          icon={<LuUsers className="h-5 w-5" />}
          eyebrow="TEAM / INITIALIZE"
          title="Пока нет департаментов"
          description={
            data.isOwner
              ? "Создайте первый департамент, чтобы пригласить участников и распределить роли."
              : "Попросите руководителя добавить вас в департамент."
          }
        />
      ) : (
        <>
          <Button variant="secondary" onClick={() => navigate('/dashboard/tasks/' + department.id)}>
            Задачи департамента
          </Button>
          <MembersSection
            members={members}
            search={search}
            setSearch={setSearch}
            department={department}
            canManage={canManage}
            isOwner={data.isOwner}
            pending={pending}
            loading={loading}
            onRoleChange={setRole}
            onMemberDepartments={setMemberDialog}
            onRemove={removeMember}
          />

          {canManage && (
            <InvitationsSection
              invitations={invitations}
              department={department}
              pending={pending}
              loading={loading}
              onNewLink={openNewInvitation}
              onRevoke={(invitation) =>
                void revoke(invitation)
              }
            />
          )}
        </>
      )}

      {departmentDialog && (
        <DepartmentDialog
          key={
            departmentDialog === "create"
              ? "create"
              : departmentDialog.id
          }
          workspaceId={workspaceId}
          department={
            departmentDialog === "create"
              ? undefined
              : departmentDialog
          }
          setup={setup}
          onClose={closeDepartment}
          onSaved={(id) => {
            const created =
              departmentDialog === "create";

            setDepartmentDialog(null);
            void reload();

            navigate(
              `/dashboard/team/${id}${
                created ? "?invite=1" : ""
              }`,
            );
          }}
        />
      )}

      {invitationDialog && (
        <InvitationDialog
          workspaceId={workspaceId}
          {...invitationDialog}
          onCreateTasks={invitationDialog.firstTasks ? () => navigate('/dashboard/tasks/' + invitationDialog.department.id + '?new=1') : undefined}
          onClose={() =>
            setInvitationDialog(null)
          }
          onSaved={() => void reload()}
        />
      )}

      {memberDialog && (
        <MemberDepartmentsDialog
          workspaceId={workspaceId}
          member={memberDialog}
          departments={data.departments}
          canEdit={canManage}
          isOwner={data.isOwner}
          onClose={() => setMemberDialog(null)}
          onSaved={() => void reload()}
        />
      )}

      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          onConfirm={confirmation.action}
          onClose={() => setConfirmation(null)}
        >
          {confirmation.text}
        </ConfirmDialog>
      )}
    </div>
  );
}
