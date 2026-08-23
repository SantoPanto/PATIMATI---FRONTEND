import { describe, expect, it } from "vitest";

import { getNotificationHref, type InAppNotification } from "./notifications";
import { SW_BILDIRIM_HEDEFI_KAYNAK } from "./swBildirimHedefi";

/**
 * ARKA PLAN PUSH'U İLE UYGULAMA İÇİ LİSTE AYNI YERE GİTMELİ.
 *
 * <p><b>Ölçülen arıza (24.08):</b> uygulama içi bildirim yönlendirmesi
 * 23.08'de ortak bir çözücüye ({@code getNotificationHref}) taşındı, ama
 * service worker'daki kopya ATLANDI ve yalnız {@code AI_MATCH}'i
 * yönlendirmeye devam etti. Diğer her tip — mesaj, görülme, çevre uyarısı —
 * "/" açıyordu; telefon kilitliyken bildirime dokunan kullanıcı ana sayfaya
 * düşüyordu.
 *
 * <p><b>Neden iki ayrı çalıştırma yeri var:</b> service worker uygulama
 * modüllerini import edemez, mantık ona METİN olarak gömülür. Metnin tek
 * sahibi {@code swBildirimHedefi.ts}; service worker onu üretim anında
 * gömüyor, bu test de aynı metni çalıştırıp {@code getNotificationHref} ile
 * karşılaştırıyor. İkisi ayrışırsa test kırmızı yanar.
 */

const swHedefi: (data: Record<string, string>) => string = new Function(
  `${SW_BILDIRIM_HEDEFI_KAYNAK}; return bildirimHedefi;`,
)();

/** Sunucunun gerçekten ürettiği yük biçimleri (BE'den ölçüldü). */
const VAKALAR: Array<{ ad: string; data: Record<string, string> }> = [
  { ad: "mesaj (referenceId + senderId)", data: { type: "MESSAGE", referenceId: "91", senderId: "91", messageId: "9" } },
  { ad: "mesaj (yalnız senderId)", data: { type: "MESSAGE", senderId: "42" } },
  { ad: "mesaj (kimlik yok)", data: { type: "MESSAGE" } },
  { ad: "küçük harfli tip", data: { type: "message", senderId: "7" } },
  { ad: "eş anlamlı tip", data: { type: "NEW_MESSAGE", referenceId: "5" } },
  { ad: "AI eşleşmesi", data: { type: "AI_MATCH", adId: "12" } },
  { ad: "görülme bildirimi", data: { type: "SIGHTING", adId: "338", sightingId: "1" } },
  { ad: "çevre uyarısı", data: { type: "NEARBY_AD", adId: "77" } },
  { ad: "adId'siz görülme", data: { type: "SIGHTING" } },
  { ad: "bilinmeyen tip", data: { type: "BILINMEYEN", adId: "3" } },
  { ad: "tip yok", data: { messageId: "1" } },
];

describe("service worker yönlendirmesi = uygulama içi yönlendirme", () => {
  it.each(VAKALAR)("$ad", ({ data }) => {
    const bildirim: InAppNotification = {
      id: "1",
      title: "x",
      body: "y",
      data,
      receivedAt: 0,
      read: false,
    };

    // Uygulama içi null döndüğünde service worker "/" açar (aynı anlam).
    expect(swHedefi(data)).toBe(getNotificationHref(bildirim) ?? "/");
  });

  it("mesaj bildirimi ana sayfaya DEĞİL sohbete gider (asıl arıza)", () => {
    expect(swHedefi({ type: "MESSAGE", senderId: "91" })).toBe("/chat/91");
  });

  it("görülme ve çevre uyarısı ilan detayına gider", () => {
    expect(swHedefi({ type: "SIGHTING", adId: "338" })).toBe("/pet/338");
    expect(swHedefi({ type: "NEARBY_AD", adId: "77" })).toBe("/pet/77");
  });
});
