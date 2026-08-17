import { useEffect, useState, useCallback, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage as stompSendMessage,
} from "../services/websocket";
import type { MessageResponse, WebSocketStatus } from "../services/types";

/**
 * Custom Hook: WebSocket STOMP Connection and Real-time Messaging
 * - Manages STOMP WebSocket connection lifecycle
 * - Subscribes to /user/queue/messages destination via connectWebSocket
 * - Triggers onMessageReceived callback upon receiving real-time messages
 * - Exposes connection status flags and sendMessage method
 */
export function useChatWebSocket(
  onMessageReceived?: (message: MessageResponse) => void,
) {
  const [status, setStatus] = useState<WebSocketStatus>("CONNECTING");
  const onMessageRef = useRef(onMessageReceived);

  // Always keep callback ref updated to prevent stale closures without causing re-connections
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    let isMounted = true;
    setStatus("CONNECTING");

    try {
      connectWebSocket(
        (incomingMessage) => {
          onMessageRef.current?.(incomingMessage);
        },
        {
          onConnect: () => {
            if (isMounted) setStatus("CONNECTED");
          },
          onDisconnect: () => {
            if (isMounted) setStatus("DISCONNECTED");
          },
          onError: (err) => {
            console.error("WebSocket error state:", err);
            if (isMounted) setStatus("ERROR");
          },
        },
      );
    } catch (err) {
      console.error("WebSocket connection failure:", err);
      if (isMounted) setStatus("ERROR");
    }

    return () => {
      isMounted = false;
      disconnectWebSocket();
      setStatus("DISCONNECTED");
    };
  }, []);

  const sendMessage = useCallback((recipientId: number, content: string) => {
    stompSendMessage(recipientId, content);
  }, []);

  return {
    status,
    isConnected: status === "CONNECTED",
    isConnecting: status === "CONNECTING",
    isError: status === "ERROR",
    sendMessage,
  };
}
