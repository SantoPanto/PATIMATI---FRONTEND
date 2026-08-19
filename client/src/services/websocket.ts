import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL } from "./api";
import { getStoredToken } from "./auth";
import type { MessageResponse } from "./types";

let stompClient: Client | null = null;

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: unknown) => void;
}

export function connectWebSocket(
  onMessage: (message: MessageResponse) => void,
  callbacks?: WebSocketCallbacks,
) {
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
      if (import.meta.env.DEV) console.log("WebSocket connected");
      callbacks?.onConnect?.();

      stompClient?.subscribe("/user/queue/messages", (frame) => {
        try {
          const message: MessageResponse = JSON.parse(frame.body);
          onMessage(message);
        } catch (parseErr) {
          console.error("Mesaj ayrıştırma hatası:", parseErr);
        }
      });
    },

    onDisconnect: () => {
      if (import.meta.env.DEV) console.log("WebSocket disconnected");
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
      if (import.meta.env.DEV) console.log("WebSocket closed", event);
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
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

