import { BellOff, CheckCheck } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "wouter";

import { NotificationList } from "../components/NotificationPanel";
import { useAuth } from "../contexts/AuthContext";
import {
  getNotificationSnapshot,
  loadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from "../services/notifications";
import type { InAppNotification } from "../services/notifications";
import { TeamBack, TeamShell } from "../components/TeamUI";

function getNotificationHref(
  notification: InAppNotification,
): string | null {
  if (
    notification.data.type === "AI_MATCH" &&
    notification.data.adId
  ) {
    return `/pet/${encodeURIComponent(notification.data.adId)}`;
  }

  // Çevre uyarısı (konum aboneliği): hedef ilanın kendisi — eşleşme
  // bağlamı yok, doğrudan detaya gider.
  if (
    notification.data.type === "NEARBY_AD" &&
    notification.data.adId
  ) {
    return `/pet/${encodeURIComponent(notification.data.adId)}`;
  }

  // Görülme bildirimi: sahibi ilan detayına gider — Görülmeler bölümü orada.
  if (
    notification.data.type === "SIGHTING" &&
    notification.data.adId
  ) {
    return `/pet/${encodeURIComponent(notification.data.adId)}`;
  }

  return null;
}

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const notifications = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationSnapshot,
    getNotificationSnapshot,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;
    void loadNotifications()
      .catch(() => {
        if (isActive) {
          setError(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const handleSelect = (notification: InAppNotification) => {
    markNotificationAsRead(notification.id);

    const href = getNotificationHref(notification);
    if (href) {
      navigate(href);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Bildirimler</h1>
      </header>

      <section className="card-stack">
        <article className="content-card overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} okunmamış bildirim`
                : "Tüm bildirimler okundu"}
            </p>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-orange-500"
              >
                <CheckCheck size={15} aria-hidden="true" />
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Bildirimler yükleniyor...
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm text-rose-600" role="alert">
              Bildirimler yüklenirken bir hata oluştu.
            </div>
          ) : notifications.length > 0 ? (
            <NotificationList
              notifications={notifications}
              onSelect={handleSelect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <BellOff size={25} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Henüz bildiriminiz yok
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Yeni bildirimleriniz burada görünür ve hesabınızda saklanır.
              </p>
            </div>
          )}
        </article>
      </section>
    </TeamShell>
  );
}
