import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronDown,
  ChevronRight,
  Home,
  MapPin,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { AdResponse, AdType } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import {
  getAdLocation,
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
    case "HELP":
      return "Yardım";
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
    case "HELP":
      return "help";
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

/* Konum etiketi utils/adPresentation.getAdLocation'dan gelir (il/ilçe
   öncelikli, BE V19). Buradaki yerel kopya yalnız ham koordinat
   basabiliyordu ve iki kaynak zamanla ayrışırdı. */

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
 *
 * <p>27.08 isteği: karta tıklamak artık detay sayfasına GİTMEZ — kart aşağı
 * doğru açılır ve özet (açıklama, kaybolma tarihi, ayırt edici işaretler)
 * kartın altında görünür. Detay sayfasına yalnızca "İlanı incele" düğmesi
 * götürür (mesajlaşma/AI eşleştirme gibi ağır işler orada).
 */
export default function PetListingCard({ ad, onRemoveFavorite }: PetListingCardProps) {
  const [acik, setAcik] = useState(false);
  const image = getPrimaryImage(ad);
  const statusClass = getListingStatusClass(ad.adType);
  const detayId = `ilan-detay-${ad.id}`;

  const subtitle = [
    getSpeciesLabel(ad.species),
    getBreedLabel(ad.breed),
  ].join(" · ");

  return (
    <article className="pet-listing-card relative">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
        aria-controls={detayId}
        className="pet-listing-card__image w-full cursor-pointer border-0 bg-transparent p-0 text-left"
        aria-label={`${ad.title} ilan özetini aç/kapat`}
      >
        {image ? (
          <img src={image} alt={ad.title} loading="lazy" />
        ) : (
          <div
            className="flex h-full min-h-[220px] w-full items-center justify-center bg-[#FFF7ED] text-[#F97316] dark:bg-orange-500/10"
            aria-label="Fotoğraf bulunmuyor"
          >
            <Search size={42} />
          </div>
        )}

        <div className="absolute left-[14px] top-[14px] z-[2] flex flex-wrap gap-1.5">
          <span
            className={`listing-status listing-status--${statusClass}`}
            style={{ position: "static" }}
          >
            {getListingStatus(ad.adType)}
          </span>

          {ad.adType === "ADOPTION" && ad.ownerRole === "BARINAK" && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-xs"
              style={{ backgroundColor: "rgba(13, 148, 136, 0.92)", color: "#fff" }}
            >
              <Home size={12} />
              Barınak
            </span>
          )}
        </div>

        {ad.aiStatus === "DONE" && ad.aiIsPet === true && (
          <span className="listing-featured">
            <Sparkles size={14} />
            AI doğrulandı
          </span>
        )}
      </button>

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
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          aria-controls={detayId}
          className="pet-listing-card__title-row w-full cursor-pointer border-0 bg-transparent p-0 text-left"
        >
          <div className="min-w-0">
            <h3 className="truncate">{ad.title}</h3>
            <p>{subtitle}</p>
          </div>

          <span className="flex shrink-0 items-center gap-1.5">
            {formatDate(ad.createdAt)}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform ${acik ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        <div className="pet-listing-card__location">
          <MapPin size={17} />
          <span className="truncate">{getAdLocation(ad)}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#64748B] dark:text-slate-400">
          <span>{getGenderLabel(ad.gender)}</span>
          <span>{getAgeLabel(ad.ageGroup)}</span>
        </div>

        {acik && (
          <div
            id={detayId}
            className="mt-3 space-y-2 rounded-xl bg-[#F8FAFC] p-3 text-sm leading-6 text-[#334155] dark:bg-slate-800/60 dark:text-slate-300"
          >
            <p className="whitespace-pre-line">
              {ad.description?.trim()
                ? ad.description
                : "Bu ilana açıklama eklenmemiş."}
            </p>

            {ad.lostDate && (
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                <span className="font-semibold">Kaybolma tarihi: </span>
                {formatDate(ad.lostDate)}
              </p>
            )}

            {ad.distinctiveMarks && (
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                <span className="font-semibold">Ayırt edici işaretler: </span>
                {ad.distinctiveMarks}
              </p>
            )}
          </div>
        )}

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
