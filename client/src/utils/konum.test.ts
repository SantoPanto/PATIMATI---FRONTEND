import { afterEach, describe, expect, it, vi } from "vitest";

import { KONUM_MESAJLARI, KonumHatasi, konumAl } from "./konum";

/**
 * "Telefonda konum hatası" şikâyetinin bekçisi.
 *
 * <p>Sahada bildirilen belirti tek bir metindi: "Konum alınamadı. Lütfen
 * tarayıcınızdan konum iznini etkinleştirin." Bu metin ÜÇ ayrı arızaya
 * birden basılıyordu ve telefonda en sık olanı — GPS kilidinin gelmemesi
 * (TIMEOUT) — izin sorunu gibi gösteriyordu. Kullanıcı zaten verdiği izni
 * aramaya gidiyordu.
 *
 * <p>Ölçülen davranış: hata kodu ayrımı + zaman aşımında yüksek doğruluk
 * KAPALI ikinci deneme. Tip denetimi bunların hiçbirini göremez; ikisi de
 * yalnız çalışma anında görünür.
 */

/** Tarayıcı hata nesnesinin sabitleriyle birlikte taklidi. */
function konumHatasi(code: 1 | 2 | 3): GeolocationPositionError {
  return {
    code,
    message: "",
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

function konumTakla(
  davranis: (
    basarili: PositionCallback,
    hatali: PositionErrorCallback,
    secenek?: PositionOptions,
  ) => void,
) {
  const casus = vi.fn(davranis);
  Object.defineProperty(globalThis.navigator, "geolocation", {
    value: { getCurrentPosition: casus },
    configurable: true,
  });
  return casus;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("konumAl", () => {
  it("başarılı okumada enlem/boylam döner", async () => {
    konumTakla((basarili) =>
      basarili({
        coords: { latitude: 39.58, longitude: 26.87 },
      } as GeolocationPosition),
    );

    await expect(konumAl()).resolves.toEqual({ enlem: 39.58, boylam: 26.87 });
  });

  it("izin reddinde İZİN metnini verir ve İKİNCİ DENEME YAPMAZ", async () => {
    const casus = konumTakla((_basarili, hatali) => hatali(konumHatasi(1)));

    await expect(konumAl()).rejects.toThrow(KONUM_MESAJLARI.IZIN_YOK);
    // Kullanıcı "hayır" dedi; ikinci çağrı yeni bir izin kutusu açmaz,
    // yalnız aynı hatayı geciktirir.
    expect(casus).toHaveBeenCalledTimes(1);
  });

  it("konum servisi kapalıyken (POSITION_UNAVAILABLE) izin metnini VERMEZ", async () => {
    konumTakla((_basarili, hatali) => hatali(konumHatasi(2)));

    const hata = await konumAl().catch((e) => e);
    expect((hata as KonumHatasi).kod).toBe("ULASILAMIYOR");
    expect((hata as KonumHatasi).message).not.toBe(KONUM_MESAJLARI.IZIN_YOK);
  });

  it("zaman aşımında yüksek doğruluk KAPALI ikinci denemeyi yapar", async () => {
    let cagri = 0;
    const casus = konumTakla((basarili, hatali) => {
      cagri += 1;
      if (cagri === 1) {
        hatali(konumHatasi(3));
        return;
      }
      basarili({
        coords: { latitude: 41.01, longitude: 29.03 },
      } as GeolocationPosition);
    });

    await expect(konumAl()).resolves.toEqual({ enlem: 41.01, boylam: 29.03 });
    expect(casus).toHaveBeenCalledTimes(2);

    const ilkSecenek = casus.mock.calls[0][2] as PositionOptions;
    const ikinciSecenek = casus.mock.calls[1][2] as PositionOptions;

    expect(ilkSecenek.enableHighAccuracy).toBe(true);
    // Kapalı alanda GPS kilidi gelmiyor; ağ tabanlı konum çalışıyor.
    expect(ikinciSecenek.enableHighAccuracy).toBe(false);
    expect(ikinciSecenek.timeout).toBeGreaterThan(ilkSecenek.timeout as number);
  });

  it("ikinci deneme de zaman aşımına uğrarsa ZAMAN AŞIMI metnini verir", async () => {
    konumTakla((_basarili, hatali) => hatali(konumHatasi(3)));

    await expect(konumAl()).rejects.toThrow(KONUM_MESAJLARI.ZAMAN_ASIMI);
  });

  it("tarayıcı desteklemiyorsa süresiz beklemez, hemen söyler", async () => {
    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    await expect(konumAl()).rejects.toThrow(KONUM_MESAJLARI.DESTEKSIZ);
  });
});
