import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL, notifyUnauthorized } from "./api";
import { clearAuthStorage, getStoredToken } from "./auth";
import type { MessageResponse, UserStatusEvent, WsNotificationEvent } from "./types";

let stompClient: Client | null = null;
let clientInstanceCounter = 0;
let activeSubscriptions: StompSubscription[] = [];
let isReconnecting = false;

const messageListeners = new Set<(message: MessageResponse) => void>();
const userStatusListeners = new Set<(event: UserStatusEvent) => void>();
const notificationListeners = new Set<(event: WsNotificationEvent) => void>();

/*
 * BAĞLANTI DURUMU DİNLEYİCİLERİ — neden küme:
 *
 * `connectWebSocket` zaten etkin bir istemci bulduğunda erken dönüyor. O anda
 * istemci HENÜZ BAĞLANMAMIŞSA (active=true, connected=false) yeni çağıranın
 * geri çağrıları hiçbir yere yazılmıyordu; bağlantı sonradan kurulunca
 * yalnızca İLK çağıranın `onConnect`'i çalışıyor, o da genelde çoktan
 * unmount olmuş oluyor (`isMounted=false`) ve durum güncellenmiyordu.
 *
 * Sonuç, tarayıcıda ölçüldü (24.08, yerel): soket BAĞLI, PING/PONG akıyor,
 * mesaj canlı düşüyor — ama ekranda kalıcı olarak "Bağlanıyor..." yazıyor.
 * Kullanıcı bunu "mesajlar canlı değil" diye okuyor.
 *
 * Tetiklendiği yerler: React StrictMode'un çift mount'u (geliştirme) ve
 * üründe /chat -> /chat/{id} geçişi (ChatDetailPage aynı ChatPage'i yeniden
 * mount ediyor) bağlantı kurulurken.
 */
const connectionCallbacks = new Set<WebSocketCallbacks>();

function tumCagiranlaraHaberVer(
  olay: keyof WebSocketCallbacks,
  arguman?: unknown,
): void {
  connectionCallbacks.forEach((geriCagri) => {
    try {
      if (olay === "onError") {
        geriCagri.onError?.(arguman);
      } else {
        geriCagri[olay]?.();
      }
    } catch (hata) {
      console.error("[WS CALLBACK] Dinleyici hata verdi:", hata);
    }
  });
}

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: unknown) => void;
}

/**
  * Helper: Checks if JWT token string is structurally expired or invalid
  */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const decodedJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decodedJson);
    if (typeof payload.exp === "number") {
      // Return true if expired or expires within 10 seconds
      return Date.now() >= payload.exp * 1000 - 10000;
    }
    return false;
  } catch {
    return true;
  }
}

export function subscribeToMessages(
  listener: (message: MessageResponse) => void,
): () => void {
  messageListeners.add(listener);
  console.log(`[WS SUBSCRIBE LISTENER] Listener registered. Active messageListeners count: ${messageListeners.size}`);
  return () => {
    messageListeners.delete(listener);
    console.log(`[WS UNSUBSCRIBE LISTENER] Listener removed. Active messageListeners count: ${messageListeners.size}`);
  };
}

export function removeMessageListener(listener: (message: MessageResponse) => void): void {
  messageListeners.delete(listener);
  console.log(`[WS UNSUBSCRIBE LISTENER] Listener removed via removeMessageListener. Active count: ${messageListeners.size}`);
}

export function subscribeToUserStatus(
  listener: (event: UserStatusEvent) => void,
): () => void {
  userStatusListeners.add(listener);
  return () => {
    userStatusListeners.delete(listener);
  };
}

/**
 * `/user/queue/notifications` üzerinden gelen bildirimleri dinler.
 *
 * Bu, Firebase (FCM) push bildirimlerinden BAĞIMSIZ ikinci bir kanaldır --
 * bildirim izni verilmemiş ya da service worker aktif olmayan tarayıcılarda
 * da, kullanıcı siteye açıkken bildirimlerin F5 gerekmeden anlık düşmesini
 * sağlar.
 */
