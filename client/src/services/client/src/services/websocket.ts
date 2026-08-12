import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL } from "./api";
import { getStoredToken } from "./auth";
import type { MessageResponse, SendMessageRequest } from "./chat";

let client: Client | null = null;

export function connectWebSocket(
  onMessage: (message: MessageResponse) => void,
) {
  if (client?.active) return client;

  const token = getStoredToken();

  client = new Client({
    webSocketFactory: () =>
      new SockJS(`${API_BASE_URL}/ws-connect`),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    onConnect: () => {
      client?.subscribe("/user/queue/messages", (frame) => {
        const message: MessageResponse = JSON.parse(frame.body);
        onMessage(message);
      });
    },

    onStompError: (frame) => {
      console.error("STOMP Error", frame);
    },
  });

  client.activate();

  return client;
}

export function disconnectWebSocket() {
  client?.deactivate();
}

export function sendMessage(
  message: SendMessageRequest,
) {
  client?.publish({
    destination: "/app/chat",
    body: JSON.stringify(message),
  });
}
