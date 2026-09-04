import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { tokenStore } from '@/lib/storage';

export interface NotificationItem {
  _id: string;
  id?: string;
  type: string;
  title: string;
  message?: string;
  body?: string;
  actionUrl?: string;
  action_url?: string;
  isRead: boolean;
  is_read?: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    _id?: string;
    name?: string;
    avatarUrl?: string;
    profile_pic?: string;
  };
  data?: any;
}

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'list'] as const;
export const NOTIFICATIONS_UNREAD_KEY = ['notifications', 'unread-count'] as const;

export function useNotifications(role?: string) {
  const hasToken = Boolean(tokenStore.getItem('accessToken'));

  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, role || 'all'],
    queryFn: async () => {
      const roleParam = role ? `?role=${role}` : '';
      const res = await api.get<any>(`/notifications/me${roleParam}`).catch(() => api.get<any>(`/notifications${roleParam}`));
      const data = res.data?.data || res.data;
      const items: NotificationItem[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];
      return items.map((n) => ({
        ...n,
        _id: n._id?.toString() || n.id || '',
        id: n._id?.toString() || n.id || '',
        isRead: n.isRead !== undefined ? n.isRead : Boolean(n.is_read || n.read),
      }));
    },
    enabled: hasToken,
    staleTime: 1000 * 30, // 30s
    gcTime: 1000 * 60 * 5,
  });
}

export function useUnreadNotificationCount(role?: string) {
  const hasToken = Boolean(tokenStore.getItem('accessToken'));

  return useQuery({
    queryKey: [...NOTIFICATIONS_UNREAD_KEY, role || 'all'],
    queryFn: async () => {
      const roleParam = role ? `?role=${role}` : '';
      const res = await api.get<any>(`/notifications/unread-count${roleParam}`).catch(() => api.get<any>(`/notifications/me/unread-count${roleParam}`));
      const data = res.data?.data || res.data;
      return typeof data?.count === 'number' ? data.count : typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
    },
    enabled: hasToken,
    staleTime: 1000 * 30,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/notifications/${id}/read`).catch(() => api.patch(`/notifications/${id}/read`));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role?: string) => {
      const roleParam = role ? `?role=${role}` : '';
      const res = await api.post(`/notifications/me/read-all${roleParam}`).catch(() => api.post(`/notifications/read-all${roleParam}`));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/notifications/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    },
  });
}
