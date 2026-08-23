import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL } from "./api";
import { getStoredToken } from "./auth";
import type { MessageResponse, UserStatusEvent } from "./types";

let stompClient: Client | null = null;

const messageListeners = new Set<(message: MessageResponse) => void>();
const userStatusListeners = new Set<(event: UserStatusEvent) => void>();

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: unknown) => void;
}

export function subscribeToMessages(
  listener: (message: MessageResponse) => void,
): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export function subscribeToUserStatus(
  listener: (event: UserStatusEvent) => void,
): () => void {
  userStatusListeners.add(listener);
  return () => {
    userStatusListeners.delete(listener);
  };
}

export function connectWebSocket(
  onMessage?: (message: MessageResponse) => void,
  callbacks?: WebSocketCallbacks,
  onUserStatus?: (statusEvent: UserStatusEvent) => void,
) {
  if (onMessage) {
    messageListeners.add(onMessage);
  }
  if (onUserStatus) {
    userStatusListeners.add(onUserStatus);
  }

  const token = getStoredToken();

  if (!token) {
    callbacks?.onError?.(new Error("JWT token bulunamadı."));
    throw new Error("JWT token bulunamadı.");
  }

  if (stompClient?.connected) {
    callbacks?.onConnect?.();
    return stompClient;
  }

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`${API_BASE_URL}/ws-connect`),

    beforeConnect: () => {
      const freshToken = getStoredToken();
      if (freshToken) {
        stompClient!.connectHeaders = {
          Authorization: `Bearer ${freshToken}`,
        };
      }
    },

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    onConnect: () => {
      console.log("WebSocket connected");
      callbacks?.onConnect?.();

      // Subscribe to private messages (/user/queue/messages and fallback /queue/messages)
      const handleMessageFrame = (frame: { body: string }) => {
        try {
          const message: MessageResponse = JSON.parse(frame.body);
          messageListeners.forEach((listener) => listener(message));
        } catch (parseErr) {
          console.error("Mesaj ayrıştırma hatası:", parseErr);
        }
      };

      stompClient?.subscribe("/user/queue/messages", handleMessageFrame);
      stompClient?.subscribe("/queue/messages", handleMessageFrame);

      // Subscribe to real-time user online/offline status topic
      stompClient?.subscribe("/topic/user-status", (frame) => {
        try {
          const statusEvent: UserStatusEvent = JSON.parse(frame.body);
          userStatusListeners.forEach((listener) => listener(statusEvent));
        } catch (parseErr) {
          console.error("Kullanıcı durum ayrıştırma hatası:", parseErr);
        }
      });
    },

    onDisconnect: () => {
      console.log("WebSocket disconnected");
      callbacks?.onDisconnect?.();
    },

    onStompError: (frame) => {
      console.error("STOMP Error:", frame.headers["message"]);
      console.error(frame.body);
      callbacks?.onError?.(frame);
    },

    onWebSocketError: (event) => {
      console.error("WebSocket Error:", event);
      callbacks?.onError?.(event);
    },

    onWebSocketClose: (event) => {
      console.log("WebSocket closed", event);
      callbacks?.onDisconnect?.();
    },
  });

  stompClient.activate();

  return stompClient;
}

export function sendMessage(
  recipientId: number,
  content: string,
) {
  if (!stompClient?.connected) {
    throw new Error("WebSocket bağlantısı yok.");
  }

  stompClient.publish({
    destination: "/app/chat",
    body: JSON.stringify({
      recipientId,
      content,
    }),
  });
}

export function disconnectWebSocket() {
  messageListeners.clear();
  userStatusListeners.clear();
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}
