/*
 * SERVICE WORKER'IN BİLDİRİM YÖNLENDİRME KAYNAĞI — TEK KOPYA.
 *
 * Service worker ayrı bir bağlamda çalışır ve uygulama modüllerini import
 * edemez; yönlendirme mantığının onun içine METİN olarak gömülmesi gerekir.
 * Bu dosya o metnin TEK sahibidir:
 *
 *   - scripts/generate-firebase-sw.mjs bu dosyayı okuyup işaretçiler
 *     arasındaki gövdeyi service worker'a gömer,
 *   - sw-bildirim-hedefi.test.ts aynı gövdeyi çalıştırıp
 *     getNotificationHref ile karşılaştırır.
 *
 * Neden böyle: uygulama içi bildirim yönlendirmesi 23.08'de ortak bir
 * çözücüye taşındı ama service worker'daki kopya ATLANDI ve yalnız
 * AI_MATCH'i yönlendirmeye devam etti — mesaj, görülme ve çevre uyarısı
 * bildirimlerine telefon kilitliyken dokunan kullanıcı ana sayfaya
 * düşüyordu (24.08'de ölçüldü). İki kopyanın bir daha ayrışmaması için
 * kaynak tek yerde tutuluyor ve test farkı yakalıyor.
 *
 * ⚠ Gövde DÜZ JAVASCRIPT olmalı (tip yok, import yok): hem service worker
 * hem `new Function` ile çalıştırılıyor.
 */
export const SW_BILDIRIM_HEDEFI_KAYNAK = `function bildirimHedefi(data) {
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
}`;
