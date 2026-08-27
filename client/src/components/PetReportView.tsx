import {
  AlertTriangle,
  Cake,
  Dumbbell,
  Eye,
  Fingerprint,
  Heart,
  Lightbulb,
  Palette,
  PawPrint,
  Ruler,
  ShieldAlert,
  Stethoscope,
  Tag,
  Utensils,
  VenetianMask,
  Wind,
} from "lucide-react";
import type { AiAnalysis, PetReportResult } from "../services/types";
import { parseAiAnalysis } from "../utils/aiAnalysisUtils";

const COLOR_MAP: Record<string, string> = {
  BLACK: "Siyah",
  WHITE: "Beyaz",
  GRAY: "Gri",
  BROWN: "Kahverengi",
  ORANGE: "Turuncu",
  CREAM: "Krem",
  GOLDEN: "Altın",
  BEIGE: "Bej",
  OTHER: "Diğer",
};

const PATTERN_MAP: Record<string, string> = {
  UNKNOWN: "Belirsiz / Düz",
  SOLID: "Tek Renk / Düz",
  STRIPED: "Tekir / Çizgili",
  SPOTTED: "Benekli",
  PATCHED: "Parçalı Renkli",
  CALICO: "Kaliko (Üç Renkli)",
  TORTOISESHELL: "Kaplombağa Kabuğu",
  OTHER: "Diğer",
};

const EYE_COLOR_MAP: Record<string, string> = {
  UNKNOWN: "Belirsiz",
  BROWN: "Kahverengi",
  BLUE: "Mavi",
  GREEN: "Yeşil",
  AMBER: "Kehribar",
  HAZEL: "Ela",
  HETEROCHROMIA: "Farklı Renkli (Heterokromi)",
};

type GuvenSeviyesi = {
  etiket: string;
  className: string;
};

function guvenSeviyesi(guven: number): GuvenSeviyesi {
  const skore = guven <= 1.0 ? guven * 100 : guven;
  if (skore >= 80) {
    return {
      etiket: "Yüksek güven",
      className:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    };
  }
  if (skore >= 50) {
    return {
      etiket: "Orta güven",
      className:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    };
  }
  return {
    etiket: "Düşük güven",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };
}

function GuvenRozeti({ guven }: { guven: number }) {
  const { etiket, className } = guvenSeviyesi(guven);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}
    >
      {etiket}
    </span>
  );
}

