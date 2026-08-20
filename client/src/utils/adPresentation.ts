import type {
  AdResponse,
  AdType,
  AgeGroup,
  Gender,
  Species,
} from "../services/types";
import { getImageUrl, getMediaUrl } from "./imageUrl";

export { getImageUrl, getMediaUrl };

const speciesLabels: Record<Species, string> = {
  CAT: "Kedi",
  DOG: "Köpek",
  UNKNOWN: "Belirtilmemiş",
};

const genderLabels: Record<Gender, string> = {
  FEMALE: "Dişi",
  MALE: "Erkek",
  UNKNOWN: "Belirtilmemiş",
};

const ageLabels: Record<AgeGroup, string> = {
  BABY: "Yavru",
  YOUNG: "Genç",
  ADULT: "Yetişkin",
  SENIOR: "Yaşlı",
  UNKNOWN: "Yaş belirtilmemiş",
};

const adTypeLabels: Record<AdType, string> = {
  LOST: "Kayıp",
  FOUND: "Bulundu",
  ADOPTION: "Sahiplendirme",
};

export function getSpeciesLabel(species: Species): string {
  return speciesLabels[species] ?? "Hayvan";
}

export function getGenderLabel(gender: Gender): string {
  return genderLabels[gender] ?? "Belirtilmemiş";
}

export function getAgeLabel(ageGroup: AgeGroup): string {
  return ageLabels[ageGroup] ?? "Yaş belirtilmemiş";
}

export function getAdTypeLabel(adType: AdType): string {
  return adTypeLabels[adType] ?? "İlan";
}

export function getAdImage(ad: AdResponse): string {
  const firstPhoto = ad.photoUrls?.find((url) => Boolean(url?.trim()));
  return getImageUrl(firstPhoto);
}

export function getAdLocation(ad: AdResponse): string {
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
