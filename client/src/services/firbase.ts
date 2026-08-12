import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);

export async function requestNotificationPermission(): Promise<
  NotificationPermission
> {
  if (!("Notification" in window)) {
    return "denied";
  }

  return Notification.requestPermission();
}

export async function getFcmToken(): Promise<string | null> {
  const supported = await isSupported();

  if (!supported) {
    console.warn("Firebase Messaging bu tarayıcıda desteklenmiyor.");
    return null;
  }

  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    console.warn("Bildirim izni verilmedi.");
    return null;
  }

  const messaging = getMessaging(firebaseApp);

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  if (!vapidKey) {
    throw new Error("VITE_FIREBASE_VAPID_KEY bulunamadı.");
  }

  return getToken(messaging, {
    vapidKey,
  });
}

export async function listenForForegroundMessages(
  callback: (payload: MessagePayload) => void,
): Promise<(() => void) | null> {
  const supported = await isSupported();

  if (!supported) {
    return null;
  }

  const messaging = getMessaging(firebaseApp);

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export { firebaseApp };
