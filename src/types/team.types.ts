import type { AuthRdo } from './auth.types';

export type DepartmentRole = 'CHIEF' | 'ADMIN' | 'WORKER';
export const ROLE_LABELS: Record<DepartmentRole, string> = {
  CHIEF: 'Руководитель', ADMIN: 'Администратор', WORKER: 'Сотрудник',
};
export interface Department {
  id: string;
  name: string;
  description: string | null;
  myRole: DepartmentRole | null;
  canManage: boolean;
  canAssignChief: boolean;
}
export interface TeamMember {
  id: string;
  isOwner: boolean;
  email: string;
  name: string;
  departments: Array<{ id: string; name: string; role: DepartmentRole }>;
}
export interface Invitation {
  id: string;
  email: string;
  name: string | null;
  departmentId: string;
  role: DepartmentRole;
  expiresAt: string;
}
export interface Team {
  workspaceId: string;
  isOwner: boolean;
  departments: Department[];
  members: TeamMember[];
  invitations: Invitation[];
}
export interface InvitationInput { email: string; name?: string; role: DepartmentRole; }
export interface InvitationInfo {
  email: string; name: string | null; role: DepartmentRole;
  company: string; department: string; invitedBy: string;
  expiresAt: string; existingAccount: boolean;
}
export interface AcceptedInvitation extends AuthRdo { workspaceId: string; departmentId: string; }
