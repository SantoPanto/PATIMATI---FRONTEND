import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";

const root = process.cwd();
const mode = process.env.MODE || process.env.NODE_ENV || "production";
const env = loadEnv(mode, root, "VITE_");

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

for (const key of required) {
  if (!env[key]) {
    throw new Error(
      `${key} bulunamadı. client/.env.local veya ortam değişkenlerini kontrol edin.`,
    );
  }
}

const serviceWorker = `importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: ${JSON.stringify(env.VITE_FIREBASE_API_KEY)},
  authDomain: ${JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN)},
  projectId: ${JSON.stringify(env.VITE_FIREBASE_PROJECT_ID)},
  storageBucket: ${JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${JSON.stringify(env.VITE_FIREBASE_APP_ID)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "PatiMati";

  const options = {
    body:
      payload.notification?.body ||
      "Yeni bir bildiriminiz var.",
    icon: "/favicon.ico",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  let targetUrl = "/";

  if (data.type === "AI_MATCH") {
    // Eşleşmelerim'e: ilan detayında eşleşme bağlamı yok (B4).
    targetUrl = "/my-matches";
  }

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
`;

const outputDir = path.join(root, "public");
const outputPath = path.join(outputDir, "firebase-messaging-sw.js");

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, serviceWorker, "utf8");

console.log(`Firebase service worker generated: ${outputPath}`);
