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

/*
 * ⚠ BU BLOK, services/notifications.ts'teki getNotificationHref ile AYNI
 * SONUCU VERMEK ZORUNDA. Service worker ayrı bir bağlamda çalıştığı için
 * uygulama kodunu import EDEMEZ; mantık bilerek kopyalanmıştır.
 *
 * Neden ayrıca yazıldı: uygulama içi bildirim listesi 23.08'de ortak bir
 * çözücüye taşındı, ama BURASI atlandı ve yalnız AI_MATCH'i yönlendirmeye
 * devam etti. Sonuç: telefon kilitliyken gelen mesaj/görülme/çevre
 * bildirimine dokununca ana sayfa açılıyordu.
 *
 * İki kopyanın ayrışmasını sw-bildirim-hedefi.test.ts engelliyor: testi
 * aşağıdaki işaretçilerden okuyup getNotificationHref ile aynı girdilerde
 * karşılaştırıyor. Bu işaretçileri SİLME.
 */
function bildirimHedefi(data) {
  const type = (data.type || "").toUpperCase();

  if (
    type === "MESSAGE" ||
    type === "CHAT" ||
    type === "NEW_MESSAGE" ||
    type === "CHAT_MESSAGE"
  ) {
    const targetId =
      data.referenceId ||
      data.senderId ||
      data.userId ||
      data.partnerId ||
      data.chatId ||
      data.roomId;
    return targetId ? "/chat/" + encodeURIComponent(targetId) : "/chat";
  }

  if (type === "AI_MATCH") {
    // Eşleşmelerim'e: ilan detayında eşleşme bağlamı yok (B4).
    return "/my-matches";
  }

  if (type === "NEARBY_AD" && data.adId) {
    return "/pet/" + encodeURIComponent(data.adId);
  }

  if (type === "SIGHTING" && data.adId) {
    return "/pet/" + encodeURIComponent(data.adId);
  }

  if (data.referenceId && (type.indexOf("MSG") !== -1 || type.indexOf("CHAT") !== -1)) {
    return "/chat/" + encodeURIComponent(data.referenceId);
  }

  return "/";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  const targetUrl = bildirimHedefi(data);

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
