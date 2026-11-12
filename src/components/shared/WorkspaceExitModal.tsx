import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { workspaceApi } from '@/api/workspace.api';
import { errorMessage } from '@/api/base.api';
import { useLaunchStore } from '@/store/launch.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useAuthStore } from '@/store/auth.store';

export interface WorkspaceExitTarget { id: string; company: string | null; isOwner: boolean; }

export function clearSelectedWorkspace() {
  const userId = useAuthStore.getState().user?.id;
  if (userId) localStorage.removeItem('mycoo_workspace:' + userId);
  useLaunchStore.getState().reset();
  useOnboardingStore.getState().reset();
}

export default function WorkspaceExitModal({ workspace, onClose, onComplete, invitation = false }: {
  workspace: WorkspaceExitTarget; onClose: () => void; onComplete: () => void | Promise<void>; invitation?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const label = workspace.isOwner ? 'Удалить компанию' : 'Выйти из компании';
  async function submit() {
    if (!confirmed || pending) return;
    setPending(true); setError('');
    try {
      await (workspace.isOwner ? workspaceApi.remove(workspace.id) : workspaceApi.leave(workspace.id));
      clearSelectedWorkspace();
      await onComplete();
    } catch (cause) { setError(errorMessage(cause)); setPending(false); }
  }
  return <Modal isOpen onClose={() => { if (!pending) onClose(); }} title={label} ariaLabel={label} maxWidth="max-w-lg" showLogo={false}>
    <h2 className="break-words font-display text-xl font-semibold text-snow">{workspace.company || 'Моя компания'}</h2>
    {invitation && <p className="mt-3 text-sm leading-relaxed text-fog">Сейчас можно работать только в одной компании. Чтобы принять приглашение, сначала {workspace.isOwner ? 'удалите свою компанию' : 'выйдите из текущей компании'}.</p>}
    <p className="mt-3 text-sm leading-relaxed text-fog">{workspace.isOwner
      ? 'Компания станет недоступна всем её участникам. Вы сможете создать новую компанию или принять другое приглашение.'
      : 'Вы потеряете доступ к задачам, встречам и материалам этой компании. Для возвращения понадобится новое приглашение.'}</p>
    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-hull/30 p-3 text-sm text-mist">
      <input type="checkbox" className="mt-1 accent-flux" checked={confirmed} disabled={pending} onChange={(event) => setConfirmed(event.target.checked)} />
      <span>{workspace.isOwner ? 'Понимаю, что доступ закроется для всей команды' : 'Подтверждаю выход из компании'}</span>
    </label>
    {error && <p role="alert" className="mt-4 text-sm text-crit">{error}</p>}
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onClose} disabled={pending}>Отмена</Button>
      <Button variant="secondary" className="border-crit/40 text-crit disabled:opacity-40" onClick={() => void submit()} disabled={!confirmed || pending}>{pending ? 'Сохраняем…' : label}</Button>
    </div>
  </Modal>;
}
