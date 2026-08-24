import type { AdResponse, AdType } from "../services/types";
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

export type HaritaOdagi =
  | { tip: "nokta"; nokta: [number, number]; yakinlik: number }
  | { tip: "sinir"; noktalar: [number, number][] }
  | { tip: "varsayilan"; nokta: [number, number]; yakinlik: number };

/*
 * Filtre/arama sonucu değişince görünüm kuralı: seçili ilan varsa ona
 * yaklaş; yoksa kalan işaretçilerin TÜMÜNÜ kadraja al (fitBounds) — "filtreye
 * bastım ama haritada bir şey değişmedi" hissinin ve kadraj dışında kalan
 * şehirlerin (22.08: Bulunan'daki Bursa ilanı görünmüyordu) çözümü.
 */
export function haritaOdagi(
  secili: [number, number] | null,
  noktalar: [number, number][],
): HaritaOdagi {
  if (secili) {
    return { tip: "nokta", nokta: secili, yakinlik: 13 };
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
