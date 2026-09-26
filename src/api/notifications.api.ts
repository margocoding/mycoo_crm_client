import { api } from './base.api';
import type { NotificationsPageData } from '@/types/notification.types';

const path = (workspaceId: string) => '/workspace/' + encodeURIComponent(workspaceId) + '/notifications';
export const notificationsApi = {
  list: (workspaceId: string, cursor?: string, signal?: AbortSignal) =>
    api.get<NotificationsPageData>(path(workspaceId), { params: cursor ? { cursor } : {}, signal }).then(r => r.data),
  read: (workspaceId: string, id: string) => api.patch(path(workspaceId) + '/' + encodeURIComponent(id) + '/read'),
  readAll: (workspaceId: string) => api.patch(path(workspaceId) + '/read-all'),
};
