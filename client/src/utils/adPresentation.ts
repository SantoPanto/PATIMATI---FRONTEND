import type {
  AdResponse,
  AdType,
  AgeGroup,
  Gender,
  Species,
} from "../services/types";
import { getImageUrl, getMediaUrl } from "./imageUrl";

import { translateEnum } from "./enumTranslator";

export { getImageUrl, getMediaUrl };

/**
 * Sunucu cins bilinmiyorken `MIXED_OR_UNKNOWN` yazıyor (AdMapper'daki
 * `UNKNOWN_BREED` sabiti). Ham hâliyle basılınca kartta "Kedi ·
 * MIXED_OR_UNKNOWN" görünüyordu — ölçüldü, 21.08 canlı.
 */
export function getBreedLabel(breed?: string | null): string {
  if (!breed || !breed.trim() || breed === "MIXED_OR_UNKNOWN") {
    return "Cins belirtilmemiş";
  }
  return breed;
}

/**
 * `getBreedLabel`'in yer tutucu metin ("Cins belirtilmemiş") döndürmesi
 * gerektiren yerlerde (ör. " • {cins}" gibi ayraçla eklenen kısa gösterim)
 * placeholder'ı hiç basmayıp alanı tamamen atlamak isteyen çağıranlar için.
 */
export function hasKnownBreed(breed?: string | null): boolean {
  return Boolean(breed && breed.trim() && breed !== "MIXED_OR_UNKNOWN");
}

export function getSpeciesLabel(species: Species): string {
  if (species === "UNKNOWN") return "Belirtilmemiş";
  return translateEnum(species, "species", "Hayvan");
}

export function getGenderLabel(gender: Gender): string {
  if (gender === "UNKNOWN") return "Belirtilmemiş";
  return translateEnum(gender, "gender", "Belirtilmemiş");
}

export function getAgeLabel(ageGroup: AgeGroup): string {
  if (ageGroup === "UNKNOWN") return "Yaş belirtilmemiş";
  return translateEnum(ageGroup, "ageGroup", "Yaş belirtilmemiş");
}

export function getAdTypeLabel(adType: AdType): string {
  return translateEnum(adType, "adType", "İlan");
}

export function getAdImage(ad: AdResponse): string {
  const firstPhoto = ad.photoUrls?.find((url) => Boolean(url?.trim()));
  return getImageUrl(firstPhoto);
}

export function getAdLocation(ad: AdResponse): string {
  // İl/ilçe (BE V19) öncelikli: kullanıcıya "Nilüfer, Bursa" anlamlıdır,
  // "39.9334, 32.8597" değil. Eski kayıtlarda backfill koşulana kadar bu
  // alanlar boş gelebilir — o durumda koordinat gösterilmeye devam eder
  // ki konum bilgisi olan hiçbir ilan "belirtilmemiş"e düşmesin.
  const city = ad.city?.trim();
  const district = ad.district?.trim();

  if (city && district) {
    return `${district}, ${city}`;
  }
  if (city || district) {
    return (city || district) as string;
  }

  if (
    typeof ad.latitude === "number" &&
    typeof ad.longitude === "number" &&
    Number.isFinite(ad.latitude) &&
    Number.isFinite(ad.longitude)
  ) {
    return `${ad.latitude.toFixed(4)}, ${ad.longitude.toFixed(4)}`;
  }

  return "Konum belirtilmemiş";
}

export function getRelativeDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Tarih belirtilmemiş";

  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));

  if (elapsedMinutes < 1) return "Az önce";
  if (elapsedMinutes < 60) return `${elapsedMinutes} dakika önce`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} saat önce`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays} gün önce`;

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getAdDetailPath(ad: AdResponse): string {
  return ad.adType === "ADOPTION"
    ? `/adoption/${ad.id}`
    : `/pet/${ad.id}`;
}

export function getOwnerInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");

  return initials || "P";
}
