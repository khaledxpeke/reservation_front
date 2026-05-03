import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export type NotificationType =
  | "MATCH_REQUEST_RECEIVED"
  | "MATCH_REQUEST_ACCEPTED"
  | "MATCH_REQUEST_DECLINED"
  | "MATCH_POST_CANCELLED"
  | "MATCH_POST_FULL"
  | "MATCH_POST_EXPIRED"
  | "MATCH_CHAT_MESSAGE";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse extends Paginated<Notification> {
  unreadCount: number;
}

export function listNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
  return apiRequest<NotificationsListResponse>("/api/notifications", {
    query: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getUnreadCount() {
  return apiRequest<{ count: number }>("/api/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiRequest<Notification>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
