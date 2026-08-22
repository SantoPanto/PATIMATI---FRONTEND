import {
  Bell,
  CheckCheck,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "wouter";

import { useAuth } from "../contexts/AuthContext";
import type { InAppNotification } from "../services/notifications";
import {
  getNotificationSnapshot,
  loadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from "../services/notifications";

type NotificationPanelProps = {
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
};

type NotificationListProps = {
  notifications: InAppNotification[];
  compact?: boolean;
  onSelect: (notification: InAppNotification) => void;
};

function formatNotificationDate(timestamp: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function getNotificationHref(
  notification: InAppNotification,
): string | null {
  // Eşleşme bildirimi Eşleşmelerim'e götürür, ilan detayına DEĞİL: ilan
  // sayfasında eşleşme bağlamı (skor, iki ilanın yan yana hâli) yok; kullanıcı
  // "eşleşme nerede?" kalıyordu. Tek hesapla test ederken çiftin iki ilanı da
  // aynı kişide olduğundan bu, "kendi ilanıma götürdü" diye görünüyordu (B4).
  if (notification.data.type === "AI_MATCH") {
    return "/my-matches";
  }

  // Çevre uyarısı (konum aboneliği): eşleşme bağlamı yok, ilan detayına.
  if (
    notification.data.type === "NEARBY_AD" &&
    notification.data.adId
  ) {
    return `/pet/${encodeURIComponent(notification.data.adId)}`;
  }

  return null;
}

export function NotificationList({
  notifications,
  compact = false,
  onSelect,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? "px-5 py-10" : "px-6 py-16"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Bell size={25} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-bold text-slate-900">
          Henüz bildiriminiz yok
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Yeni bildirimler bu oturumda geldikçe burada görünür. Kalıcı bildirim
          geçmişiniz sunucuda saklanır.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {notifications.map((notification) => {
        const href = getNotificationHref(notification);
        const isAiMatch = notification.data.type === "AI_MATCH";

        return (
          <button
            key={notification.id}
            type="button"
            onClick={() => onSelect(notification)}
            className={`flex w-full items-start gap-3 px-5 text-left transition ${
              compact ? "py-4" : "py-5 sm:px-6"
            } ${
              notification.read
                ? "bg-white hover:bg-slate-50"
                : "bg-orange-50/70 hover:bg-orange-50"
            }`}
            aria-label={
              notification.read
                ? notification.title
                : `Okunmamış bildirim: ${notification.title}`
            }
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isAiMatch
                  ? "bg-amber-50 text-amber-600"
                  : "bg-orange-50 text-orange-500"
              }`}
            >
              {isAiMatch ? (
                <Sparkles size={19} aria-hidden="true" />
              ) : (
                <Bell size={19} aria-hidden="true" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-2">
                <strong className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                  {notification.title}
                </strong>
                {!notification.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                )}
              </span>

              <span className="mt-1 block text-sm leading-5 text-slate-600">
                {notification.body}
              </span>

              <span className="mt-2 block text-xs font-medium text-slate-400">
                {formatNotificationDate(notification.receivedAt)}
              </span>
            </span>

            {href && (
              <ChevronRight
                size={18}
                className="mt-1 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function NotificationPanel({
  onClose,
  isLoading = false,
  error = null,
}: NotificationPanelProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;
    void loadNotifications()
      .catch(() => {
        if (isActive) {
          setHistoryError("Bildirimler yüklenirken bir hata oluştu");
        }
      })
      .finally(() => {
        if (isActive) {
          setHistoryLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const effectiveLoading = isLoading || historyLoading;
  const effectiveError = error || historyError;
  const notifications = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationSnapshot,
    getNotificationSnapshot,
  );
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const handleNotificationSelect = (
    notification: InAppNotification,
  ) => {
    markNotificationAsRead(notification.id);

    const href = getNotificationHref(notification);
    if (href) {
      onClose();
      navigate(href);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate("/notifications");
  };

  return (
    <section
      id="notification-panel"
      className="absolute right-0 top-[calc(100%+12px)] z-[110] flex max-h-[min(70vh,34rem)] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl shadow-slate-950/15"
      role="dialog"
      aria-labelledby="notification-panel-title"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-orange-500" aria-hidden="true" />
            <h2
              id="notification-panel-title"
              className="text-base font-extrabold text-slate-950"
            >
              Bildirimler
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} okunmamış bildirim`
              : "Yeni bildirim yok"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Bildirim panelini kapat"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {effectiveLoading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Bildirimler yükleniyor...
          </div>
        ) : effectiveError ? (
          <div
            className="px-5 py-10 text-center text-sm text-rose-600"
            role="alert"
          >
            Bildirimler yüklenirken bir hata oluştu
          </div>
        ) : (
          <NotificationList
            notifications={recentNotifications}
            compact
            onSelect={handleNotificationSelect}
          />
        )}
      </div>

      <div className="border-t border-slate-100 bg-white px-5 py-3">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-orange-500"
          >
            <CheckCheck size={15} aria-hidden="true" />
            Tümünü okundu işaretle
          </button>
        )}

        <button
          type="button"
          onClick={handleViewAll}
          className="flex w-full items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
        >
          <span>Tüm Bildirimleri Gör</span>
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
