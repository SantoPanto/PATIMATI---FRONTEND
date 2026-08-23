/*
 * Cihazdan konum alma — TEK yerden.
 *
 * Neden var (23.08 saha şikâyeti: "telefonda konum hatası aldı"):
 * uygulamada yedi ayrı `getCurrentPosition` çağrısı vardı ve altısı hata
 * KODUNA hiç bakmıyordu. Üçü şu tek metni basıyordu:
 *   "Konum alınamadı. Lütfen tarayıcınızdan konum iznini etkinleştirin."
 * Oysa telefonda en sık görülen hata izin reddi (kod 1) DEĞİL, zaman aşımı
 * (kod 3): `enableHighAccuracy: true` GPS kilidi bekler ve kapalı alanda 10
 * saniyede kilit gelmez. Kullanıcı izni zaten vermiştir; mesaj onu var
 * olmayan bir ayarı aramaya gönderiyordu. İkisi (SightingModal,
 * SettingsPage) ise hiç seçenek geçirmediği için SÜRESİZ bekliyordu —
 * tarayıcı varsayılanı `timeout: Infinity`'dir.
 *
 * Bu yüzden:
 *   1. Hata kodu ayrıştırılır ve her koda GERÇEĞİ söyleyen metin verilir.
 *   2. Zaman aşımında ikinci deneme yapılır: yüksek doğruluk KAPALI, süre
 *      uzun, önbellek kabul. Ağ/Wi-Fi tabanlı konum kapalı alanda çalışır;
 *      25 km'lik eşleştirme yarıçapı için doğruluğu fazlasıyla yeterlidir.
 *   3. İzin reddinde İKİNCİ DENEME YAPILMAZ — kullanıcı zaten "hayır" dedi.
 */

export type KonumHataKodu =
  | "DESTEKSIZ"
  | "IZIN_YOK"
  | "ULASILAMIYOR"
  | "ZAMAN_ASIMI";

export class KonumHatasi extends Error {
  readonly kod: KonumHataKodu;

  constructor(kod: KonumHataKodu, mesaj: string) {
    super(mesaj);
    this.name = "KonumHatasi";
    this.kod = kod;
  }
}

export const KONUM_MESAJLARI: Record<KonumHataKodu, string> = {
  DESTEKSIZ: "Tarayıcınız konum özelliğini desteklemiyor. İl/ilçe yazarak devam edebilirsiniz.",
  IZIN_YOK:
    "Konum izni verilmedi. Tarayıcı adres çubuğundaki kilit simgesinden bu siteye konum izni verip tekrar deneyin.",
  ULASILAMIYOR:
    "Konum bilgisi alınamadı. Telefonunuzun konum servisi kapalı olabilir; açıp tekrar deneyin ya da il/ilçe yazın.",
  ZAMAN_ASIMI:
    "Konum zamanında alınamadı — kapalı alanda sık olur. Açık bir yerde tekrar deneyin ya da il/ilçe yazıp koordinatı doldurun.",
};

export interface Koordinat {
  enlem: number;
  boylam: number;
}

/** Birinci deneme: GPS kilidi bekler, en doğru sonucu verir. */
const HASSAS_SECENEK: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

/** İkinci deneme: ağ/Wi-Fi tabanlı, kapalı alanda da sonuç döner. */
const GENIS_SECENEK: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 25_000,
  maximumAge: 300_000,
};

function kodaCevir(hata: GeolocationPositionError): KonumHataKodu {
  if (hata.code === hata.PERMISSION_DENIED) return "IZIN_YOK";
  if (hata.code === hata.TIMEOUT) return "ZAMAN_ASIMI";
  return "ULASILAMIYOR";
}

function birDeneme(secenek: PositionOptions): Promise<Koordinat> {
  return new Promise((cozumle, reddet) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => cozumle({ enlem: coords.latitude, boylam: coords.longitude }),
      (hata) => {
        const kod = kodaCevir(hata);
        reddet(new KonumHatasi(kod, KONUM_MESAJLARI[kod]));
      },
      secenek,
    );
  });
}

/**
 * Cihazdan konum ister. Başarısızlıkta {@link KonumHatasi} fırlatır —
 * `hata.message` doğrudan kullanıcıya gösterilebilir.
 */
export async function konumAl(): Promise<Koordinat> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new KonumHatasi("DESTEKSIZ", KONUM_MESAJLARI.DESTEKSIZ);
  }

  try {
    return await birDeneme(HASSAS_SECENEK);
  } catch (hata) {
    /*
     * Yalnız zaman aşımında yeniden deniyoruz. İzin reddinde ikinci çağrı
     * kullanıcıya ikinci bir izin kutusu göstermez, sadece aynı hatayı
     * geciktirir; "konum servisi kapalı"da da sonuç değişmez.
     */
    if (hata instanceof KonumHatasi && hata.kod === "ZAMAN_ASIMI") {
      return await birDeneme(GENIS_SECENEK);
    }
    throw hata;
  }
}

/** Ekranlara yazılacak metni verir; beklenmedik hatada da anlaşılır kalır. */
export function konumHataMesaji(hata: unknown): string {
  if (hata instanceof KonumHatasi) {
    return hata.message;
  }
  return KONUM_MESAJLARI.ULASILAMIYOR;
}
