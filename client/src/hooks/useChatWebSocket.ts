import { useEffect, useState, useCallback, useRef } from "react";
import {
  connectWebSocket,
  removeConnectionCallbacks,
  subscribeToMessages,
  subscribeToUserStatus,
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

    // Register message and status listeners with cleanup functions
    const unsubscribeMessages = subscribeToMessages((incomingMessage) => {
      onMessageRef.current?.(incomingMessage);
    });

    const unsubscribeStatus = subscribeToUserStatus((statusEvent) => {
      onUserStatusRef.current?.(statusEvent);
    });

    /*
     * Geri çağrılar bir DEĞİŞKENDE tutuluyor ki unmount'ta kümeden
     * çıkarılabilsinler; yoksa her mount kümede bir kalıntı bırakır.
     */
    const baglantiGeriCagrilari = {
      onConnect: () => {
        if (isMounted) setStatus("CONNECTED");
      },
      onDisconnect: () => {
        if (isMounted) setStatus("DISCONNECTED");
      },
      onError: (err: unknown) => {
        console.error("WebSocket error state:", err);
        if (isMounted) setStatus("ERROR");
      },
    };

    try {
      connectWebSocket(undefined, baglantiGeriCagrilari);
    } catch (err) {
      console.error("WebSocket connection failure:", err);
      // connectWebSocket() kurulum sirasinda senkron throw ediyorsa (ag/URL
      // hatasi gibi) durumu yansitmanin tek yolu bu; onError callback'i hic
      // tetiklenmeyecek cunku baglanti hic kurulamadi.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isMounted) setStatus("ERROR");
    }

    return () => {
      isMounted = false;
      unsubscribeMessages();
      unsubscribeStatus();
      removeConnectionCallbacks(baglantiGeriCagrilari);
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
