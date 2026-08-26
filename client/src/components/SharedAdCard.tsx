import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, AlertCircle, MapPin, PawPrint, Loader2 } from "lucide-react";
import type { AdResponse, AdSummaryDTO } from "../services/types";
import { getPublicAdById } from "../services/ads";
import { getImageUrl } from "../utils/imageUrl";
import { translateEnum } from "../utils/enumTranslator";

export interface SharedAdCardProps {
  sharedAdId: number;
  sharedAd?: AdResponse | AdSummaryDTO | null;
  isMine?: boolean;
}

export default function SharedAdCard({
  sharedAdId,
  sharedAd: initialAd,
  isMine = false,
}: SharedAdCardProps) {
  const [ad, setAd] = useState<Partial<AdResponse> | null>(
    (initialAd as Partial<AdResponse>) ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialAd && Boolean(sharedAdId));
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (initialAd && (initialAd as AdResponse).title) {
      setAd(initialAd as Partial<AdResponse>);
      setLoading(false);
      return;
    }

    if (!sharedAdId || !Number.isFinite(sharedAdId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    async function fetchAd() {
      try {
        const fetched = await getPublicAdById(sharedAdId);
        if (isMounted) {
          setAd(fetched);
        }
      } catch (err) {
        console.warn(`[SharedAdCard] Ad id=${sharedAdId} could not be fetched:`, err);
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchAd();

    return () => {
      isMounted = false;
    };
  }, [sharedAdId, initialAd]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-semibold ${
        isMine
          ? "bg-blue-700/80 border-blue-500 text-blue-100"
          : "bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
      }`}>
        <Loader2 size={16} className="animate-spin text-orange-500" />
        <span>İlan kartı yükleniyor...</span>
      </div>
    );
  }

  if (notFound || !ad) {
    return (
      <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
        isMine
          ? "bg-blue-700/90 border-blue-500 text-blue-100"
          : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400"
      }`}>
        <AlertCircle size={18} className="text-amber-400 shrink-0" />
        <div>
          <p className="font-bold">Paylaşılan İlan</p>
          <p className="text-[11px] opacity-80 mt-0.5">İlan artık aktif değil</p>
        </div>
      </div>
    );
  }

  const title = ad.title || `İlan #${sharedAdId}`;

  const photoUrlRaw =
    (ad.photoUrls && ad.photoUrls.length > 0 && ad.photoUrls[0]) ||
    (ad as AdSummaryDTO).photoUrl ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";
  const photoUrl = getImageUrl(photoUrlRaw);

  const adTypeStr = ad.adType
    ? translateEnum(ad.adType, "adType")
    : "İlan";
  const speciesStr = ad.species
    ? translateEnum(String(ad.species), "species")
    : "";
  const breedStr = ad.breed ? ad.breed : "";

  const categoryLine = [adTypeStr, speciesStr, breedStr]
    .filter(Boolean)
    .join(" • ");

  const locationParts = [ad.district, ad.city].filter(Boolean);
  const locationStr =
    locationParts.length > 0 ? locationParts.join(" / ") : "Konum Belirtilmedi";

  const targetPath = ad.adType === "ADOPTION" ? `/adoption/${sharedAdId}` : `/pet/${sharedAdId}`;

  return (
    <div
      data-testid="shared-ad-card"
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm max-w-xs sm:max-w-sm ${
        isMine
          ? "bg-slate-900 border-blue-400/40 text-white"
          : "bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
      }`}
    >
      {/* Ad Image Header */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={photoUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Type Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-slate-950/75 text-white backdrop-blur-sm border border-white/20">
            <PawPrint size={12} className="text-orange-400" />
            {categoryLine}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 flex flex-col gap-2">
        <h4 className="font-extrabold text-sm line-clamp-1 leading-snug">
          {title}
        </h4>

        <div className={`flex items-center gap-1.5 text-xs font-medium ${
          isMine ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
        }`}>
          <MapPin size={13} className="text-orange-500 shrink-0" />
          <span className="truncate">{locationStr}</span>
        </div>

        {/* Action Link */}
        <div className="mt-1 border-t border-slate-100/20 dark:border-slate-800 pt-2.5 flex justify-end">
          <Link
            href={targetPath}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-xs"
          >
            <span>İlanı Gör</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
