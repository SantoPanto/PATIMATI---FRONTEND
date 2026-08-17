import { useEffect, useState, useCallback, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage as stompSendMessage,
} from "../services/websocket";
import type { MessageResponse, WebSocketStatus } from "../services/types";

export function useChatWebSocket(
  onMessageReceived?: (message: MessageResponse) => void,
) {
  const [status, setStatus] = useState<WebSocketStatus>("CONNECTING");
  const onMessageRef = useRef(onMessageReceived);

  // Always keep callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebSocket baglantisi baslatilirken baslangic durumunun senkronizasyonu
    setStatus("CONNECTING");

    try {
      connectWebSocket(
        (incomingMessage) => {
          onMessageRef.current?.(incomingMessage);
        },
        {
          onConnect: () => {
            setStatus("CONNECTED");
          },
          onDisconnect: () => {
            setStatus("DISCONNECTED");
          },
          onError: (err) => {
            console.error("WebSocket error state:", err);
            setStatus("ERROR");
          },
        },
      );
    } catch (err) {
      console.error("WebSocket connection failure:", err);
      setStatus("ERROR");
    }

    return () => {
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
