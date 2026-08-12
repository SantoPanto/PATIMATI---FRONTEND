import { request } from "./api";

export interface MessageResponse {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
}

export function getChatHistory(
  otherUserId: number,
  page = 0,
  size = 20,
) {
  return request<PageResponse<MessageResponse>>(
    `/api/messages/history/${otherUserId}?page=${page}&size=${size}`,
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}

export function markAsRead(messageId: number) {
  return request<void>(
    `/api/messages/${messageId}/read`,
    {
      method: "PUT",
      requiresAuth: true,
    },
  );
}

export function getUnreadCount() {
  return request<number>(
    "/api/messages/unread-count",
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}
