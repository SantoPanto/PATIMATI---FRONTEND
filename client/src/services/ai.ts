import { request } from "./api";
import type {
  AiAnalysis,
  CoatPattern,
  MatchedAdResponseDTO,
  PetColor,
  PresenceStatus,
  Species,
} from "./types";

export type EyeColor =
  | "BROWN"
  | "BLUE"
  | "GREEN"
  | "AMBER"
  | "HAZEL"
  | "HETEROCHROMIA"
  | "UNKNOWN";

export const AI_COLOR_MAP: Record<string, PetColor> = {
  black: "BLACK",
  white: "WHITE",
  gray: "GRAY",
  grey: "GRAY",
  brown: "BROWN",
  orange: "ORANGE",
  cream: "CREAM",
  golden: "GOLDEN",
  beige: "BEIGE",
};

export const AI_PATTERN_MAP: Record<string, CoatPattern> = {
  solid: "SOLID",
  striped: "STRIPED",
  spotted: "SPOTTED",
  patched: "PATCHED",
  calico: "CALICO",
  tortoiseshell: "TORTOISESHELL",
  tabby: "STRIPED",
};

export interface ExtractedPetFeatures {
  species?: Species;
  breed?: string;
  coatPattern?: CoatPattern;
  colors?: PetColor[];
  eyeColor?: EyeColor;
  collarStatus?: PresenceStatus;
  earTagStatus?: PresenceStatus;
}

/**
 * AI servisinden görselleri analiz ettirip etiketleri ve nitelikleri alır.
 */
export async function analyzeImage(file: File): Promise<AiAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  return request<AiAnalysis>("/api/ai/analyze", {
    method: "POST",
    body: formData,
    requiresAuth: true,
  });
}

/**
 * AI vektör eşleştirme servisini tetikler (Sadece Kayıp ve Bulundu ilanları için).
 */
export async function matchImage(
  listingType: string,
  images: File[],
): Promise<MatchedAdResponseDTO[]> {
  const formData = new FormData();
  formData.append("listingType", listingType);
  images.forEach((img) => formData.append("images", img));

  return request<MatchedAdResponseDTO[]>("/api/ai-match", {
    method: "POST",
    body: formData,
    requiresAuth: true,
  });
}

/**
 * AI analiz nesnesinden form alanlarına aktarılabilir nitelikleri çıkarır.
 */
export function extractFeaturesFromAiAnalysis(
  analysis: AiAnalysis,
): ExtractedPetFeatures {
  const features: ExtractedPetFeatures = {};

  if (analysis.species === "cat" || analysis.species === "CAT") {
    features.species = "CAT";
  } else if (analysis.species === "dog" || analysis.species === "DOG") {
    features.species = "DOG";
  }

  if (analysis.breed && analysis.breed.trim()) {
    features.breed = analysis.breed.trim();
  }

  if (analysis.pattern && AI_PATTERN_MAP[analysis.pattern.toLowerCase()]) {
    features.coatPattern = AI_PATTERN_MAP[analysis.pattern.toLowerCase()];
  }

  const etiketten = (onek: string) =>
    (analysis.labels ?? [])
      .filter((etiket) => etiket.startsWith(onek))
      .map((etiket) => etiket.slice(onek.length).toLowerCase());

  const detectedColors = etiketten("soft:color_")
    .map((ad) => AI_COLOR_MAP[ad])
    .filter((color): color is PetColor => Boolean(color));

  if (detectedColors.length > 0) {
    features.colors = Array.from(new Set(detectedColors));
  }

  const eyeColors = etiketten("hard:eye_color_");
  if (eyeColors.length > 0 && eyeColors[0] !== "unknown") {
    const eyeMap: Record<string, EyeColor> = {
      brown: "BROWN",
      blue: "BLUE",
      green: "GREEN",
      amber: "AMBER",
      hazel: "HAZEL",
      heterochromia: "HETEROCHROMIA",
    };
    if (eyeMap[eyeColors[0]]) {
      features.eyeColor = eyeMap[eyeColors[0]];
    }
  }

  const collar = etiketten("bonus:collar_");
  if (collar.length > 0) {
    if (collar[0] === "collar") {
      features.collarStatus = "YES";
    } else if (collar[0] === "no_collar") {
      features.collarStatus = "NO";
    }
  }

  const earTag = etiketten("bonus:ear_tag_");
  if (earTag.length > 0) {
    if (earTag[0] === "ear_tag") {
      features.earTagStatus = "YES";
    } else if (earTag[0] === "no_ear_tag") {
      features.earTagStatus = "NO";
    }
  }

  return features;
}
