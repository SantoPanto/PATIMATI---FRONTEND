import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { MessagePayload } from "firebase/messaging";

import { useAuth } from "../contexts/AuthContext";
import {
  clearInAppNotifications,
  loadNotifications,
  markNotificationAsRead,
  recordForegroundNotification,
} from "../services/notifications";
import { listenForForegroundMessages } from "../services/firbase";
import type { InAppNotification } from "../services/notifications";

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
    let unsubscribe: (() => void) | null = null;

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

        unsubscribe = cleanup;
      })
      .catch((error: unknown) => {
        console.error(
          "Foreground Firebase notification listener could not start:",
          error,
        );
      });

    return () => {
      isActive = false;
      unsubscribe?.();
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

  const isAiMatch = notification.data.type === "AI_MATCH";

  const openAiMatch = () => {
    if (!isAiMatch) return;

    markNotificationAsRead(notification.id);
    setNotification(null);
    // Eşleşmelerim'e: ilan detayında eşleşme bağlamı yok (B4).
    navigate("/my-matches");
  };

  return (
    <div className="fixed right-4 top-4 z-[1200] w-[min(390px,calc(100vw-2rem))]">
      <div
        className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <Bell size={20} />
        </span>

        <div className="min-w-0 flex-1">
          {isAiMatch ? (
            <button
              type="button"
              onClick={openAiMatch}
              className="w-full text-left"
            >
              <strong className="block text-sm font-bold text-slate-900">
                {notification.title}
              </strong>
              <span className="mt-1 block text-sm leading-5 text-slate-600">
                {notification.body}
              </span>
            </button>
          ) : (
            <>
              <strong className="block text-sm font-bold text-slate-900">
                {notification.title}
              </strong>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {notification.body}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setNotification(null)}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Bildirimi kapat"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
