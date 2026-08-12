import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL } from "./api";
import { getStoredToken } from "./auth";
import type { MessageResponse } from "./types";

let stompClient: Client | null = null;

export function connectWebSocket(
  onMessage: (message: MessageResponse) => void,
) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("JWT token bulunamadı.");
  }

  if (stompClient?.connected) {
    return stompClient;
  }

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`${API_BASE_URL}/ws-connect`),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    onConnect: () => {
      console.log("WebSocket connected");

      stompClient?.subscribe("/user/queue/messages", (frame) => {
        const message: MessageResponse = JSON.parse(frame.body);
        onMessage(message);
      });
    },

    onStompError: (frame) => {
      console.error("STOMP Error:", frame.headers["message"]);
      console.error(frame.body);
    },

    onWebSocketError: (event) => {
      console.error("WebSocket Error:", event);
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
  stompClient?.deactivate();
  stompClient = null;
}
