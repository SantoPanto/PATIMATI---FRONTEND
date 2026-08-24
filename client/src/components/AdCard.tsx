import { useState } from "react";
import { Link } from "wouter";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  PawPrint,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { AdResponse, AdType } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import {
  getAdLocation,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";

const categoryStyles: Record<AdType, { label: string; classNames: string }> = {
  LOST: { label: "Kayıp", classNames: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30" },
  FOUND: { label: "Bulundu", classNames: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30" },
  ADOPTION: { label: "Sahiplendirme", classNames: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" },
};

interface AdCardProps {
  ad: AdResponse;
  isFavorite?: boolean;
  onRemoveFavorite?: (adId: number) => void;
  onToggleFavorite?: (adId: number) => void;
}

/**
 * Standardized AdCard Component (DRY & SRP)
 * Handles presigned photoUrls & relative paths safely, image load errors with fallback UI.
 */
export default function AdCard({
  ad,
  isFavorite = false,
  onRemoveFavorite,
  onToggleFavorite,
}: AdCardProps) {
  const rawPhoto = ad?.photoUrls?.find((url) => Boolean(url?.trim()));
  const photoUrl = rawPhoto ? getImageUrl(rawPhoto) : null;
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  const badgeConfig = categoryStyles[ad?.adType] || {
    label: "İlan",
    classNames: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const detailPath = `/pet/${ad?.id}`;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#FED7AA] hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/40">
      <div>
        {/* Image Container */}
        <div className="relative h-56 overflow-hidden bg-[#F1F5F9] dark:bg-slate-800">
          {photoUrl && !hasError ? (
            <img
              src={photoUrl}
              alt={ad.title || "İlan Görseli"}
              onError={handleImageError}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <PawPrint size={40} className="text-slate-300 dark:text-slate-600" />
              <span className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Görsel Yok</span>
            </div>
          )}

          {/* Top Badges & Favorite Action */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold shadow-xs ${badgeConfig.classNames}`}>
              {badgeConfig.label}
            </span>

            {onRemoveFavorite ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveFavorite(ad.id);
                }}
                aria-label="Favorilerden kaldır"
                title="Favorilerden kaldır"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-md backdrop-blur-xs transition hover:scale-105 hover:bg-rose-50 focus:outline-none"
              >
                <Heart size={18} fill="currentColor" />
              </button>
            ) : onToggleFavorite ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite(ad.id);
                }}
                aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-xs transition hover:scale-105 ${
                  isFavorite
                    ? "bg-white text-rose-500"
                    : "bg-white/80 text-slate-400 hover:text-rose-500"
                }`}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            ) : null}
          </div>

          {ad.aiStatus === "DONE" && ad.aiIsPet === true && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
              <Sparkles size={13} className="text-amber-400" />
              AI doğrulandı
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">
                {getSpeciesLabel(ad.species)} · {ad.breed || "Cins Belirtilmemiş"}
              </p>

              <h3 className="mt-1 truncate text-lg font-bold text-[#0F172A] dark:text-slate-50">
                {ad.title}
              </h3>
            </div>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316] dark:bg-orange-500/10 dark:text-orange-400">
              <PawPrint size={20} />
            </span>
          </div>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#64748B] dark:text-slate-400">
            {ad.description || "Açıklama belirtilmemiş."}
          </p>

          <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-4 text-xs font-medium text-[#64748B] dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#2563EB]" />
              <span className="truncate">{getAdLocation(ad)}</span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="shrink-0 text-[#F97316]" />
              <span>{getRelativeDate(ad.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-0 flex gap-2">
        {onRemoveFavorite && (
          <button
            type="button"
            onClick={() => onRemoveFavorite(ad.id)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/15"
            aria-label="Favorilerden kaldır"
            title="Favorilerden kaldır"
          >
            <Trash2 size={18} />
          </button>
        )}

        <Link
          href={detailPath}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 text-sm font-semibold text-white transition hover:bg-[#EA580C]"
        >
          İlanı incele
          <ChevronRight size={17} />
        </Link>
      </div>
    </article>
  );
}
