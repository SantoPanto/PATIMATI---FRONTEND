import type { AnimalType } from "../services/types";

/**
 * `AnimalType` -> Türkçe etiket eşlemesi.
 *
 * Paylaşılan tek kaynak: hem `AnimalTypeSelector` (veteriner panelinde
 * seçim) hem de `VetDetailPage`'deki salt-okunur rozet listesi AYNI
 * eşlemeyi kullanır (plan §12) -- tekrar yazılmasın.
 */
export const ANIMAL_TYPE_LABELS: Record<AnimalType, string> = {
  DOG: "Köpek",
  CAT: "Kedi",
  BIRD: "Kuş",
  RABBIT: "Tavşan",
  RODENT: "Kemirgen",
  REPTILE: "Sürüngen",
  FISH: "Balık",
  FARM_ANIMAL: "Çiftlik Hayvanı",
  EXOTIC: "Egzotik",
  OTHER: "Diğer",
};

/** Sabit sıralı tüm `AnimalType` değerleri -- seçici ve rozet listeleri aynı sırayla çizilsin. */
export const ALL_ANIMAL_TYPES: AnimalType[] = [
  "DOG",
  "CAT",
  "BIRD",
  "RABBIT",
  "RODENT",
  "REPTILE",
  "FISH",
  "FARM_ANIMAL",
  "EXOTIC",
  "OTHER",
];

export function getAnimalTypeLabel(type: AnimalType): string {
  return ANIMAL_TYPE_LABELS[type] ?? type;
}
