import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  YUK_COK_BUYUK_MESAJI,
  ZAMAN_ASIMI_DURUMU,
  ZAMAN_ASIMI_MESAJI,
  request,
} from "./api";

/**
 * İki saha arızasının bekçisi.
 *
 * <p><b>1) SONSUZ "İlan oluşturuluyor..." (23.08 ekran görüntüleri 3 ve 4):</b>
 * kullanıcı ilan oluştur'a basıyor, buton dönmeye başlıyor ve HİÇBİR ŞEY
 * olmuyor — hata da çıkmıyor. Sebep: {@code fetch}in kendiliğinden zaman
 * aşımı yoktur. Mobil ağda yarıda kalan yükleme ne çözülür ne reddedilir;
 * çağıranın {@code finally} bloğu hiç çalışmaz, {@code isSubmitting} hep
 * true kalır. Bu yüzden {@code request()} artık isteği kendisi iptal ediyor.
 *
 * <p><b>2) ANLAMSIZ "(413)" (ekran görüntüleri 1 ve 5):</b> gövde sınırını
 * aşan istek uygulamaya ULAŞMADAN ters vekil (nginx) tarafından kesiliyor ve
 * cevap gövdesi JSON değil HTML oluyor. Alan taraması (message/detail/
 * error/title) boşa düşünce kullanıcı "İşlem sırasında bir hata oluştu (413)"
 * görüyordu. Canlıda ölçüldü (23.08): 6 MB tek dosya → Spring'in JSON 413'ü
 * ("Maximum upload size exceeded" — İngilizce), 20 MB toplam → nginx'in HTML
 * 413 sayfası. İkisi de kullanıcıya ne yapacağını söylemiyor.
 */

const gercekFetch = globalThis.fetch;

/*
 * `request()` jetonu okumak için localStorage/sessionStorage'a bakıyor. Bu
 * çalışmadaki Node sürümünde jsdom'un depoları global'e taşınmıyor
 * (--localstorage-file uyarısı) ve çağrı daha fetch'e varmadan TypeError ile
 * düşüyor. Ölçtüğümüz katman zaman aşımı/hata eşlemesi olduğu için depoyu
 * yalnızca AYAKTA tutuyoruz; davranışını taklit etmiyoruz.
 */
function bellekDepo(): Storage {
  const kutu = new Map<string, string>();
  return {
    get length() {
      return kutu.size;
    },
    clear: () => kutu.clear(),
    getItem: (anahtar: string) => kutu.get(anahtar) ?? null,
    key: (sira: number) => Array.from(kutu.keys())[sira] ?? null,
    removeItem: (anahtar: string) => {
      kutu.delete(anahtar);
    },
    setItem: (anahtar: string, deger: string) => {
      kutu.set(anahtar, String(deger));
    },
  } as Storage;
}

for (const ad of ["localStorage", "sessionStorage"] as const) {
  if (!(globalThis as Record<string, unknown>)[ad]) {
    Object.defineProperty(globalThis, ad, {
      value: bellekDepo(),
      configurable: true,
    });
  }
}

/** Hiç sonuçlanmayan, yalnız iptal sinyaline cevap veren fetch. */
function asiliKalanFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_cozumle, reddet) => {
        init?.signal?.addEventListener("abort", () => {
          reddet(new DOMException("The operation was aborted.", "AbortError"));
        });
      }),
  );
}

function cevapVerenFetch(status: number, body: string, contentType: string) {
  return vi.fn(async () =>
    new Response(body, { status, headers: { "Content-Type": contentType } }),
  );
}

describe("request(): zaman aşımı", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = gercekFetch;
  });

  it("metin isteği 30 sn sonra iptal edilir ve 408 ApiError'a çevrilir", async () => {
    globalThis.fetch = asiliKalanFetch() as unknown as typeof fetch;

    const istek = request("/api/deneme", { method: "GET" });
    const yakalanan = istek.catch((hata) => hata);

    await vi.advanceTimersByTimeAsync(30_000);

    const hata = await yakalanan;
    expect(hata).toBeInstanceOf(ApiError);
    expect((hata as ApiError).status).toBe(ZAMAN_ASIMI_DURUMU);
    expect((hata as ApiError).message).toBe(ZAMAN_ASIMI_MESAJI);
  });

  it("fotoğraflı istek (FormData) 30 sn'de KESİLMEZ, 180 sn'de kesilir", async () => {
    globalThis.fetch = asiliKalanFetch() as unknown as typeof fetch;

    const gövde = new FormData();
    gövde.append("images", new File(["x"], "kedi.jpg", { type: "image/jpeg" }));

    let sonuclandi = false;
    const istek = request("/api/ads", { method: "POST", body: gövde });
    const yakalanan = istek.catch((hata) => {
      sonuclandi = true;
      return hata;
    });

    // Yavaş mobil yüklemeyi erken kesmek, düzeltmeyi yeni bir arızaya çevirirdi.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(sonuclandi).toBe(false);

    await vi.advanceTimersByTimeAsync(150_000);
    const hata = await yakalanan;
    expect((hata as ApiError).status).toBe(ZAMAN_ASIMI_DURUMU);
  });

  it("çağıranın verdiği süre (timeoutMs) varsayılanı ezer", async () => {
    globalThis.fetch = asiliKalanFetch() as unknown as typeof fetch;

    const yakalanan = request("/api/deneme", { timeoutMs: 5_000 }).catch(
      (hata) => hata,
    );

    await vi.advanceTimersByTimeAsync(5_000);
    expect((await yakalanan as ApiError).status).toBe(ZAMAN_ASIMI_DURUMU);
  });
});

describe("request(): 413 mesajı", () => {
  afterEach(() => {
    globalThis.fetch = gercekFetch;
  });

  it("nginx'in HTML 413'ünde jenerik metin yerine anlaşılır mesaj verir", async () => {
    globalThis.fetch = cevapVerenFetch(
      413,
      "<html>\n<head><title>413 Request Entity Too Large</title></head>\n</html>",
      "text/html",
    ) as unknown as typeof fetch;

    const hata = (await request("/api/ads", { method: "POST" }).catch(
      (e) => e,
    )) as ApiError;

    expect(hata.status).toBe(413);
    expect(hata.message).toBe(YUK_COK_BUYUK_MESAJI);
    expect(hata.message).not.toMatch(/\(413\)/);
  });

  it("Spring'in İngilizce JSON 413'ünü de kendi metnimizle değiştirir", async () => {
    globalThis.fetch = cevapVerenFetch(
      413,
      JSON.stringify({
        type: "about:blank",
        title: "Payload Too Large",
        status: 413,
        detail: "Maximum upload size exceeded",
      }),
      "application/json",
    ) as unknown as typeof fetch;

    const hata = (await request("/api/ads", { method: "POST" }).catch(
      (e) => e,
    )) as ApiError;

    expect(hata.message).toBe(YUK_COK_BUYUK_MESAJI);
  });

  it("413 dışındaki hatalarda sunucunun kendi Türkçe mesajı korunur", async () => {
    globalThis.fetch = cevapVerenFetch(
      400,
      JSON.stringify({ detail: "Tarih formatı yyyy-MM-dd olmalıdır" }),
      "application/json",
    ) as unknown as typeof fetch;

    const hata = (await request("/api/ads", { method: "POST" }).catch(
      (e) => e,
    )) as ApiError;

    expect(hata.message).toBe("Tarih formatı yyyy-MM-dd olmalıdır");
  });
});
