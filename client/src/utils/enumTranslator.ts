/**
 * Centralized Enum & Label Localization (Eşleme ve Çeviri Katmanı)
 * Converts backend Enum values to human-readable Turkish strings in UI.
 */

export type EnumCategory =
  | "color"
  | "eyeColor"
  | "gender"
  | "ageGroup"
  | "adType"
  | "presenceStatus"
  | "species"
  | "coatPattern"
  | "complaintStatus"
  | "complaintReason"
  | "aiStatus"
  | "adResolutionStatus"
  | "role";

export const COLOR_TRANSLATIONS: Record<string, string> = {
  BLACK: "Siyah",
  WHITE: "Beyaz",
  GRAY: "Gri",
  BROWN: "Kahverengi",
  ORANGE: "Turuncu",
  CREAM: "Krem",
  GOLDEN: "Altın",
  BEIGE: "Bej",
  OTHER: "Diğer",
};

export const EYE_COLOR_TRANSLATIONS: Record<string, string> = {
  UNKNOWN: "Bilinmiyor",
  BROWN: "Kahverengi",
  BLUE: "Mavi",
  GREEN: "Yeşil",
  AMBER: "Kehribar",
  HAZEL: "Ela",
  HETEROCHROMIA: "Farklı Renkler (Heterokromi)",
  OTHER: "Diğer",
};

export const GENDER_TRANSLATIONS: Record<string, string> = {
  FEMALE: "Dişi",
  MALE: "Erkek",
  UNKNOWN: "Bilinmiyor",
};

export const AGE_GROUP_TRANSLATIONS: Record<string, string> = {
  BABY: "Yavru",
  YOUNG: "Genç",
  ADULT: "Yetişkin",
  SENIOR: "Yaşlı",
  UNKNOWN: "Bilinmiyor",
};

export const AD_TYPE_TRANSLATIONS: Record<string, string> = {
  LOST: "Kayıp",
  FOUND: "Bulundu",
  ADOPTION: "Sahiplendirme",
};

export const PRESENCE_STATUS_TRANSLATIONS: Record<string, string> = {
  YES: "Evet",
  NO: "Hayır",
  UNKNOWN: "Bilinmiyor",
};

export const SPECIES_TRANSLATIONS: Record<string, string> = {
  CAT: "Kedi",
  DOG: "Köpek",
  BIRD: "Kuş",
  UNKNOWN: "Bilinmiyor",
  OTHER: "Diğer",
};

export const COAT_PATTERN_TRANSLATIONS: Record<string, string> = {
  UNKNOWN: "Belirtilmemiş",
  SOLID: "Tek Renk",
  STRIPED: "Çizgili / Tekir",
  SPOTTED: "Benekli",
  PATCHED: "Parçalı / Alaca",
  CALICO: "Sarman / Üç Renk",
  TORTOISESHELL: "Kaplumbağa Kabuğu",
  OTHER: "Diğer",
};

export const COMPLAINT_STATUS_TRANSLATIONS: Record<string, string> = {
  BEKLEMEDE: "Beklemede",
  INCELEMEDE: "İncelemede",
  COZULDU: "Çözüldü",
};

export const COMPLAINT_REASON_TRANSLATIONS: Record<string, string> = {
  SAHTE_ILAN: "Sahte veya Yanıltıcı İlan",
  UYGUNSUZ_ICERIK: "Uygunsuz / Hakaret İçeren İçerik",
  DOLANDIRICILIK: "Dolandırıcı Şüphesi",
  KOTU_DIL_KULLANIMI: "Kötü Dil Kullanımı / Taciz",
  DIGER: "Diğer",
};

export const AI_STATUS_TRANSLATIONS: Record<string, string> = {
  PENDING: "Bekliyor",
  DONE: "Tamamlandı",
  FAILED: "Başarısız",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  NOT_APPLICABLE: "Uygulanamaz",
};

export const AD_RESOLUTION_STATUS_TRANSLATIONS: Record<string, string> = {
  NONE: "Yok",
  FOUND: "Bulundu",
  ADOPTED: "Sahiplendirildi",
};

export const ROLE_TRANSLATIONS: Record<string, string> = {
  GUEST: "Misafir",
  USER: "Kullanıcı",
  ADMIN: "Yönetici",
};

export const ENUM_TRANSLATIONS: Record<EnumCategory, Record<string, string>> = {
  color: COLOR_TRANSLATIONS,
  eyeColor: EYE_COLOR_TRANSLATIONS,
  gender: GENDER_TRANSLATIONS,
  ageGroup: AGE_GROUP_TRANSLATIONS,
  adType: AD_TYPE_TRANSLATIONS,
  presenceStatus: PRESENCE_STATUS_TRANSLATIONS,
  species: SPECIES_TRANSLATIONS,
  coatPattern: COAT_PATTERN_TRANSLATIONS,
  complaintStatus: COMPLAINT_STATUS_TRANSLATIONS,
  complaintReason: COMPLAINT_REASON_TRANSLATIONS,
  aiStatus: AI_STATUS_TRANSLATIONS,
  adResolutionStatus: AD_RESOLUTION_STATUS_TRANSLATIONS,
  role: ROLE_TRANSLATIONS,
};

/**
 * Translates a single raw backend Enum string into Turkish.
 *
 * @param value Raw enum string from backend (e.g., 'BROWN', 'MALE')
 * @param category Optional Enum category to narrow lookup (e.g., 'color', 'gender')
 * @param fallback Default string to return if value is empty/null/unrecognized (default: 'Bilinmiyor')
 * @returns Localized Turkish label
 */
export function translateEnum(
  value?: string | null,
  category?: EnumCategory,
  fallback = "Bilinmiyor"
): string {
  if (!value || typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const rawKey = value.trim();
  const uppercaseKey = rawKey.toUpperCase();

  if (category && ENUM_TRANSLATIONS[category]) {
    const categoryDict = ENUM_TRANSLATIONS[category];
    if (categoryDict[rawKey] !== undefined) return categoryDict[rawKey];
    if (categoryDict[uppercaseKey] !== undefined) return categoryDict[uppercaseKey];
  } else {
    // Search across all dictionaries if category is omitted
    for (const dict of Object.values(ENUM_TRANSLATIONS)) {
      if (dict[rawKey] !== undefined) return dict[rawKey];
      if (dict[uppercaseKey] !== undefined) return dict[uppercaseKey];
    }
  }

  return rawKey || fallback;
}

/**
 * Translates an array of raw Enum strings and returns them as a formatted comma-separated string.
 *
 * @example translateEnumArray(['BROWN', 'GRAY'], 'color') -> "Kahverengi, Gri"
 * @param values Array of raw enum strings
 * @param category Enum category (e.g., 'color')
 * @param separator Separator string (default: ', ')
 */
export function translateEnumArray(
  values?: (string | null | undefined)[] | null,
  category?: EnumCategory,
  separator = ", "
): string {
  if (!values || !Array.isArray(values) || values.length === 0) {
    return "";
  }

  const translatedItems = values
    .filter((v): v is string => Boolean(v && typeof v === "string" && v.trim()))
    .map((v) => translateEnum(v, category))
    .filter(Boolean);

  return translatedItems.join(separator);
}
