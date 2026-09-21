import { api } from './base.api';
import type { Dashboard } from '@/types/dashboard.types';

export const dashboardApi = {
  get: (workspaceId: string, departmentId?: string, signal?: AbortSignal) =>
    api.get<Dashboard>('/workspace/' + encodeURIComponent(workspaceId) + '/dashboard', {
      params: departmentId ? { departmentId } : {}, signal,
    }).then(r => r.data),
};
