import { Star } from "lucide-react";
import { useState } from "react";

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * 1-5 yıldız puanlama -- hem salt-okunur rozet (ortalama puan gösterimi)
 * hem de interaktif giriş (yorum formu) olarak kullanılır (plan §12).
 */
export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = !readOnly && Boolean(onChange);
  const displayValue = hoverValue ?? value;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHoverValue(null)}
    >
      {STAR_VALUES.map((starValue) => {
        const filled = starValue <= Math.round(displayValue);

        return (
          <button
            key={starValue}
            type="button"
            data-testid={`star-rating-star-${starValue}`}
            data-filled={filled ? "true" : "false"}
            disabled={!isInteractive}
            onMouseEnter={() => isInteractive && setHoverValue(starValue)}
            onClick={() => isInteractive && onChange?.(starValue)}
            className={
              isInteractive
                ? "cursor-pointer p-0 leading-none"
                : "cursor-default p-0 leading-none"
            }
            aria-label={`${starValue} yıldız`}
          >
            <Star
              size={size}
              className={
                filled
                  ? "fill-[#F59E0B] text-[#F59E0B]"
                  : "fill-transparent text-gray-300 dark:text-slate-600"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
