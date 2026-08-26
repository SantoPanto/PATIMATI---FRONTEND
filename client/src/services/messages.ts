import { API_BASE_URL, request } from "./api";
import { getStoredToken } from "./auth";
import type { ChatRoomResponse, MessageResponse, Page, UserStatusResponse } from "./types";

/**
 * GET /api/users/{userId}/status (Bearer)
 * Returns user online status and last seen detail
 */
export async function getUserStatus(userId: number): Promise<UserStatusResponse> {
  const res = await request<unknown>(`/api/users/${userId}/status`, {
    method: "GET",
    requiresAuth: true,
  });

  if (typeof res === "boolean") {
    return {
      userId,
      online: res,
      status: res ? "ONLINE" : "OFFLINE",
    };
  }

  if (typeof res === "string") {
    const isOnline = res.toUpperCase() === "ONLINE";
    return {
      userId,
      online: isOnline,
      status: isOnline ? "ONLINE" : "OFFLINE",
    };
  }

  if (res && typeof res === "object") {
    const data = res as Record<string, unknown>;
    const isOnline =
      data.online === true ||
      data.status === "ONLINE" ||
      data.status === "online" ||
      data.isOnline === true;
    return {
      userId: Number(data.userId ?? userId),
      online: isOnline,
      status: isOnline ? "ONLINE" : "OFFLINE",
      lastSeen: typeof data.lastSeen === "string" ? data.lastSeen : null,
    };
  }

  return {
    userId,
    online: false,
    status: "OFFLINE",
  };
}

/**
 * 4. Mesajlaşma & Chat (/api/messages ve WebSocket)
 */

import { sendMessage as stompSendMessage } from "./websocket";

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
 * Shares an ad in chat as an AD_SHARE message payload.
 */
export async function sendAdShareMessage(
  recipientId: number,
  adId: number,
): Promise<MessageResponse | void> {
  const payload = {
    recipientId,
    content: `[AD_SHARE:${adId}]`,
    type: "AD_SHARE" as const,
    sharedAdId: adId,
    adId,
  };

  try {
    return await request<MessageResponse>("/api/messages/share", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("REST ad share endpoint unavailable, using STOMP WebSocket fallback:", err);
    try {
      stompSendMessage(recipientId, payload.content, "AD_SHARE", adId);
    } catch (wsErr) {
      console.error("STOMP send failure for ad share:", wsErr);
    }
  }
}

export interface StartConversationParams {
  targetUserId: number;
  adId: number;
}

/**
 * Resolves or creates a chat room with target user and posts an AD_SHARE message.
 */
export async function startConversationWithAd({
  targetUserId,
  adId,
}: StartConversationParams): Promise<ChatRoomResponse> {
  const room = await createOrGetChatRoom(targetUserId);
  await sendAdShareMessage(targetUserId, adId);
  return room;
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
