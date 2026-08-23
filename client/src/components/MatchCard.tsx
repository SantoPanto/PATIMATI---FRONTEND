import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  PawPrint,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { MatchResponseDTO } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import { translateEnum } from "../utils/enumTranslator";

interface MatchCardProps {
  match: MatchResponseDTO;
}

/**
 * Normalizes score to 0 - 100 range regardless of whether input is 0.0-1.0 or 0-100.
 */
function formatScore(val: number | undefined | null): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const percentage = val <= 1 ? val * 100 : val;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Returns color tokens according to score ratio.
 */
function getScoreColorClass(scorePct: number) {
  if (scorePct >= 75) {
    return {
      bar: "bg-emerald-500",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (scorePct >= 50) {
    return {
      bar: "bg-amber-500",
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    bar: "bg-rose-500",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const totalScorePct = formatScore(match.totalScore);
  const visualScorePct = formatScore(match.visualScore);
  const tagScorePct = formatScore(match.tagScore);
  const locationScorePct = formatScore(match.locationScore);
  const thresholdPct = formatScore(match.thresholdAtTime);

  const isPassed = match.passedThreshold;
  const hasBlock = Boolean(match.blockReason && match.blockReason.trim().length > 0);

  // Backend sozlesmesi: dto/match/AdMatchResponseDTO.
  // partnerAd bir AdSummaryDTO'dur (id, title, photoUrl, species, breed) - AdResponse DEGIL.
  // Onceki surum burada backend'in hic gondermedigi 10 alani okuyordu
  // (targetAd, matchedAd, ad, sourceAd, targetAdId, foundAdId, lostAdId,
  // title, petName, breed, location, photoUrl, photoUrls); hepsi undefined
  // kaldigi icin baslik "Eslesme #..."e, fotograf stok gorsele dusuyordu.
  const partnerAd = match.partnerAd;
  const adId = match.partnerAdId ?? partnerAd?.id;

  const title =
    partnerAd?.title || match.partnerAdTitle || `Eşleşme #${match.id ?? "İlan"}`;
  const breed =
    partnerAd?.breed ||
    (partnerAd?.species ? translateEnum(String(partnerAd.species), "species") : "Belirtilmedi");
  // Backend eslesme kaydinda METINSEL konum yok; gercekten var olan tek
  // konum verisi konum skorudur.
  const locationText = `Konum uyumu %${locationScorePct}`;

  const photoUrl = getImageUrl(
    partnerAd?.photoUrl ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600"
  );

  const mainScoreStyle = getScoreColorClass(totalScorePct);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md ${
        isPassed && !hasBlock
          ? "border-emerald-200 bg-white ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-slate-900"
          : hasBlock
          ? "border-rose-200 bg-rose-50/20 dark:border-rose-500/20 dark:bg-rose-500/5"
          : "border-slate-200 bg-slate-50/60 opacity-90 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900/60"
      }`}
    >
      {/* Top Banner Status */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-xs font-semibold dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          {hasBlock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
              <XCircle size={14} />
              Eşleşme Engellendi
            </span>
          ) : isPassed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 font-bold dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 size={14} />
              Yüksek Eşleşme İhtimali
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle size={14} />
              Düşük İhtimal
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Sparkles size={13} className="text-orange-500" />
          <span>Eşik: %{thresholdPct}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <img
                src={photoUrl}
                alt={title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 line-clamp-1 dark:text-slate-50">
                {title}
              </h3>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <PawPrint size={13} className="text-orange-500" />
                  {breed}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  {locationText}
                </span>
              </p>
            </div>
          </div>

          {/* Overall Match Badge */}
          <div className="flex shrink-0 items-center gap-3">
            <div className={`flex flex-col items-end rounded-2xl border px-3.5 py-2 ${mainScoreStyle.bg}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Eşleşme Oranı
              </span>
              <span className={`text-xl font-extrabold ${mainScoreStyle.text}`}>
                %{totalScorePct}
              </span>
            </div>
          </div>
        </div>

        {/* Red Warning Alert if blockReason exists */}
        {hasBlock && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400" role="alert">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <strong className="font-bold">Eşleşme Kısıtlandı: </strong>
              <span>{match.blockReason}</span>
            </div>
          </div>
        )}

        {/* Expandable Breakdown Trigger */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition hover:text-orange-600 focus:outline-none dark:text-slate-400 dark:hover:text-orange-400"
          >
            <span>{showDetails ? "Detayları Gizle" : "Skor Kırılımını Gör"}</span>
            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {adId && (
            <Link
              href={`/pet/${adId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              İlanı İncele
              <ExternalLink size={13} />
            </Link>
          )}
        </div>

        {/* Breakdown Section */}
        {showDetails && (
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <h4 className="font-bold text-slate-700 mb-2 dark:text-slate-300">Eşleşme Kırılım Analizi</h4>

            {/* Visual Similarity */}
            <ProgressBarItem
              label="Görsel Benzerlik (AI)"
              scorePct={visualScorePct}
              description="Yapay zeka fotoğraf karşılaştırması"
            />

            {/* Tag Match */}
            <ProgressBarItem
              label="Etiket & Özellik Uyuşması"
              scorePct={tagScorePct}
              description="Renk, yaş, tasma ve ırk uyuşumu"
            />

            {/* Location Proximity */}
            <ProgressBarItem
              label="Konum Yakınlığı"
              scorePct={locationScorePct}
              description="Kaybolma/Bulunma konum mesafesi"
            />

            {/* Threshold reference */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span>Sistem Eşik Değeri: %{thresholdPct}</span>
              <span className={`font-bold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {isPassed ? "Eşik Değeri Geçildi" : "Eşik Değerinin Altında"}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

interface ProgressBarItemProps {
  label: string;
  scorePct: number;
  description: string;
}

function ProgressBarItem({ label, scorePct, description }: ProgressBarItemProps) {
  const color = getScoreColorClass(scorePct);

  return (
    <div>
      <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span className={`font-bold ${color.text}`}>%{scorePct}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
          style={{ width: `${scorePct}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{description}</p>
    </div>
  );
}
