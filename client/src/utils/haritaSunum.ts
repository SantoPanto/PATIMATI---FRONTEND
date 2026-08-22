import type { AdType } from "../services/types";

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
