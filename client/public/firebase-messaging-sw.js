importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAxZBrAWIusf4rsCmKRsct0z9d_Yi0GgvI",
  authDomain: "patim-25976.firebaseapp.com",
  projectId: "patim-25976",
  storageBucket: "patim-25976.firebasestorage.app",
  messagingSenderId: "691865471618",
  appId: "1:691865471618:web:54b9755bfe855aa1a5029b",
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
