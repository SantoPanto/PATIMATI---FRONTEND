import { useEffect, useState, useCallback, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage as stompSendMessage,
} from "../services/websocket";
import type { MessageResponse, UserStatusEvent, WebSocketStatus } from "../services/types";

/**
 * Custom Hook: WebSocket STOMP Connection, Messaging, and Online Status Sync
 * - Manages STOMP WebSocket connection lifecycle
 * - Subscribes to /user/queue/messages destination for chat messages
 * - Subscribes to /topic/user-status topic for real-time user online/offline updates
 * - Triggers onMessageReceived & onUserStatusReceived callbacks
 * - Exposes connection status flags and sendMessage method
 */
export function useChatWebSocket(
  onMessageReceived?: (message: MessageResponse) => void,
  onUserStatusReceived?: (statusEvent: UserStatusEvent) => void,
) {
  const [status, setStatus] = useState<WebSocketStatus>("CONNECTING");
  const onMessageRef = useRef(onMessageReceived);
  const onUserStatusRef = useRef(onUserStatusReceived);

  // Always keep callback refs updated to prevent stale closures without re-subscribing
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onUserStatusRef.current = onUserStatusReceived;
  }, [onUserStatusReceived]);

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
        (statusEvent) => {
          onUserStatusRef.current?.(statusEvent);
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
