import { useState } from "react";
import { ChevronRight, MapPin, PawPrint, Sparkles } from "lucide-react";
import type { MatchedAdResponseDTO } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";

import { translateEnum } from "../utils/enumTranslator";

/**
 * Format score from 0.0 - 1.0 float (or 0-100) to rounded integer percentage.
 * Example: 0.942 -> 94
 */
export function formatMatchScore(score: number | undefined | null): number {
  if (score === undefined || score === null || isNaN(score)) return 0;
  const percentage = score <= 1 ? score * 100 : score;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/** Standart varsayılan (placeholder) görsel */
const DEFAULT_PLACEHOLDER = "/favicon.svg";

interface MatchedAdCardProps {
  match: MatchedAdResponseDTO;
  variant?: "modal" | "grid";
  onInspect?: (adId: number) => void;
}

export default function MatchedAdCard({
  match,
  variant = "grid",
  onInspect,
}: MatchedAdCardProps) {
  const { ad, score } = match;
  const scorePct = formatMatchScore(score);

  // photoUrls[0] değerini güvenli şekilde al, boş veya geçersizse placeholder kullan
  const rawPhoto = ad?.photoUrls?.find((url) => Boolean(url?.trim()));
  const initialPhotoUrl = rawPhoto ? getImageUrl(rawPhoto) : DEFAULT_PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState<string>(initialPhotoUrl);

  // Yükleme hatası durumunda varsayılan görsele geç
  const handleImageError = () => {
    if (imgSrc !== DEFAULT_PLACEHOLDER) {
      setImgSrc(DEFAULT_PLACEHOLDER);
    }
  };

  const adTitle = ad?.title || "İlan";
  const speciesLabel = translateEnum(ad?.species, "species", "Evcil Hayvan");
  const breedLabel = ad?.breed || "Bilinmiyor";
  const locationLabel =
    ad?.district && ad?.city
      ? `${ad.district}, ${ad.city}`
      : ad?.city || "Konum Belirtilmedi";

  // "Olası Eşleşmeler Bulundu!" Modal İçi Yatay Kart Görünümü
  if (variant === "modal") {
    return (
      <div className="flex gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition bg-[#F8FAFC] items-center dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600">
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#E2E8F0] relative dark:bg-slate-700">
          <img
            src={imgSrc}
            alt={adTitle}
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h3 className="font-bold text-[#0F172A] text-lg mb-1 dark:text-slate-50">{adTitle}</h3>
          {ad?.description && (
            <p className="text-sm text-[#64748B] line-clamp-2 dark:text-slate-400">{ad.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFCCB] px-2.5 py-0.5 text-xs font-semibold text-[#4D7C0F] dark:bg-lime-500/15 dark:text-lime-400">
              <Sparkles size={12} />%{scorePct} Benzerlik
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center pl-4 border-l border-[#E2E8F0] dark:border-slate-700">
          <a
            href={`/pet/${ad?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => ad?.id && onInspect?.(ad.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-2 font-semibold text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            İncele
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  // Standart Grid Kart Görünümü (Sonuçlar Sayfası)
  return (
    <article className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="relative h-64 overflow-hidden bg-[#F1F5F9] dark:bg-slate-800">
          <img
            src={imgSrc}
            alt={adTitle}
            onError={handleImageError}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />

          <div className="absolute left-4 top-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white ${
                scorePct >= 90
                  ? "bg-[#16A34A]"
                  : scorePct >= 75
                  ? "bg-[#F97316]"
                  : "bg-[#2563EB]"
              }`}
            >
              <Sparkles size={14} />%{scorePct} Benzerlik
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-slate-50">{adTitle}</h3>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                {speciesLabel} · {breedLabel}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316] dark:bg-orange-500/10">
              <PawPrint size={22} />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B] dark:bg-slate-800/60 dark:text-slate-400">
            <MapPin size={17} className="text-[#F97316]" />
            <span className="flex-1">{locationLabel}</span>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-[#64748B] dark:text-slate-400">Görsel Benzerlik</span>
              <span className="text-[#0F172A] dark:text-slate-100">%{scorePct}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-[#F97316]"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <a
          href={`/pet/${ad?.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 font-bold text-white transition hover:bg-[#EA580C]"
        >
          İlanı incele
          <ChevronRight size={18} />
        </a>
      </div>
    </article>
  );
}
