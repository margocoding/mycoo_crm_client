import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LuPencil, LuPlus, LuSearch, LuTrash2, LuUserPlus, LuUsers } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTeam } from '@/components/shared/team/TeamProvider';
import { ConfirmDialog, DepartmentDialog, InvitationDialog, MemberDepartmentsDialog, RoleSelect } from '@/components/shared/team/TeamDialogs';
import { teamApi } from '@/api/team.api';
import { errorMessage } from '@/api/base.api';
import { ROLE_LABELS, type Department, type DepartmentRole, type Invitation, type InvitationInput, type TeamMember } from '@/types/team.types';

export default function TeamPage() {
  const { data, loading, error: loadError, reload } = useTeam();
  const { departmentId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setup = params.get('setup') === '1';
  const inviteOnOpen = params.get('invite') === '1';
  const [search, setSearch] = useState('');
  const [departmentDialog, setDepartmentDialog] = useState<Department | 'create' | null>(null);
  const [invitationDialog, setInvitationDialog] = useState<{ department: Department; initial?: InvitationInput } | null>(null);
  const [memberDialog, setMemberDialog] = useState<TeamMember | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; text: string; action: () => Promise<void> } | null>(null);
  const [hiddenInvitations, setHiddenInvitations] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const department = data?.departments.find((d) => d.id === departmentId) ?? (!departmentId ? data?.departments[0] : undefined);
  useEffect(() => {
    if (setup && data?.isOwner && !data.departments.length) setDepartmentDialog('create');
  }, [setup, data?.isOwner, data?.departments.length]);
  useEffect(() => {
    if (inviteOnOpen && department?.canManage) {
      setInvitationDialog({ department });
      navigate('/dashboard/team/' + department.id, { replace: true });
    }
  }, [inviteOnOpen, department, navigate]);
  useEffect(() => { setSearch(''); setError(''); }, [departmentId]);

  if (!data) return <div className="rounded-xl border border-line bg-hull/20 p-8">
    <h1 className="font-display text-2xl font-bold text-snow">Команда</h1>
    {loading ? <p role="status" className="mt-4 text-fog">Загрузка команды…</p> : <>
      <p role="alert" className="my-4 text-crit">{loadError}</p>
      <Button variant="secondary" onClick={() => void reload()}>Повторить</Button>
    </>}
  </div>;

  const workspaceId = data.workspaceId;
  const query = search.trim().toLocaleLowerCase();
  const members = data.members.filter((m) => m.departments.some((d) => d.id === department?.id));
  const filtered = members.filter((m) => (m.name + ' ' + m.email).toLocaleLowerCase().includes(query));
  const invitations = data.invitations.filter((i) => i.departmentId === department?.id && !hiddenInvitations.includes(i.id));
  const canManage = Boolean(department?.canManage);

  async function run(action: () => Promise<unknown>) {
    setPending(true); setError('');
    try { await action(); await reload(); }
    finally { setPending(false); }
  }
  function setRole(member: TeamMember, role: DepartmentRole) {
    if (!department) return;
    const action = () => run(() => teamApi.setRole(workspaceId, department.id, member.id, role));
    if (role === 'CHIEF') setConfirmation({
      title: 'Назначить начальника?',
      text: member.name + ' станет начальником департамента «' + department.name + '». Нынешний начальник станет администратором.',
      action,
    });
    else void action().catch((error) => setError(errorMessage(error)));
  }
  async function revoke(invitation: Invitation) {
    setHiddenInvitations((items) => [...items, invitation.id]);
    try { await run(() => teamApi.revoke(workspaceId, invitation.id)); }
    catch (error) {
      setHiddenInvitations((items) => items.filter((id) => id !== invitation.id));
      setError(errorMessage(error));
    }
  }
  const closeDepartment = () => {
    setDepartmentDialog(null);
    if (setup) navigate('/dashboard/main');
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mono-label text-flux">Команда</p>
        <h1 className="mt-2 break-words font-display text-2xl font-bold text-snow md:text-3xl">{department?.name ?? 'Департаменты'}</h1>
        {department?.description && <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm text-fog">{department.description}</p>}
        {department?.canManage && <Button variant="ghost" className="mt-1 !px-0 !py-2" iconLeft={<LuPencil />}
          onClick={() => setDepartmentDialog(department)}>Изменить департамент</Button>}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.isOwner && <Button variant="secondary" iconLeft={<LuPlus />} disabled={pending}
          onClick={() => setDepartmentDialog('create')}>Создать департамент</Button>}
        {(data.isOwner || canManage) && <Button tone="flux" iconLeft={<LuUserPlus />} disabled={!canManage || pending || loading}
          title={department ? undefined : 'Сначала создайте департамент'}
          onClick={() => department && setInvitationDialog({ department })}>Пригласить</Button>}
      </div>
    </div>
    {error && <p role="alert" className="rounded-lg border border-crit/40 bg-crit/5 p-4 text-sm text-crit">{error}</p>}
    {departmentId && !department ? <div className="rounded-xl border border-line p-8 text-fog">
      {loading ? 'Загрузка департамента…' : 'Департамент не найден или у вас нет доступа к нему.'}
    </div> : !department ? <div className="rounded-xl border border-dashed border-line bg-hull/20 px-6 py-14 text-center">
      <LuUsers className="mx-auto h-10 w-10 text-ion" />
      <h2 className="mt-4 font-display text-xl text-snow">Пока нет департаментов</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fog">{data.isOwner
        ? 'Создайте первый департамент, чтобы пригласить участников и распределить роли.'
        : 'Попросите руководителя добавить вас в департамент.'}</p>
    </div> : <>
      <section className="overflow-hidden rounded-xl border border-line bg-hull/20" aria-label="Участники департамента">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 p-5">
          <h2 className="font-display font-semibold text-snow">{canManage ? 'Участники' : 'Ваше участие'}
            <span className="ml-2 text-sm font-normal text-fog">{members.length}</span>
          </h2>
          {canManage && <Input aria-label="Поиск по имени или email" placeholder="Поиск по имени или email"
            value={search} onChange={(e) => setSearch(e.target.value)} iconLeft={<LuSearch />}
            wrapperClassName="w-full sm:w-72" />}
        </div>
        {!filtered.length ? <p className="p-8 text-sm text-fog">{search
          ? 'Участники не найдены. Попробуйте другой запрос.'
          : 'Пока никого нет — пригласите первого участника.'}</p> :
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-line/50 text-xs text-fog">
                <tr><th className="px-5 py-3 font-normal">Участник</th><th className="px-4 py-3 font-normal">Роль</th>
                  <th className="px-4 py-3 font-normal">Департаменты</th><th className="px-4 py-3"><span className="sr-only">Действия</span></th></tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {filtered.map((member) => {
                  const role = member.departments.find((d) => d.id === department.id)!.role;
                  return <tr key={member.id}>
                    <td className="max-w-64 px-5 py-4">
                      <p className="break-words font-medium text-snow">{member.name}</p>
                      {member.name !== member.email && <p className="mt-1 break-all text-xs text-fog">{member.email}</p>}
                    </td>
                    <td className="w-48 px-4 py-4">
                      {canManage && role !== 'CHIEF' ? <RoleSelect value={role} onChange={(value) => setRole(member, value)}
                        canAssignChief={department.canAssignChief} disabled={pending || loading} label={'Роль: ' + member.name} />
                        : <span className={role === 'CHIEF' ? 'text-ion' : 'text-fog'}>{ROLE_LABELS[role]}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setMemberDialog(member)}
                        aria-label={'Департаменты: ' + member.name} disabled={pending}
                        className="flex max-w-72 flex-wrap gap-1.5 rounded-md text-left focus-visible:outline focus-visible:outline-flux">
                        {member.departments.slice(0, 2).map((d) => <span key={d.id}
                          className="max-w-40 truncate rounded border border-line bg-hull/50 px-2 py-1 text-xs text-mist">{d.name}</span>)}
                        {member.departments.length > 2 && <span className="rounded border border-ion/30 px-2 py-1 text-xs text-ion">+{member.departments.length - 2}</span>}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      {canManage && <button type="button" aria-label={'Удалить из департамента: ' + member.name}
                        disabled={pending || loading || role === 'CHIEF'}
                        title={role === 'CHIEF' ? 'Сначала назначьте другого начальника' : 'Удалить из департамента'}
                        className="rounded p-2 text-fog hover:text-crit disabled:cursor-not-allowed disabled:opacity-25"
                        onClick={() => setConfirmation({ title: 'Удалить участника?',
                          text: member.name + ' будет исключён из департамента «' + department.name + '». Если это его единственный департамент, доступ к компании будет закрыт.',
                          action: () => run(() => teamApi.remove(workspaceId, department.id, member.id)),
                        })}><LuTrash2 className="h-4 w-4" /></button>}
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>}
        {!canManage && <p className="border-t border-line/50 p-5 text-xs text-fog">Состав команды и управление участниками доступны руководителям департамента.</p>}
      </section>
      {canManage && <section className="rounded-xl border border-line bg-hull/20 p-5" aria-label="Ожидают приглашения">
        <h2 className="font-display font-semibold text-snow">Ожидают приглашения <span className="ml-2 text-sm font-normal text-fog">{invitations.length}</span></h2>
        {!invitations.length ? <p className="mt-3 text-sm text-fog">Активных приглашений пока нет.</p> :
          <ul className="mt-4 divide-y divide-line/50">{invitations.map((invitation) => <li key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0"><p className="break-all text-sm text-snow">{invitation.email}</p>
              <p className="mt-1 text-xs text-fog">{ROLE_LABELS[invitation.role]} · до {new Date(invitation.expiresAt).toLocaleDateString('ru-RU')}</p></div>
            {(invitation.role !== 'CHIEF' || department.canAssignChief) && <div className="flex gap-2">
              <Button variant="ghost" disabled={pending || loading} onClick={() => setInvitationDialog({
                department, initial: { email: invitation.email, name: invitation.name ?? '', role: invitation.role },
              })}>Новая ссылка</Button>
              <Button variant="ghost" disabled={pending || loading} onClick={() => void revoke(invitation)}>Отменить</Button>
            </div>}
          </li>)}</ul>}
      </section>}
    </>}
    {departmentDialog && <DepartmentDialog key={departmentDialog === 'create' ? 'create' : departmentDialog.id}
      workspaceId={workspaceId} department={departmentDialog === 'create' ? undefined : departmentDialog}
      setup={setup} onClose={closeDepartment} onSaved={(id) => {
        const created = departmentDialog === 'create';
        setDepartmentDialog(null);
        void reload();
        navigate('/dashboard/team/' + id + (created ? '?invite=1' : ''));
      }} />}
    {invitationDialog && <InvitationDialog workspaceId={workspaceId} {...invitationDialog}
      onClose={() => setInvitationDialog(null)} onSaved={() => void reload()} />}
    {memberDialog && <MemberDepartmentsDialog workspaceId={workspaceId} member={memberDialog}
      departments={data.departments} canEdit={canManage} onClose={() => setMemberDialog(null)} onSaved={() => void reload()} />}
    {confirmation && <ConfirmDialog title={confirmation.title} onConfirm={confirmation.action}
      onClose={() => setConfirmation(null)}>{confirmation.text}</ConfirmDialog>}
  </div>;
}
