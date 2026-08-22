import { request } from "./api";
import { getStoredToken } from "./authStorage";
import { getFcmToken } from "./firebase";

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
  receivedAt: number;
  read: boolean;
};

export type InAppNotificationInput = Omit<
  InAppNotification,
  "id" | "receivedAt" | "read"
>;

type ServerNotification = {
  id: number | string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

const MAX_FOREGROUND_NOTIFICATIONS = 20;

let notificationSequence = 0;
let notificationSnapshot: InAppNotification[] = [];
let notificationLoadPromise: Promise<InAppNotification[]> | null = null;
const notificationListeners = new Set<() => void>();

export function subscribeToNotifications(
  listener: () => void,
): () => void {
  notificationListeners.add(listener);

  return () => {
    notificationListeners.delete(listener);
  };
}

export function getNotificationSnapshot(): InAppNotification[] {
  return notificationSnapshot;
}

function notifyNotificationListeners(): void {
  notificationListeners.forEach((listener) => listener());
}

function toServerNotificationId(notificationId: string): string | null {
  if (/^server-\d+$/.test(notificationId)) {
    return notificationId.slice("server-".length);
  }

  if (/^\d+$/.test(notificationId)) {
    return notificationId;
  }

  return null;
}

function toServerNotificationKey(notificationId: number | string): string {
  return `server-${String(notificationId)}`;
}

function normalizeData(
  data: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!data) {
    return {};
  }

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

function normalizeServerNotification(
  notification: ServerNotification,
): InAppNotification {
  const receivedAt = new Date(notification.createdAt).getTime();

  return {
    id: toServerNotificationKey(notification.id),
    title: notification.title,
    body: notification.body,
    data: {
      ...normalizeData(notification.data),
      type: notification.type,
    },
    receivedAt: Number.isFinite(receivedAt) ? receivedAt : Date.now(),
    read: notification.read,
  };
}

function hasServerCounterpart(
  notification: InAppNotification,
  serverNotifications: InAppNotification[],
): boolean {
  const notificationId = notification.data.notificationId;

  return serverNotifications.some((serverNotification) =>
    serverNotification.id === notification.id ||
    (notificationId !== undefined &&
      serverNotification.id === toServerNotificationKey(notificationId)),
  );
}

function mergeServerNotifications(
  serverNotifications: InAppNotification[],
): InAppNotification[] {
  const foregroundNotifications = notificationSnapshot.filter(
    (notification) =>
      notification.id.startsWith("foreground-") &&
      !hasServerCounterpart(notification, serverNotifications),
  );

  return [...serverNotifications, ...foregroundNotifications].sort(
    (left, right) => right.receivedAt - left.receivedAt,
  );
}

/** Loads durable notification history for the currently authenticated user. */
export async function loadNotifications(): Promise<InAppNotification[]> {
  const tokenAtStart = getStoredToken();

  if (!tokenAtStart) {
    notificationSnapshot = [];
    notifyNotificationListeners();
    return [];
  }

  if (notificationLoadPromise) {
    return notificationLoadPromise;
  }

  notificationLoadPromise = request<ServerNotification[]>(
    "/api/notifications",
    {
      method: "GET",
      requiresAuth: true,
    },
  )
    .then((serverNotifications) => {
      // A logout/login transition can happen while the request is in flight.
      // Never install the old user's response into the new session.
      if (getStoredToken() !== tokenAtStart) {
        return notificationSnapshot;
      }

      notificationSnapshot = mergeServerNotifications(
        serverNotifications.map(normalizeServerNotification),
      );
      notifyNotificationListeners();
      return notificationSnapshot;
    })
    .finally(() => {
      notificationLoadPromise = null;
    });

  return notificationLoadPromise;
}

export function recordForegroundNotification(
  input: InAppNotificationInput,
): InAppNotification {
  const serverId = input.data.notificationId
    ? toServerNotificationId(input.data.notificationId)
    : null;
  const notification: InAppNotification = {
    ...input,
    id: serverId
      ? toServerNotificationKey(serverId)
      : `foreground-${Date.now()}-${notificationSequence++}`,
    receivedAt: Date.now(),
    read: false,
    data: { ...input.data },
  };

  notificationSnapshot = [
    notification,
    ...notificationSnapshot.filter((item) => item.id !== notification.id),
  ];

  if (!serverId) {
    notificationSnapshot = notificationSnapshot.slice(
      0,
      MAX_FOREGROUND_NOTIFICATIONS,
    );
  }

  notifyNotificationListeners();

  // The backend owns persistence. The refresh reconciles this immediate toast
  // with its durable row without delaying foreground display.
  if (serverId) {
    void loadNotifications().catch((error: unknown) => {
      console.error("Bildirim geçmişi senkronize edilemedi:", error);
    });
  }

  return notification;
}

export function markNotificationAsRead(
  notificationId: string,
): void {
  const notification = notificationSnapshot.find(
    (item) => item.id === notificationId,
  );

  if (!notification || notification.read) {
    return;
  }

  notificationSnapshot = notificationSnapshot.map((item) =>
    item.id === notificationId
      ? { ...item, read: true }
      : item,
  );
  notifyNotificationListeners();

  const serverId = toServerNotificationId(notificationId);
  if (!serverId) {
    return;
  }

  void request<void>(`/api/notifications/${serverId}/read`, {
    method: "PUT",
    requiresAuth: true,
  }).catch((error: unknown) => {
    console.error("Bildirim okundu bilgisi kaydedilemedi:", error);
    void loadNotifications().catch(() => undefined);
  });
}

export function markAllNotificationsAsRead(): void {
  if (!notificationSnapshot.some((item) => !item.read)) {
    return;
  }

  notificationSnapshot = notificationSnapshot.map((item) => ({
    ...item,
    read: true,
  }));
  notifyNotificationListeners();

  void request<void>("/api/notifications/read-all", {
    method: "PUT",
    requiresAuth: true,
  }).catch((error: unknown) => {
    console.error("Bildirimler okundu olarak kaydedilemedi:", error);
    void loadNotifications().catch(() => undefined);
  });
}

export function clearInAppNotifications(): void {
  notificationLoadPromise = null;

  if (notificationSnapshot.length === 0) {
    return;
  }

  notificationSnapshot = [];
  notifyNotificationListeners();
}

export type FcmTokenUpdateResponse = {
  success: boolean;
  message: string;
};

/**
 * Registers the current browser's FCM token with the authenticated user.
 * The token is intentionally kept inside this service and never exposed in UI.
 */
export function registerFcmToken(
  fcmToken: string,
): Promise<FcmTokenUpdateResponse> {
  return request<FcmTokenUpdateResponse>(
    "/api/auth/fcm-token",
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify({ fcmToken }),
    },
  );
}

/**
 * Requests permission through the existing Firebase helper, obtains the FCM
 * token, and registers it with the Backend. A null result means that the
 * browser is unsupported or permission was not granted.
 */
export async function registerCurrentDeviceForNotifications(): Promise<
  FcmTokenUpdateResponse | null
> {
  const fcmToken = await getFcmToken();

  if (!fcmToken) {
    return null;
  }

  return registerFcmToken(fcmToken);
}
