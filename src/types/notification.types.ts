export interface Notification {
  id: string;
  kind: 'ROLE_CHANGED' | 'TASK_ASSIGNED' | 'MEETING_INVITED' | 'MEETING_PROTOCOL';
  message: string;
  createdAt: string;
  readAt: string | null;
  href: string | null;
}
export interface NotificationsPageData {
  items: Notification[];
  unreadCount: number;
  nextCursor: string | null;
}
