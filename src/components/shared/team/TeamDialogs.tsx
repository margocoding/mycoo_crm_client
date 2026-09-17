import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import Input, { INPUT_CLS } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { teamApi } from '@/api/team.api';
import { errorMessage } from '@/api/base.api';
import { useAuthStore } from '@/store/auth.store';
import { useLaunchStore } from '@/store/launch.store';
import { ROLE_LABELS, type Department, type DepartmentRole, type Invitation, type InvitationInput, type TeamMember } from '@/types/team.types';

export function RoleSelect({ value, onChange, canAssignChief, disabled, label = 'Роль' }: {
  value: DepartmentRole; onChange: (role: DepartmentRole) => void;
  canAssignChief: boolean; disabled?: boolean; label?: string;
}) {
  return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as DepartmentRole)}
    disabled={disabled} className={INPUT_CLS}>
    {(Object.keys(ROLE_LABELS) as DepartmentRole[])
      .filter((role) => role !== 'CHIEF' || canAssignChief || value === 'CHIEF')
      .map((role) => <option key={role} value={role} className="bg-void">{ROLE_LABELS[role]}</option>)}
  </select>;
}

export function DepartmentDialog({ workspaceId, department, setup, onClose, onSaved }: {
  workspaceId: string; department?: Department; setup?: boolean;
  onClose: () => void; onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(department?.name ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    if (name.trim().length < 2) { setError('В названии должно быть не менее двух символов.'); return; }
    busy.current = true; setPending(true); setError('');
    try {
      const input = { name: name.trim(), description: description.trim() };
      const id = department
        ? (await teamApi.editDepartment(workspaceId, department.id, input), department.id)
        : (await teamApi.createDepartment(workspaceId, input)).id;
      onSaved(id);
    } catch (error) { setError(errorMessage(error)); }
    finally { busy.current = false; setPending(false); }
  }
  return <Modal isOpen onClose={() => !busy.current && onClose()} maxWidth="max-w-lg"
    title={department ? 'Изменить департамент' : 'Создать департамент'} ariaLabel="Департамент">
    <form onSubmit={submit} className="space-y-5">
      {setup && <p className="text-sm text-fog">Компания готова. Создайте первый департамент и пригласите команду.</p>}
      <Input id="department-name" label="Название" value={name} autoFocus maxLength={80} disabled={pending}
        placeholder="Например, Продажи" onChange={(e) => { setName(e.target.value); setError(''); }} />
      <label className="block">
        <span className="mono-label mb-2 block text-fog/75">Описание · необязательно</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          disabled={pending} maxLength={500} rows={3} className={INPUT_CLS} />
      </label>
      {error && <p role="alert" className="text-sm text-crit">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" tone="flux" disabled={pending}>{pending ? 'Сохранение…' : department ? 'Сохранить' : 'Создать'}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>{setup ? 'Пропустить' : 'Отмена'}</Button>
      </div>
    </form>
  </Modal>;
}

export function InvitationDialog({ workspaceId, department, initial, onClose, onSaved }: {
  workspaceId: string; department: Department; initial?: InvitationInput;
  onClose: () => void; onSaved: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState<DepartmentRole>(initial?.role ?? 'WORKER');
  const [created, setCreated] = useState<{ invitation: Invitation; token: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const busy = useRef(false);
  const user = useAuthStore((s) => s.user);
  const workspace = useLaunchStore((s) => s.workspace);
  const url = created ? new URL('/invite/' + created.token, window.location.origin).href : '';
  const inviter = user?.name || (workspace?.ownerId === user?.id ? workspace?.ownerName : null) || user?.email;
  const letter = inviter + ' приглашает вас в компанию «' + workspace?.company + '», департамент «' +
    department.name + '», в MyCoo AI.\nРоль: ' + ROLE_LABELS[role] + '.\nПерейти и задать пароль: ' + url;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try {
      setCreated(await teamApi.invite(workspaceId, department.id, { email: email.trim(), name: name.trim(), role }));
      onSaved();
    } catch (error) { setError(errorMessage(error)); }
    finally { busy.current = false; setPending(false); }
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); setError(''); }
    catch { setError('Скопируйте ссылку или текст вручную из поля ниже.'); }
  }
  return <Modal isOpen onClose={() => !busy.current && onClose()} maxWidth="max-w-xl"
    title={created ? 'Приглашение готово' : 'Пригласить участника'} subtitle={department.name} ariaLabel="Приглашение">
    {created ? <div className="space-y-5">
      <p className="text-sm text-fog">Отправьте ссылку участнику самостоятельно. Она действует до{' '}
        {new Date(created.invitation.expiresAt).toLocaleDateString('ru-RU')} и принимается один раз.</p>
      <Input label="Ссылка приглашения" value={url} readOnly onFocus={(e) => e.target.select()} />
      <label className="block"><span className="mono-label mb-2 block text-fog/75">Текст приглашения</span>
        <textarea readOnly rows={5} value={letter} className={INPUT_CLS} onFocus={(e) => e.target.select()} />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button tone="flux" onClick={() => void copy(url, 'Ссылка скопирована')}>Скопировать ссылку</Button>
        <Button variant="secondary" onClick={() => void copy(letter, 'Текст скопирован')}>Скопировать текст</Button>
        <Button variant="ghost" onClick={onClose}>Готово</Button>
      </div>
      {copied && <p role="status" className="text-sm text-ok">{copied}</p>}
      {error && <p role="alert" className="text-sm text-crit">{error}</p>}
    </div> : <form onSubmit={submit} className="space-y-5">
      {initial && <p className="text-sm text-warn">После создания новой ссылки предыдущая перестанет действовать.</p>}
      <Input id="invitation-email" type="email" label="Email участника" value={email} required autoFocus
        maxLength={254} disabled={pending} placeholder="name@company.ru" onChange={(e) => setEmail(e.target.value)} />
      <Input id="invitation-name" label="Имя участника" optional value={name} maxLength={120}
        disabled={pending} placeholder="Имя и фамилия" onChange={(e) => setName(e.target.value)} />
      <div><p className="mono-label mb-2 text-fog/75">Роль в департаменте</p>
        <RoleSelect value={role} onChange={setRole} canAssignChief={department.canAssignChief} disabled={pending} />
      </div>
      {role === 'CHIEF' && <p className="text-sm text-warn">После принятия приглашения нынешний начальник станет администратором.</p>}
      {error && <p role="alert" className="text-sm text-crit">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" tone="flux" disabled={pending}>{pending ? 'Создание…' : 'Создать ссылку'}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Закрыть</Button>
      </div>
    </form>}
  </Modal>;
}

export function MemberDepartmentsDialog({ workspaceId, member, departments, canEdit, onClose, onSaved }: {
  workspaceId: string; member: TeamMember; departments: Department[]; canEdit: boolean;
  onClose: () => void; onSaved: () => void;
}) {
  const [selected, setSelected] = useState(member.departments.map((d) => d.id));
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try { await teamApi.setDepartments(workspaceId, member.id, selected); onSaved(); onClose(); }
    catch (error) { setError(errorMessage(error)); }
    finally { busy.current = false; setPending(false); }
  }
  return <Modal isOpen onClose={() => !busy.current && onClose()} maxWidth="max-w-lg"
    title="Департаменты участника" subtitle={member.name} ariaLabel="Департаменты участника">
    <form onSubmit={submit} className="space-y-5">
      <Input label="Поиск департамента" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="max-h-72 overflow-y-auto divide-y divide-line/50">
        {departments.filter((d) => d.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((d) => {
          const membership = member.departments.find((m) => m.id === d.id);
          const locked = !canEdit || !d.canManage || membership?.role === 'CHIEF';
          return <label key={d.id} className="flex items-center gap-3 py-3">
            <input type="checkbox" className="h-4 w-4 accent-[var(--color-flux)]" checked={selected.includes(d.id)}
              disabled={pending || locked} onChange={(e) => setSelected((current) => e.target.checked
                ? [...current, d.id] : current.filter((id) => id !== d.id))} />
            <span className="min-w-0 flex-1 break-words text-sm text-mist">{d.name}</span>
            <span className="text-xs text-fog">{membership ? ROLE_LABELS[membership.role] : 'Работник'}</span>
          </label>;
        })}
      </div>
      {canEdit && <p className="text-xs leading-relaxed text-fog">В новых департаментах участник получит роль работника.
        Чтобы исключить начальника из департамента, сначала назначьте ему замену.</p>}
      {error && <p role="alert" className="text-sm text-crit">{error}</p>}
      <div className="flex gap-3">
        {canEdit && <Button type="submit" tone="flux" disabled={pending || !selected.length}>{pending ? 'Сохранение…' : 'Сохранить'}</Button>}
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Закрыть</Button>
      </div>
    </form>
  </Modal>;
}

export function ConfirmDialog({ title, children, onConfirm, onClose }: {
  title: string; children: ReactNode; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  return <Modal isOpen onClose={() => !busy.current && onClose()} maxWidth="max-w-lg" title={title}>
    <div className="text-sm leading-relaxed text-fog">{children}</div>
    {error && <p role="alert" className="mt-4 text-sm text-crit">{error}</p>}
    <div className="mt-6 flex gap-3">
      <Button tone="flux" disabled={pending} onClick={async () => {
        if (busy.current) return;
        busy.current = true; setPending(true); setError('');
        try { await onConfirm(); onClose(); }
        catch (error) { setError(errorMessage(error)); }
        finally { busy.current = false; setPending(false); }
      }}>{pending ? 'Сохранение…' : 'Подтвердить'}</Button>
      <Button variant="ghost" disabled={pending} onClick={onClose}>Отмена</Button>
    </div>
  </Modal>;
}
