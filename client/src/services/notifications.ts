import { request } from "./api";
import { getFcmToken } from "./firbase";

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

const MAX_SESSION_NOTIFICATIONS = 20;

let notificationSequence = 0;
let notificationSnapshot: InAppNotification[] = [];
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

export function recordForegroundNotification(
  input: InAppNotificationInput,
): InAppNotification {
  const notification: InAppNotification = {
    ...input,
    id: `foreground-${Date.now()}-${notificationSequence++}`,
    receivedAt: Date.now(),
    read: false,
    data: { ...input.data },
  };

  notificationSnapshot = [
    notification,
    ...notificationSnapshot,
  ].slice(0, MAX_SESSION_NOTIFICATIONS);

  notifyNotificationListeners();
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
}

export function clearInAppNotifications(): void {
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