export function subscribeToNotificationEvents(
  listener: (event: WsNotificationEvent) => void,
): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
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
  if (callbacks) {
    connectionCallbacks.add(callbacks);
  }

  const token = getStoredToken();

  if (!token || isTokenExpired(token)) {
    console.error("[WS AUTH ERROR] Invalid or expired access token found before connecting.");
    clearAuthStorage();
    callbacks?.onError?.(new Error("JWT token bulunamadı veya süresi dolmuş."));
    notifyUnauthorized();
    return null;
  }

  if (stompClient?.active) {
    console.log(`[WS CONNECT] Existing active client instance found. connected=${stompClient.connected}, messageListeners=${messageListeners.size}`);
    if (stompClient.connected) {
      tumCagiranlaraHaberVer("onConnect");
    }
    return stompClient;
  }

  clientInstanceCounter++;
  const instanceId = clientInstanceCounter;

  console.log(`[WS CONNECT] [Instance #${instanceId}] Initializing STOMP Client at ${new Date().toISOString()}...`);

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`${API_BASE_URL}/ws-connect`),

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (msg: string) => {
      console.log(`[STOMP DEBUG] [Instance #${instanceId}] ${msg}`);
    },

    beforeConnect: () => {
      const freshToken = getStoredToken();
      if (isReconnecting) {
        console.log(`[WS RECONNECT] [Instance #${instanceId}] Attempting STOMP reconnect with fresh token at ${new Date().toISOString()}`);
      }

      if (!freshToken || isTokenExpired(freshToken)) {
        console.error(`[WS AUTH ERROR] [Instance #${instanceId}] Token expired or missing during beforeConnect. Deactivating STOMP client to halt loop.`);
        stompClient?.deactivate();
        clearAuthStorage();
        notifyUnauthorized();
        return;
      }

      console.log(`[WS RECONNECT] [Instance #${instanceId}] beforeConnect - successfully updated connectHeaders with fresh token.`);
      stompClient!.connectHeaders = {
        Authorization: `Bearer ${freshToken}`,
      };
    },

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    onConnect: (frame) => {
      console.log(`[WS CONNECTED] [Instance #${instanceId}] STOMP Connected successfully at ${new Date().toISOString()}`);
      console.log(`[WS CONNECTED] [Instance #${instanceId}] Server heart-beat header: "${frame.headers["heart-beat"]}". Client configured: incoming=${stompClient?.heartbeatIncoming}, outgoing=${stompClient?.heartbeatOutgoing}`);
      isReconnecting = false;

      // Clean up previous active subscriptions to prevent duplicates on reconnect
      activeSubscriptions.forEach((sub) => {
        try {
          console.log(`[WS UNSUBSCRIBE] [Instance #${instanceId}] Cleaning up stale subscription`);
          sub.unsubscribe();
        } catch {}
      });
      activeSubscriptions = [];

      tumCagiranlaraHaberVer("onConnect");

      const handleMessageFrame = (msgFrame: { body: string }) => {
        console.log(`[WS MESSAGE] [Instance #${instanceId}] Received frame on /user/queue/messages:`, msgFrame.body);
        try {
          const message: MessageResponse = JSON.parse(msgFrame.body);
          console.log(`[WS MESSAGE] [Instance #${instanceId}] Parsed message id=${message.id}, content="${message.content}". Listener count: ${messageListeners.size}`);
          messageListeners.forEach((listener) => listener(message));
        } catch (parseErr) {
          console.error(`[WS MESSAGE] [Instance #${instanceId}] JSON parse error:`, parseErr);
        }
      };

      console.log(`[WS SUBSCRIBE] [Instance #${instanceId}] Subscribing to /user/queue/messages`);
      const subMessages = stompClient?.subscribe("/user/queue/messages", handleMessageFrame);
      if (subMessages) activeSubscriptions.push(subMessages);

      console.log(`[WS SUBSCRIBE] [Instance #${instanceId}] Subscribing to /queue/messages`);
      const subQueueFallback = stompClient?.subscribe("/queue/messages", handleMessageFrame);
      if (subQueueFallback) activeSubscriptions.push(subQueueFallback);

      console.log(`[WS SUBSCRIBE] [Instance #${instanceId}] Subscribing to /topic/user-status`);
      const subStatus = stompClient?.subscribe("/topic/user-status", (statusFrame) => {
        try {
          const statusEvent: UserStatusEvent = JSON.parse(statusFrame.body);
          userStatusListeners.forEach((listener) => listener(statusEvent));
        } catch (parseErr) {
          console.error("Kullanıcı durum ayrıştırma hatası:", parseErr);
        }
      });
      if (subStatus) activeSubscriptions.push(subStatus);

      console.log(`[WS SUBSCRIBE] [Instance #${instanceId}] Subscribing to /user/queue/notifications`);
      const subNotifications = stompClient?.subscribe("/user/queue/notifications", (notificationFrame) => {
        try {
          const notificationEvent: WsNotificationEvent = JSON.parse(notificationFrame.body);
          notificationListeners.forEach((listener) => listener(notificationEvent));
        } catch (parseErr) {
          console.error("Bildirim ayrıştırma hatası:", parseErr);
        }
      });
      if (subNotifications) activeSubscriptions.push(subNotifications);
    },

    onDisconnect: () => {
      console.log(`[WS DISCONNECT] [Instance #${instanceId}] STOMP disconnected at ${new Date().toISOString()}`);
      tumCagiranlaraHaberVer("onDisconnect");
    },

    onStompError: (frame) => {
      console.error(`[WS ERROR] [Instance #${instanceId}] STOMP Error: ${frame.headers["message"]}`, frame.body);
      const errMsg = (frame.headers["message"] || "").toLowerCase();
      if (errMsg.includes("jwt") || errMsg.includes("badcredentials") || errMsg.includes("unauthorized") || errMsg.includes("expired")) {
        console.error(`[WS AUTH ERROR] [Instance #${instanceId}] STOMP Auth failure: ${frame.headers["message"]}. Halting reconnect loop.`);
        stompClient?.deactivate();
        clearAuthStorage();
        notifyUnauthorized();
      }
      tumCagiranlaraHaberVer("onError", frame);
    },

    onWebSocketError: (event) => {
      console.error(`[WS ERROR] [Instance #${instanceId}] WebSocket Error event:`, event);
      tumCagiranlaraHaberVer("onError", event);
    },

    onWebSocketClose: (event) => {
      console.log(`[WS CLOSE] [Instance #${instanceId}] WebSocket closed at ${new Date().toISOString()}. code=${event.code}, reason="${event.reason}", wasClean=${event.wasClean}`);
      isReconnecting = true;
      tumCagiranlaraHaberVer("onDisconnect");
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
    console.error(`[WS SEND ERROR] Cannot publish /app/chat. Client connected=${stompClient?.connected}, active=${stompClient?.active}`);
    throw new Error("WebSocket bağlantısı yok.");
  }

  console.log(`[WS SEND] Publishing /app/chat to recipientId=${recipientId}, content="${content}"`);
  stompClient.publish({
    destination: "/app/chat",
    body: JSON.stringify({
      recipientId,
      content,
    }),
  });
}

/**
 * Bir çağıranın bağlantı-durumu geri çağrılarını bırakır.
 *
 * <p>Unmount olan bileşenin geri çağrıları kümede kalırsa her yeniden
 * bağlanmada boşuna çağrılır ve küme oturum boyunca büyür. Soketi
 * kapatmadan yalnızca dinlemeyi bırakmak isteyen çağıran bunu kullanır.
 */
export function removeConnectionCallbacks(callbacks: WebSocketCallbacks): void {
  connectionCallbacks.delete(callbacks);
}

export function disconnectWebSocket() {
  console.log(`[WS DISCONNECT] disconnectWebSocket called. Deactivating global STOMP client.`);
  connectionCallbacks.clear();
  activeSubscriptions.forEach((sub) => {
    try { sub.unsubscribe(); } catch {}
  });
  activeSubscriptions = [];
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}
