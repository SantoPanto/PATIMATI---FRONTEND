import type { AnimalType } from "../services/types";
import { ALL_ANIMAL_TYPES, getAnimalTypeLabel } from "../utils/animalTypeLabels";

/**
 * Hayvan türü toggle-çip grid'i -- veterinerin baktığı hayvan türlerini
 * seçtiği bileşen (plan §12). Etiketler paylaşılan `utils/animalTypeLabels`
 * kaynağından gelir; `VetDetailPage`'deki salt-okunur rozet listesi de AYNI
 * kaynağı kullanır.
 */
export default function AnimalTypeSelector({
  value,
  onChange,
}: {
  value: AnimalType[];
  onChange: (value: AnimalType[]) => void;
}) {
  const toggle = (type: AnimalType) => {
    if (value.includes(type)) {
      onChange(value.filter((item) => item !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ANIMAL_TYPES.map((type) => {
        const selected = value.includes(type);

        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            aria-pressed={selected}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              selected
                ? "border-[#2563EB] bg-[#2563EB] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/40 hover:text-[#2563EB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {getAnimalTypeLabel(type)}
          </button>
        );
      })}
    </div>
  );
}
