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
  Utensils,
  VenetianMask,
  Wind,
} from "lucide-react";
import type { PetReportResult } from "../services/types";

/*
 * BenNeyimPage.tsx'ten ÇIKARILDI (26.08): "Evcil Hayvanlarım" ve veteriner
 * paneli de aynı AI raporunu (kaydedilmiş hâliyle) göstermek istiyor —
 * ~180 satırlık bu render mantığını ikinci kez yazmak yerine tek yerden
 * paylaşılıyor. Görsel çıktı BenNeyimPage'dekiyle birebir aynı kalacak
 * şekilde taşındı; "Başka fotoğrafla dene" butonu SAYFAYA özel olduğu için
 * burada değil, çağıran tarafta kalır.
 */

type GuvenSeviyesi = {
  etiket: string;
  className: string;
};

// prompt'un kendi GÜVEN SKORU KURALLARI eşikleriyle (80+ / 50-79 / altı)
// birebir aynı -- ham sayı yerine anlaşılır bir etiket gösteriliyor
// (kullanıcı kararı).
function guvenSeviyesi(guven: number): GuvenSeviyesi {
  if (guven >= 80) {
    return {
      etiket: "Yüksek güven",
      className:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    };
  }
  if (guven >= 50) {
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
  guven?: number;
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

export default function PetReportView({ result }: { result: PetReportResult }) {
  if (!result.gecerli) {
    return null;
  }

  return (
    <div className="space-y-4">
      {result.goruntu_kalite_notu && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{result.goruntu_kalite_notu}</span>
        </div>
      )}

      {result.karakter_profili && (
        <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="mb-2 flex items-center gap-2.5">
            <Heart size={18} className="text-[#7C3AED] dark:text-violet-300" />
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Karakter Profili
            </h3>
          </div>
          <p className="text-sm leading-6 text-[#334155] dark:text-slate-300">
            {result.karakter_profili}
          </p>
          {result.irka_ozel_icerik === false && (
            <p className="mt-2 text-xs italic text-[#64748B] dark:text-slate-500">
              Irk belirlenemediği için genel tür özellikleri esas
              alındı.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {result.renk_tarifi && (
          <SonucKarti
            icon={<Palette size={18} />}
            baslik="Renk ve Desen"
            guven={result.renk_tarifi.guven}
          >
            {result.renk_tarifi.deger}
          </SonucKarti>
        )}

        {result.goz_rengi && (
          <SonucKarti
            icon={<Eye size={18} />}
            baslik="Göz Rengi"
            guven={result.goz_rengi.guven}
          >
            {result.goz_rengi.deger}
          </SonucKarti>
        )}

        {result.tahmini_yas && (
          <SonucKarti
            icon={<Cake size={18} />}
            baslik="Tahmini Yaş"
            guven={result.tahmini_yas.guven}
          >
            {result.tahmini_yas.aralik}
            <span className="ml-2 inline-block rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs font-semibold text-[#475569] dark:bg-slate-800 dark:text-slate-400">
              {result.tahmini_yas.yasam_evresi}
            </span>
          </SonucKarti>
        )}

        {result.cinsiyet && (
          <SonucKarti
            icon={<VenetianMask size={18} />}
            baslik="Cinsiyet"
            guven={result.cinsiyet.guven}
          >
            {result.cinsiyet.tahmin}
          </SonucKarti>
        )}

        {result.tahmini_boyut && (
          <SonucKarti
            icon={<Ruler size={18} />}
            baslik="Tahmini Boyut"
            guven={result.tahmini_boyut.guven}
          >
            {result.tahmini_boyut.deger}
          </SonucKarti>
        )}
      </div>

      {result.ayirt_edici_isaretler &&
        result.ayirt_edici_isaretler.length > 0 && (
          <SonucKarti
            icon={<Fingerprint size={18} />}
            baslik="Ayırt Edici İşaretler"
          >
            <ul className="list-disc space-y-1 pl-4">
              {result.ayirt_edici_isaretler.map((isaret) => (
                <li key={isaret}>{isaret}</li>
              ))}
            </ul>
          </SonucKarti>
        )}

      {result.genel_durum_gozlemi && (
        <SonucKarti
          icon={<Stethoscope size={18} />}
          baslik="Genel Durum Gözlemi"
        >
          {result.genel_durum_gozlemi}
        </SonucKarti>
      )}

      {result.sasirtici_bilgiler &&
        result.sasirtici_bilgiler.length > 0 && (
          <SonucKarti
            icon={<Lightbulb size={18} />}
            baslik="Şaşırtıcı Bilgiler"
          >
            <ul className="list-disc space-y-1.5 pl-4">
              {result.sasirtici_bilgiler.map((bilgi) => (
                <li key={bilgi}>{bilgi}</li>
              ))}
            </ul>
          </SonucKarti>
        )}

      {result.dikkat_edilmesi_gerekenler &&
        result.dikkat_edilmesi_gerekenler.length > 0 && (
          <SonucKarti
            icon={<ShieldAlert size={18} />}
            baslik="Dikkat Edilmesi Gerekenler"
          >
            <ul className="list-disc space-y-1.5 pl-4">
              {result.dikkat_edilmesi_gerekenler.map((madde) => (
                <li key={madde}>{madde}</li>
              ))}
            </ul>
          </SonucKarti>
        )}

      {result.bakim_ipuclari && (
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
            {result.bakim_ipuclari.beslenme && (
              <div className="flex items-start gap-2.5">
                <Utensils size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{result.bakim_ipuclari.beslenme}</span>
              </div>
            )}
            {result.bakim_ipuclari.tuy_bakimi && (
              <div className="flex items-start gap-2.5">
                <Wind size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{result.bakim_ipuclari.tuy_bakimi}</span>
              </div>
            )}
            {result.bakim_ipuclari.aktivite && (
              <div className="flex items-start gap-2.5">
                <Dumbbell size={16} className="mt-0.5 shrink-0 text-[#64748B] dark:text-slate-500" />
                <span>{result.bakim_ipuclari.aktivite}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result.ek_hayvanlar && (
        <div className="rounded-2xl bg-[#F1F5F9] p-4 text-sm text-[#475569] dark:bg-slate-800/60 dark:text-slate-400">
          <strong className="font-bold">Diğer hayvanlar: </strong>
          {result.ek_hayvanlar}
        </div>
      )}
    </div>
  );
}