function SonucKarti({
  icon,
  baslik,
  guven,
  children,
}: {
  icon: React.ReactNode;
  baslik: string;
  guven?: number | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-500/15 dark:text-violet-300">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
            {baslik}
          </h3>
        </div>
        {typeof guven === "number" && <GuvenRozeti guven={guven} />}
      </div>
      <div className="text-sm leading-6 text-[#334155] dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

export default function PetReportView({
  result,
}: {
  result: PetReportResult | AiAnalysis | Record<string, unknown>;
}) {
  // If legacy report with explicit gecerli = false
  if ("gecerli" in result && result.gecerli === false) {
    return null;
  }

  // Modern AiAnalysis payload
  if ("species" in result || "is_pet" in result || "isPet" in result) {
    const normalized = parseAiAnalysis(result as AiAnalysis);
    if (!normalized.isPet || !normalized.species) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="mb-2 flex items-center gap-2.5">
            <PawPrint size={18} className="text-[#7C3AED] dark:text-violet-300" />
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Analiz Özeti
            </h3>
          </div>
          <p className="text-sm font-semibold leading-6 text-[#334155] dark:text-slate-300">
            {normalized.species === "CAT" ? "Kedi" : "Köpek"}
            {normalized.breed ? ` — ${normalized.breed}` : " — Melez / Irk Belirlenemedi"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SonucKarti
            icon={<PawPrint size={18} />}
            baslik="Tür"
            guven={normalized.speciesConfidence}
          >
            {normalized.species === "CAT" ? "Kedi" : "Köpek"}
          </SonucKarti>

          <SonucKarti
            icon={<Tag size={18} />}
            baslik="Irk"
            guven={normalized.breedConfidence}
          >
            {normalized.breed ?? "Belirlenemedi / Melez"}
          </SonucKarti>

          <SonucKarti icon={<Palette size={18} />} baslik="Renk ve Desen">
            <div>
              <span className="font-semibold">Renkler: </span>
              {normalized.colors.length > 0
                ? normalized.colors.map((c) => COLOR_MAP[c] || c).join(", ")
                : "Belirlenemedi"}
            </div>
            <div>
              <span className="font-semibold">Desen: </span>
              {PATTERN_MAP[normalized.coatPattern] || normalized.coatPattern}
            </div>
          </SonucKarti>

          {normalized.eyeColor !== "UNKNOWN" && (
            <SonucKarti icon={<Eye size={18} />} baslik="Göz Rengi">
              {EYE_COLOR_MAP[normalized.eyeColor] || normalized.eyeColor}
            </SonucKarti>
          )}

          {normalized.collarStatus !== "UNKNOWN" && (
            <SonucKarti icon={<VenetianMask size={18} />} baslik="Tasma Durumu">
              {normalized.collarStatus === "YES" ? "Tasma Var" : "Tasma Görünmüyor"}
            </SonucKarti>
          )}

          {normalized.earTagStatus !== "UNKNOWN" && (
            <SonucKarti icon={<Fingerprint size={18} />} baslik="Kulak Küpesi">
              {normalized.earTagStatus === "YES" ? "Kulak Küpesi Var" : "Kulak Küpesi Yok"}
            </SonucKarti>
          )}
        </div>
      </div>
    );
  }

  // Zengin pet raporu (AI /analyze_pet -- PetReportResult)
  const legacy = result as PetReportResult;
  return (
    <div className="space-y-4">
      {legacy.tur && (
        <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="mb-2 flex items-center gap-2.5">
            <PawPrint size={18} className="text-[#7C3AED] dark:text-violet-300" />
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Analiz Özeti
            </h3>
          </div>
          <p className="text-sm font-semibold leading-6 text-[#334155] dark:text-slate-300">
            {legacy.tur}
            {legacy.irk && legacy.irk !== "BELIRLENEMEDI"
              ? ` — ${legacy.irk}`
              : " — Melez / Irk Belirlenemedi"}
          </p>
        </div>
      )}

      {legacy.goruntu_kalite_notu && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{legacy.goruntu_kalite_notu}</span>
        </div>
      )}

      {legacy.karakter_profili && (
        <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="mb-2 flex items-center gap-2.5">
            <Heart size={18} className="text-[#7C3AED] dark:text-violet-300" />
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Karakter Profili
            </h3>
          </div>
          <p className="text-sm leading-6 text-[#334155] dark:text-slate-300">
            {legacy.karakter_profili}
          </p>
          {legacy.irka_ozel_icerik === false && (
            <p className="mt-2 text-xs italic text-[#64748B] dark:text-slate-500">
              Irk belirlenemediği için genel tür özellikleri esas alındı.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {legacy.renk_tarifi && (
          <SonucKarti
            icon={<Palette size={18} />}
            baslik="Renk ve Desen"
            guven={legacy.renk_tarifi.guven}
          >
            {legacy.renk_tarifi.deger}
          </SonucKarti>
        )}

        {legacy.goz_rengi && (
          <SonucKarti
            icon={<Eye size={18} />}
            baslik="Göz Rengi"
            guven={legacy.goz_rengi.guven}
          >
            {legacy.goz_rengi.deger}
          </SonucKarti>
        )}

        {legacy.tahmini_yas && (
          <SonucKarti
            icon={<Cake size={18} />}
            baslik="Tahmini Yaş"
            guven={legacy.tahmini_yas.guven}
          >
            {legacy.tahmini_yas.aralik}
            <span className="ml-2 inline-block rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs font-semibold text-[#475569] dark:bg-slate-800 dark:text-slate-400">
              {legacy.tahmini_yas.yasam_evresi}
            </span>
          </SonucKarti>
        )}

        {legacy.cinsiyet && (
          <SonucKarti
            icon={<VenetianMask size={18} />}
            baslik="Cinsiyet"
            guven={legacy.cinsiyet.guven}
          >
            {legacy.cinsiyet.tahmin}
          </SonucKarti>
        )}

        {legacy.tahmini_boyut && (
          <SonucKarti
            icon={<Ruler size={18} />}
            baslik="Tahmini Boyut"
            guven={legacy.tahmini_boyut.guven}
          >
            {legacy.tahmini_boyut.deger}
          </SonucKarti>
        )}
      </div>

      {legacy.ayirt_edici_isaretler && legacy.ayirt_edici_isaretler.length > 0 && (
        <SonucKarti
          icon={<Fingerprint size={18} />}
          baslik="Ayırt Edici İşaretler"
        >
          <ul className="list-disc space-y-1 pl-4">
            {legacy.ayirt_edici_isaretler.map((isaret) => (
              <li key={isaret}>{isaret}</li>
            ))}
          </ul>
        </SonucKarti>
      )}

      {legacy.genel_durum_gozlemi && (
        <SonucKarti
          icon={<Stethoscope size={18} />}
          baslik="Genel Durum Gözlemi"
        >
          {legacy.genel_durum_gozlemi}
        </SonucKarti>
      )}

      {legacy.sasirtici_bilgiler && legacy.sasirtici_bilgiler.length > 0 && (
        <SonucKarti
          icon={<Lightbulb size={18} />}
          baslik="Şaşırtıcı Bilgiler"
        >
          <ul className="list-disc space-y-1.5 pl-4">
            {legacy.sasirtici_bilgiler.map((bilgi) => (
              <li key={bilgi}>{bilgi}</li>
            ))}
          </ul>
        </SonucKarti>
      )}

      {legacy.dikkat_edilmesi_gerekenler && legacy.dikkat_edilmesi_gerekenler.length > 0 && (
        <SonucKarti
          icon={<ShieldAlert size={18} />}
          baslik="Dikkat Edilmesi Gerekenler"
        >
          <ul className="list-disc space-y-1.5 pl-4">
            {legacy.dikkat_edilmesi_gerekenler.map((madde) => (
              <li key={madde}>{madde}</li>
            ))}
          </ul>
        </SonucKarti>
      )}

      {legacy.bakim_ipuclari && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-500/15 dark:text-violet-300">
              <PawPrint size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Bakım İpuçları
            </h3>
          </div>
          <div className="space-y-3 text-sm leading-6 text-[#334155] dark:text-slate-300">
            {legacy.bakim_ipuclari.beslenme && (
              <div className="flex items-start gap-2.5">
                <Utensils size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{legacy.bakim_ipuclari.beslenme}</span>
              </div>
            )}
            {legacy.bakim_ipuclari.tuy_bakimi && (
              <div className="flex items-start gap-2.5">
                <Wind size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{legacy.bakim_ipuclari.tuy_bakimi}</span>
              </div>
            )}
            {legacy.bakim_ipuclari.aktivite && (
              <div className="flex items-start gap-2.5">
                <Dumbbell size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{legacy.bakim_ipuclari.aktivite}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {legacy.ek_hayvanlar && (
        <div className="rounded-2xl bg-[#F1F5F9] p-4 text-sm text-[#475569] dark:bg-slate-800/60 dark:text-slate-400">
          <strong className="font-bold">Diğer hayvanlar: </strong>
          {legacy.ek_hayvanlar}
        </div>
      )}
    </div>
  );
}
