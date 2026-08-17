import { API_BASE_URL, request } from "./api";
import { getStoredToken } from "./auth";
import type { ChatRoomResponse, MessageResponse, Page } from "./types";

/**
 * 4. Mesajlaşma & Chat (/api/messages ve WebSocket)
 */

/**
 * POST /api/messages/rooms/{partnerId} (Bearer)
 * Create or get chat room with a partner
 */
export function createOrGetChatRoom(
  partnerId: number,
): Promise<ChatRoomResponse> {
  return request<ChatRoomResponse>(`/api/messages/rooms/${partnerId}`, {
    method: "POST",
    requiresAuth: true,
  });
}

/**
 * GET /api/messages/rooms (Bearer)
 * Returns all chat rooms for current user
 */
export function getChatRooms(): Promise<ChatRoomResponse[]> {
  return request<ChatRoomResponse[]>("/api/messages/rooms", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * GET /api/messages/history/{otherUserId} (Bearer)
 * Path: otherUserId: Long
 * Query: page, size
 */
export function getMessageHistory(
  otherUserId: number,
  params?: { page?: number; size?: number },
): Promise<Page<MessageResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const endpoint = `/api/messages/history/${otherUserId}${
    query ? `?${query}` : ""
  }`;

  return request<Page<MessageResponse>>(endpoint, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * PUT /api/messages/{messageId}/read (Bearer)
 * HTTP 204 No Content
 */
export function markMessageAsRead(messageId: number): Promise<void> {
  return request<void>(`/api/messages/${messageId}/read`, {
    method: "PUT",
    requiresAuth: true,
  });
}

/**
 * GET /api/messages/unread-count (Bearer)
 * Returns number of unread messages
 */
export function getUnreadMessageCount(): Promise<number> {
  return request<number>("/api/messages/unread-count", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * Helper to build WebSocket connection URL for STOMP /ws-connect
 */
export function getWebSocketUrl(): string {
  const token = getStoredToken();
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl = API_BASE_URL.replace(/^https?:\/\//, "");

  return `${wsProtocol}//${baseUrl}/ws-connect${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
}
