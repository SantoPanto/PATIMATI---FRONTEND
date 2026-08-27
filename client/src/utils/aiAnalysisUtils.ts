import type {
  AiAnalysis,
  CoatPattern,
  EyeColor,
  PetColor,
  PresenceStatus,
  Species,
} from "../services/types";

const VALID_SPECIES = new Set<Species>(["CAT", "DOG"]);

const VALID_PET_COLORS = new Set<PetColor>([
  "BLACK",
  "WHITE",
  "GRAY",
  "BROWN",
  "ORANGE",
  "CREAM",
  "GOLDEN",
  "BEIGE",
  "OTHER",
]);

const VALID_PATTERNS = new Set<CoatPattern>([
  "UNKNOWN",
  "SOLID",
  "STRIPED",
  "SPOTTED",
  "PATCHED",
  "CALICO",
  "TORTOISESHELL",
  "OTHER",
]);

const AI_COLOR_MAP: Record<string, PetColor> = {
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

const TURKISH_COLOR_MAP: Record<string, PetColor> = {
  siyah: "BLACK",
  beyaz: "WHITE",
  gri: "GRAY",
  kahverengi: "BROWN",
  kahve: "BROWN",
  turuncu: "ORANGE",
  krem: "CREAM",
  altın: "GOLDEN",
  altin: "GOLDEN",
  bej: "BEIGE",
  diğer: "OTHER",
  diger: "OTHER",
};

const AI_PATTERN_MAP: Record<string, CoatPattern> = {
  solid: "SOLID",
  striped: "STRIPED",
  spotted: "SPOTTED",
  patched: "PATCHED",
  calico: "CALICO",
  tortoiseshell: "TORTOISESHELL",
  tabby: "STRIPED",
  unknown: "UNKNOWN",
};

export type NormalizedAiAnalysis = {
  isPet: boolean;
  species: Species | null;
  speciesConfidence: number | null;
  breed: string | null;
  breedConfidence: number | null;
  coatPattern: CoatPattern;
  colors: PetColor[];
  eyeColor: EyeColor;
  collarStatus: PresenceStatus;
  earTagStatus: PresenceStatus;
  appliedCount: number;
  modelVersion: string | null;
};

/**
 * AI Analiz yanıtını frontend formlarının tüketebileceği standart yapıya çevirir.
 */
export function parseAiAnalysis(analysis: AiAnalysis): NormalizedAiAnalysis {
  let appliedCount = 0;

  // 1. isPet
  const isPet = (analysis.isPet ?? analysis.is_pet) !== false;

  // 2. species
  let species: Species | null = null;
  const rawSpecies = analysis.species?.toUpperCase();
  if (rawSpecies && VALID_SPECIES.has(rawSpecies as Species)) {
    species = rawSpecies as Species;
    appliedCount += 1;
  }

  // 3. breed
  let breed: string | null = null;
  if (
    analysis.breed &&
    analysis.breed.trim() &&
    analysis.breed.trim().toLowerCase() !== "unknown"
  ) {
    breed = analysis.breed.trim();
    appliedCount += 1;
  }

  // 4. coatPattern
  let coatPattern: CoatPattern = "UNKNOWN";
  const rawPattern = (analysis.coatPattern || analysis.pattern || "").trim();
  if (rawPattern) {
    const upper = rawPattern.toUpperCase();
    const lower = rawPattern.toLowerCase();
    if (VALID_PATTERNS.has(upper as CoatPattern)) {
      coatPattern = upper as CoatPattern;
    } else if (AI_PATTERN_MAP[lower]) {
      coatPattern = AI_PATTERN_MAP[lower];
    }
  }
  if (coatPattern !== "UNKNOWN") {
    appliedCount += 1;
  }

  // 5. colors
  const colorSet = new Set<PetColor>();

  if (Array.isArray(analysis.colors)) {
    for (const item of analysis.colors) {
      if (typeof item === "string") {
        const upper = item.trim().toUpperCase();
        if (VALID_PET_COLORS.has(upper as PetColor)) {
          colorSet.add(upper as PetColor);
        } else {
          const lower = item.trim().toLowerCase();
          if (AI_COLOR_MAP[lower]) {
            colorSet.add(AI_COLOR_MAP[lower]);
          } else if (TURKISH_COLOR_MAP[lower]) {
            colorSet.add(TURKISH_COLOR_MAP[lower]);
          }
        }
      }
    }
  }

  if (Array.isArray(analysis.labels)) {
    for (const label of analysis.labels) {
      if (typeof label === "string" && label.startsWith("soft:color_")) {
        const name = label.slice("soft:color_".length).toLowerCase();
        if (AI_COLOR_MAP[name]) {
          colorSet.add(AI_COLOR_MAP[name]);
        } else if (TURKISH_COLOR_MAP[name]) {
          colorSet.add(TURKISH_COLOR_MAP[name]);
        }
      }
    }
  }

  const colors = Array.from(colorSet);
  if (colors.length > 0) {
    appliedCount += 1;
  }

  const extractFromLabels = (prefix: string): string[] =>
    (analysis.labels ?? [])
      .filter((l) => l.startsWith(prefix))
      .map((l) => l.slice(prefix.length).toLowerCase());

  // 6. eyeColor
  let eyeColor: EyeColor = "UNKNOWN";
  const eyeColors = extractFromLabels("hard:eye_color_");
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
      eyeColor = eyeMap[eyeColors[0]];
      appliedCount += 1;
    }
  }

  // 7. collarStatus
  let collarStatus: PresenceStatus = "UNKNOWN";
  const collar = extractFromLabels("bonus:collar_");
  if (collar.length > 0) {
    if (collar[0] === "collar") {
      collarStatus = "YES";
      appliedCount += 1;
    } else if (collar[0] === "no_collar") {
      collarStatus = "NO";
      appliedCount += 1;
    }
  }

  // 8. earTagStatus
  let earTagStatus: PresenceStatus = "UNKNOWN";
  const earTag = extractFromLabels("bonus:ear_tag_");
  if (earTag.length > 0) {
    if (earTag[0] === "ear_tag") {
      earTagStatus = "YES";
      appliedCount += 1;
    } else if (earTag[0] === "no_ear_tag") {
      earTagStatus = "NO";
      appliedCount += 1;
    }
  }

  const speciesConfidence = analysis.speciesConfidence ?? analysis.species_confidence ?? null;
  const breedConfidence = analysis.breedConfidence ?? analysis.breed_confidence ?? null;
  const modelVersion = analysis.model_version ?? null;

  return {
    isPet,
    species,
    speciesConfidence,
    breed,
    breedConfidence,
    coatPattern,
    colors,
    eyeColor,
    collarStatus,
    earTagStatus,
    appliedCount,
    modelVersion,
  };
}
