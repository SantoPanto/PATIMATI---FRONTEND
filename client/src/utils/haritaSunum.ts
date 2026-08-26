import type { AdResponse, AdType, PoiType } from "../services/types";
import { getSpeciesLabel } from "./adPresentation";

/*
 * Harita işaretçi renkleri — styles/map.css'teki .pet-map-marker--* paletiyle
 * aynı. Renk pathOptions'tan basılır: className canlıda SVG path'e
 * ulaşmıyordu (22.08 ölçümü: 20 işaretçinin 20'si Leaflet varsayılan
 * mavisiydi), CSS sınıfı tek başına güvenilir değil.
 */
export const HARITA_RENKLERI = {
  LOST: "#ef4444",
  FOUND: "#22c55e",
  ADOPTION: "#f59e0b",
} as const;

export function getMarkerType(adType: AdType) {
  if (adType === "LOST") {
    return {
      label: "Kayıp",
      className: "lost",
      fillColor: HARITA_RENKLERI.LOST,
    };
  }

  if (adType === "FOUND") {
    return {
      label: "Bulunan",
      className: "found",
      fillColor: HARITA_RENKLERI.FOUND,
    };
  }

  return {
    label: "Sahiplendirme",
    className: "adoption",
    fillColor: HARITA_RENKLERI.ADOPTION,
  };
}

export const VARSAYILAN_MERKEZ: [number, number] = [40.195, 29.06]; // Bursa

/*
 * POI (veteriner/petshop/barınak) işaretçi renk+etiket paleti — ilan
 * renklerinden (kırmızı/yeşil/turuncu) BİLEREK farklı, harita tek bakışta
 * ilan mı hizmet noktası mı ayırt edilsin diye. Veteriner rengi
 * VetDirectoryPage'deki (#2563EB) ile BİLEREK aynı — sitede "veteriner"
 * kavramı zaten o maviyle temsil ediliyor.
 */
export const POI_RENKLERI: Record<PoiType, string> = {
  VETERINARY: "#2563eb",
  PET_SHOP: "#7c3aed",
  SHELTER: "#0d9488",
};

export function getPoiMarkerType(type: PoiType) {
  if (type === "VETERINARY") {
    return { label: "Veteriner", color: POI_RENKLERI.VETERINARY };
  }
  if (type === "PET_SHOP") {
    return { label: "Petshop", color: POI_RENKLERI.PET_SHOP };
  }
  return { label: "Barınak", color: POI_RENKLERI.SHELTER };
}

export type HaritaOdagi =
  | { tip: "nokta"; nokta: [number, number]; yakinlik: number }
  | { tip: "sinir"; noktalar: [number, number][] }
  | { tip: "varsayilan"; nokta: [number, number]; yakinlik: number };

/*
 * Görünüm önceliği: seçili ilan > kullanıcının konumu > kalan işaretçilerin
 * TÜMÜ (fitBounds) > varsayılan merkez.
 *
 * Konum, ilan sınırından ÖNCE gelir (26.08 talebi: "harita açılınca direkt
 * konumumuza yakınlaşmış olsun") — eskiden ilan varsa harita her zaman TÜM
 * ilanları kadraja alıyordu, konum bilinse bile kullanıcı kendi çevresini
 * göremiyordu. Konum yoksa (izin verilmedi/alınamadı) eski davranışa
 * (ilanları kadraja al) döner.
 */
export function haritaOdagi(
  secili: [number, number] | null,
  noktalar: [number, number][],
  konum?: [number, number] | null,
): HaritaOdagi {
  if (secili) {
    return { tip: "nokta", nokta: secili, yakinlik: 13 };
  }

  if (konum) {
    return { tip: "nokta", nokta: konum, yakinlik: 14 };
  }

  if (noktalar.length > 0) {
    return { tip: "sinir", noktalar };
  }

  return { tip: "varsayilan", nokta: VARSAYILAN_MERKEZ, yakinlik: 12 };
}

/*
 * Harita süzgeci — sayfadaki çipler (Tümü/Kayıp/Bulunan/Sahiplendirme) ve
 * arama kutusunun tek doğruluk kaynağı. Sahiplendirme işaretçileri haritada
 * zaten çiziliyor ve lejantta yer alıyordu ama süzgeçte SEÇENEĞİ yoktu
 * (22.08 mobil taraması) — tip "ALL" | AdType olduğu için yeni bir ilan tipi
 * gelirse süzgeç davranışı çip unutulsa bile tanımlı kalır.
 */
export type HaritaFiltresi = "ALL" | AdType;

export function haritadaGorunur(
  ad: Pick<AdResponse, "adType" | "title" | "breed" | "species">,
  filtre: HaritaFiltresi,
  arama: string,
): boolean {
  if (filtre !== "ALL" && ad.adType !== filtre) {
    return false;
  }

  const normalize = (deger: string) => deger.toLocaleLowerCase("tr-TR");
  const aranan = normalize(arama.trim());
  if (!aranan) {
    return true;
  }

  return Boolean(
    (ad.title && normalize(ad.title).includes(aranan)) ||
      (ad.breed && normalize(ad.breed).includes(aranan)) ||
      normalize(getSpeciesLabel(ad.species)).includes(aranan),
  );
}

/*
 * Hizmet noktası süzgeci — ilan süzgeciyle AYNI desen (Tümü | tek tip),
 * bağımsız aç/kapa çipler yerine (26.08 talebi: iki grup aynı mantıkla
 * çalışsın, sağ alt lejant da buradan tek kaynaktan üretilebilsin).
 */
export type PoiFiltresi = "ALL" | PoiType;

export function poiGorunur(poi: { type: PoiType }, filtre: PoiFiltresi): boolean {
  return filtre === "ALL" || poi.type === filtre;
}

type LejantKalemi = { label: string; color: string };

/*
 * Sağ alt lejant artık sabit değil — o an açık olan ilan/hizmet süzgeçlerine
 * göre üretilir (26.08 talebi: "sadece kayıp açınca sağ altta sadece kayıp
 * yazsın"). İki liste ayrı tutulur ki MapPage ihtiyaç duyarsa (ör. hizmet
 * sonucu sıfırsa) ayrı ayrı gizleyebilsin.
 */
export function adLejantKalemleri(filtre: HaritaFiltresi): LejantKalemi[] {
  const tumu: LejantKalemi[] = [
    { label: "Kayıp", color: HARITA_RENKLERI.LOST },
    { label: "Bulunan", color: HARITA_RENKLERI.FOUND },
    { label: "Sahiplendirme", color: HARITA_RENKLERI.ADOPTION },
  ];

  if (filtre === "ALL") {
    return tumu;
  }

  return tumu.filter((kalem) => kalem.label === getMarkerType(filtre).label);
}

export function poiLejantKalemleri(filtre: PoiFiltresi): LejantKalemi[] {
  const tumu: PoiType[] = ["VETERINARY", "PET_SHOP", "SHELTER"];

  if (filtre === "ALL") {
    return tumu.map((tip) => getPoiMarkerType(tip));
  }

  return [getPoiMarkerType(filtre)];
}
