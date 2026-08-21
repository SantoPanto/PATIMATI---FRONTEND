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
  let wsProtocol: string;
  let host: string;

  if (API_BASE_URL && /^https?:\/\//i.test(API_BASE_URL)) {
    const url = new URL(API_BASE_URL);
    wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    host = url.host;
  } else if (API_BASE_URL) {
    wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    host = API_BASE_URL.replace(/^\/+/, "");
  } else {
    wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    host = window.location.host;
  }

  return `${wsProtocol}//${host}/ws-connect${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
}
