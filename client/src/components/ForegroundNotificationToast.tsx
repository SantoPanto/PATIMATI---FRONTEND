import { Bell, MessageSquare, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { MessagePayload } from "firebase/messaging";

import { useAuth } from "../contexts/AuthContext";
import {
  clearInAppNotifications,
  getNotificationHref,
  loadNotifications,
  markNotificationAsRead,
  recordForegroundNotification,
} from "../services/notifications";
import { listenForForegroundMessages } from "../services/firebase";
import { connectWebSocket, subscribeToNotificationEvents } from "../services/websocket";
import type { InAppNotification } from "../services/notifications";

function normalizeNotificationData(
  data: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!data) return {};

  return Object.entries(data).reduce<Record<string, string>>(
    (normalized, [key, value]) => {
      if (typeof value === "string") {
        normalized[key] = value;
      } else if (value !== null && value !== undefined) {
        normalized[key] = String(value);
      }
      return normalized;
    },
    {},
  );
}

export default function ForegroundNotificationToast() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      clearInAppNotifications();
      return;
    }

    void loadNotifications().catch((error: unknown) => {
      console.error("Bildirim geçmişi yüklenemedi:", error);
    });

    /*
     * Uygulama genelinde tek bir WebSocket bağlantısı burada başlatılır --
     * yalnızca /chat sayfasında değil, giriş yapılan HER sayfada. Böylece:
     * (1) kullanıcı sitede kaldığı sürece sunucu tarafında "çevrimiçi"
     *     görünür (bkz. backend PresenceEventListener),
     * (2) mesaj/bildirim rozetleri hangi sayfada olursa olsun F5 gerekmeden
     *     anlık güncellenir.
     * connectWebSocket() zaten etkin bir bağlantı varsa onu yeniden kullanır
     * (bkz. dosyanın başındaki bağlantı-durumu açıklaması); çıkışta/401'de
     * bağlantı AuthContext tarafından kapatılır, sekme kapandığında ise
     * tarayıcı bağlantıyı zaten sonlandırır.
     */
    connectWebSocket();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return <AuthenticatedForegroundNotificationToast />;
}

function AuthenticatedForegroundNotificationToast() {
  const [, navigate] = useLocation();
  const [notification, setNotification] =
    useState<InAppNotification | null>(null);

  useEffect(() => {
    let isActive = true;
    let unsubscribeFcm: (() => void) | null = null;

    const handleMessage = (payload: MessagePayload) => {
      if (!isActive) return;

      const nextNotification = recordForegroundNotification({
        title: payload.notification?.title || "PatiMati",
        body:
          payload.notification?.body ||
          "Yeni bir bildiriminiz var.",
        data: payload.data ? { ...payload.data } : {},
      });

      setNotification(nextNotification);
    };

    void listenForForegroundMessages(handleMessage)
      .then((cleanup) => {
        if (!isActive) {
          cleanup?.();
          return;
        }

        unsubscribeFcm = cleanup;
      })
      .catch((error: unknown) => {
        console.error(
          "Foreground Firebase notification listener could not start:",
          error,
        );
      });

    /*
     * İkinci, BAĞIMSIZ teslimat kanalı: WebSocket üzerinden gelen bildirim.
     * FCM izni verilmemiş/service worker aktif olmayan tarayıcılarda da
     * çalışır. recordForegroundNotification, notificationId'ye göre
     * tekilleştirdiği için aynı bildirim hem FCM hem WS'ten gelse bile
     * listede iki kez görünmez.
     */
    const unsubscribeWs = subscribeToNotificationEvents((event) => {
      if (!isActive) return;

      const nextNotification = recordForegroundNotification({
        title: event.title,
        body: event.body,
        data: {
          ...normalizeNotificationData(event.data),
          type: event.type,
          notificationId: String(event.id),
        },
      });

      setNotification(nextNotification);
    });

    return () => {
      isActive = false;
      unsubscribeFcm?.();
      unsubscribeWs();
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  if (!notification) {
    return null;
  }

  const href = getNotificationHref(notification);
  const type = notification.data.type?.toUpperCase();
  const isAiMatch = type === "AI_MATCH";
  const isMessage =
    type === "MESSAGE" ||
    type === "CHAT" ||
    type === "NEW_MESSAGE" ||
    type === "CHAT_MESSAGE";

  const handleToastClick = () => {
    markNotificationAsRead(notification.id);
    setNotification(null);
    if (href) {
      navigate(href);
    }
  };

  return (
    <div className="fixed right-4 top-4 z-[1200] w-[min(390px,calc(100vw-2rem))]">
      <div
        className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-orange-500/20 dark:bg-slate-900"
        role="status"
        aria-live="polite"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isAiMatch
              ? "bg-amber-50 text-amber-600"
              : isMessage
              ? "bg-blue-50 text-blue-600"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          {isAiMatch ? (
            <Sparkles size={20} />
          ) : isMessage ? (
            <MessageSquare size={20} />
          ) : (
            <Bell size={20} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {href ? (
            <button
              type="button"
              onClick={handleToastClick}
              className="w-full text-left focus:outline-none"
            >
              <strong className="block text-sm font-bold text-slate-900 dark:text-slate-50">
                {notification.title}
              </strong>
              <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-400">
                {notification.body}
              </span>
            </button>
          ) : (
            <>
              <strong className="block text-sm font-bold text-slate-900 dark:text-slate-50">
                {notification.title}
              </strong>
              <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                {notification.body}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setNotification(null)}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Bildirimi kapat"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

