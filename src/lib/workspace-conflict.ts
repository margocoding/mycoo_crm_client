import { ApiError } from '@/api/base.api';
import type { AuthRdo } from '@/types/auth.types';
import type { WorkspaceExitTarget } from '@/components/shared/WorkspaceExitModal';

export function workspaceConflict(error: unknown): { workspace: WorkspaceExitTarget; auth?: AuthRdo } | null {
  if (!(error instanceof ApiError) || error.code !== 'WORKSPACE_MEMBERSHIP_CONFLICT' || !error.data || typeof error.data !== 'object') return null;
  const value = error.data as { workspace?: { id?: unknown; name?: unknown; company?: unknown; isOwner?: unknown }; auth?: AuthRdo };
  if (!value.workspace || typeof value.workspace.id !== 'string' || typeof value.workspace.isOwner !== 'boolean') return null;
  const name = value.workspace.name ?? value.workspace.company;
  return { workspace: { id: value.workspace.id, company: typeof name === 'string' ? name : null, isOwner: value.workspace.isOwner },
    auth: value.auth && typeof value.auth.accessToken === 'string' && typeof value.auth.user?.id === 'string' ? value.auth : undefined };
}
