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

/*
 * Yönlendirme mantığı TEK KAYNAKTAN geliyor: src/services/swBildirimHedefi.ts.
 * Burada ikinci bir kopya TUTULMUYOR — 23.08'de uygulama içi çözücü
 * düzeltilip service worker'daki kopya unutulduğu için mesaj/görülme/çevre
 * bildirimleri ana sayfaya gidiyordu.
 */
function bildirimHedefiKaynaginiOku() {
  const kaynakYolu = path.join(root, "src", "services", "swBildirimHedefi.ts");
  const metin = fs.readFileSync(kaynakYolu, "utf8");
  const eslesme = metin.match(
    /export const SW_BILDIRIM_HEDEFI_KAYNAK = `([\s\S]*?)`;/,
  );

  if (!eslesme) {
    throw new Error(
      "SW_BILDIRIM_HEDEFI_KAYNAK bulunamadı (src/services/swBildirimHedefi.ts). " +
        "Service worker yönlendirmesi bu değişkenden üretiliyor.",
    );
  }

  return eslesme[1];
}

const bildirimHedefiKaynagi = bildirimHedefiKaynaginiOku();

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
${bildirimHedefiKaynagi}

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
`;

const outputDir = path.join(root, "public");
const outputPath = path.join(outputDir, "firebase-messaging-sw.js");

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, serviceWorker, "utf8");

console.log(`Firebase service worker generated: ${outputPath}`);
