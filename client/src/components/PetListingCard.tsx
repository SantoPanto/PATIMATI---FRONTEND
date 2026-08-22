import { Link } from "wouter";
import { ChevronRight, MapPin, Search, Sparkles, Trash2 } from "lucide-react";
import type { AdResponse, AdType } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import {
  getAgeLabel,
  getBreedLabel,
  getGenderLabel,
  getSpeciesLabel,
} from "../utils/adPresentation";

function getListingStatus(adType: AdType): string {
  switch (adType) {
    case "LOST":
      return "Kayıp";
    case "FOUND":
      return "Bulunan";
    case "ADOPTION":
      return "Sahiplendirme";
    default:
      return "İlan";
  }
}

function getListingStatusClass(adType: AdType): string {
  switch (adType) {
    case "LOST":
      return "lost";
    case "FOUND":
      return "found";
    case "ADOPTION":
      return "adoption";
    default:
      return "lost";
  }
}

/* Tür / cinsiyet / yaş / cins etiketleri utils/adPresentation'dan gelir.
   Buradaki yerel kopyalar UNKNOWN değerlerde ham enum sızdırıyordu
   (kartta "Bilinmiyor UNKNOWN" ve "Kedi MIXED_OR_UNKNOWN" görünüyordu —
   ölçüldü, 22.08 canlı 390px turu). */

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getLocationLabel(ad: AdResponse): string {
  if (
    typeof ad.latitude === "number" &&
    typeof ad.longitude === "number"
  ) {
    return `${ad.latitude.toFixed(4)}, ${ad.longitude.toFixed(4)}`;
  }

  return "Konum belirtilmemiş";
}

export function getPrimaryImage(ad: AdResponse): string | null {
  if (!Array.isArray(ad.photoUrls) || ad.photoUrls.length === 0) {
    return null;
  }

  const firstValidUrl = ad.photoUrls.find(
    (url) => typeof url === "string" && url.trim().length > 0,
  );

  return firstValidUrl ? getImageUrl(firstValidUrl) : null;
}

interface PetListingCardProps {
  ad: AdResponse;
  onRemoveFavorite?: (adId: number) => void;
}

/**
 * PetListingCard - Standart İlan Kartı Bileşeni
 * listings (İlanlar) ve favorites (Favoriler) sayfalarında ortak kullanılan standart kart yapısı.
 */
export default function PetListingCard({ ad, onRemoveFavorite }: PetListingCardProps) {
  const image = getPrimaryImage(ad);
  const statusClass = getListingStatusClass(ad.adType);

  const subtitle = [
    getSpeciesLabel(ad.species),
    getBreedLabel(ad.breed),
  ].join(" · ");

  return (
    <article className="pet-listing-card relative">
      <Link
        href={`/pet/${ad.id}`}
        className="pet-listing-card__image"
        aria-label={`${ad.title} ilanını görüntüle`}
      >
        {image ? (
          <img src={image} alt={ad.title} loading="lazy" />
        ) : (
          <div
            className="flex h-full min-h-[220px] w-full items-center justify-center bg-[#FFF7ED] text-[#F97316]"
            aria-label="Fotoğraf bulunmuyor"
          >
            <Search size={42} />
          </div>
        )}

        <span className={`listing-status listing-status--${statusClass}`}>
          {getListingStatus(ad.adType)}
        </span>

        {ad.aiStatus === "DONE" && ad.aiIsPet === true && (
          <span className="listing-featured">
            <Sparkles size={14} />
            AI doğrulandı
          </span>
        )}
      </Link>

      {onRemoveFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveFavorite(ad.id);
          }}
          aria-label="Favorilerden kaldır"
          title="Favorilerden kaldır"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-md backdrop-blur-xs transition hover:scale-105 hover:bg-rose-50"
        >
          <Trash2 size={18} />
        </button>
      )}

      <div className="pet-listing-card__body">
        <div className="pet-listing-card__title-row">
          <div className="min-w-0">
            <h3 className="truncate">{ad.title}</h3>
            <p>{subtitle}</p>
          </div>

          <span>{formatDate(ad.createdAt)}</span>
        </div>

        <div className="pet-listing-card__location">
          <MapPin size={17} />
          <span className="truncate">{getLocationLabel(ad)}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#64748B]">
          <span>{getGenderLabel(ad.gender)}</span>
          <span>{getAgeLabel(ad.ageGroup)}</span>
        </div>

        <div className="mt-4 flex gap-2">
          {onRemoveFavorite && (
            <button
              type="button"
              onClick={() => onRemoveFavorite(ad.id)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
              aria-label="Favorilerden kaldır"
              title="Favorilerden kaldır"
            >
              <Trash2 size={17} />
            </button>
          )}

          <Link
            href={`/pet/${ad.id}`}
            className="pet-listing-card__button flex-1"
          >
            İlanı incele
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
