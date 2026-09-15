import { api } from './base.api';
import type { AcceptedInvitation, Department, DepartmentRole, Invitation, InvitationInfo, InvitationInput, Team } from '@/types/team.types';

const path = (workspaceId: string) => '/workspace/' + encodeURIComponent(workspaceId) + '/team';

export const teamApi = {
  get: (workspaceId: string, signal?: AbortSignal) =>
    api.get<Team>(path(workspaceId), { signal }).then((r) => r.data),
  createDepartment: (workspaceId: string, data: { name: string; description?: string }) =>
    api.post<Department>(path(workspaceId) + '/departments', data).then((r) => r.data),
  editDepartment: (workspaceId: string, id: string, data: { name: string; description?: string }) =>
    api.patch(path(workspaceId) + '/departments/' + id, data),
  invite: (workspaceId: string, departmentId: string, data: InvitationInput) =>
    api.post<{ invitation: Invitation; token: string }>(path(workspaceId) + '/departments/' + departmentId + '/invitations', data).then((r) => r.data),
  revoke: (workspaceId: string, id: string) =>
    api.delete(path(workspaceId) + '/invitations/' + id),
  setRole: (workspaceId: string, departmentId: string, userId: string, role: DepartmentRole) =>
    api.patch(path(workspaceId) + '/departments/' + departmentId + '/members/' + userId, { role }),
  remove: (workspaceId: string, departmentId: string, userId: string) =>
    api.delete(path(workspaceId) + '/departments/' + departmentId + '/members/' + userId),
  setDepartments: (workspaceId: string, userId: string, departmentIds: string[]) =>
    api.patch(path(workspaceId) + '/members/' + userId + '/departments', { departmentIds }),
  invitation: (token: string, signal?: AbortSignal) =>
    api.get<InvitationInfo>('/invitations/' + encodeURIComponent(token), { signal }).then((r) => r.data),
  accept: (token: string, password: string) =>
    api.post<AcceptedInvitation>('/invitations/' + encodeURIComponent(token) + '/accept', { password }).then((r) => r.data),
};
