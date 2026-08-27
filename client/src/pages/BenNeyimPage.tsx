import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertTriangle,
  Eye,
  Fingerprint,
  ImagePlus,
  Loader2,
  Palette,
  PawPrint,
  Sparkles,
  Tag,
  VenetianMask,
  X,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ApiError } from "../services/api";
import { petRaporuAl } from "../services/petAnalizi";
import type { AiAnalysis } from "../services/types";
import { parseAiAnalysis, type NormalizedAiAnalysis } from "../utils/aiAnalysisUtils";
import { compressImagesWithinLimit } from "../utils/imageCompression";
import { getUserErrorMessage } from "../utils/errorMessage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

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

export default function BenNeyimPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kullaniciNotu, setKullaniciNotu] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<NormalizedAiAnalysis | null>(null);
  const [, setRawAnalysis] = useState<AiAnalysis | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    setErrorMessage("");
    setResult(null);
    setRawAnalysis(null);

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Yalnızca JPG, PNG veya WEBP dosyaları kabul edilir.");
      return;
    }

    try {
      setIsCompressing(true);
      const { accepted, stillTooLarge } = await compressImagesWithinLimit(
        [file],
        MAX_FILE_SIZE,
      );

      if (stillTooLarge.length > 0) {
        setErrorMessage(
          `Fotoğraf küçültülemedi ve ${MAX_FILE_SIZE_MB} MB sınırının üstünde kaldı.`,
        );
        return;
      }

      const secilen = accepted[0];
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(secilen);
      setPreview(URL.createObjectURL(secilen));
    } catch (err) {
      console.error("Fotoğraf sıkıştırma hatası:", err);
      setErrorMessage("Fotoğraf işlenemedi. Başka bir fotoğrafla tekrar deneyin.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const removePhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    setResult(null);
    setRawAnalysis(null);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);
    setRawAnalysis(null);

    try {
      const response = await petRaporuAl(photo, kullaniciNotu);
      setRawAnalysis(response);
      const normalized = parseAiAnalysis(response);
      setResult(normalized);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(getUserErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const basaBaslaTiklandi = () => {
    removePhoto();
    setKullaniciNotu("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main>
        <section className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#FAF5FF] via-white to-[#EFF6FF] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="mx-auto max-w-[900px] px-4 py-14 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] dark:border-violet-500/20 dark:bg-slate-900 dark:text-violet-300">
              <Sparkles size={16} />
              Ben Neyim?
            </span>

            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Bir fotoğraf yükle, yapay zekâ tanısın
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#64748B] dark:text-slate-400">
              Kedi veya köpeğinin bir fotoğrafını yükle; türünü, ırkını, rengini
              ve görsel özelliklerini öğren.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 lg:px-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {!preview ? (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isCompressing}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  return;
                }
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                isDragging
                  ? "border-[#7C3AED] bg-[#FAF5FF] dark:bg-violet-500/10"
                  : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#A78BFA] hover:bg-[#FAF5FF]/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/5"
              } ${isCompressing ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-500/15 dark:text-violet-300">
                {isCompressing ? (
                  <Loader2 size={30} className="animate-spin" />
                ) : (
                  <ImagePlus size={30} />
                )}
              </div>

              <p className="mt-5 text-lg font-bold text-[#1E293B] dark:text-slate-100">
                {isCompressing
                  ? "Fotoğraf hazırlanıyor..."
                  : "Bir fotoğraf yükleyin"}
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748B] dark:text-slate-400">
                Fotoğrafı buraya sürükleyin veya bilgisayarınızdan seçmek
                için tıklayın.
              </p>

              <span className="mt-4 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#64748B] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                JPG, PNG veya WEBP · En fazla {MAX_FILE_SIZE_MB} MB
              </span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="relative">
                <img
                  src={preview}
                  alt="Yüklenen fotoğraf"
                  className="max-h-[360px] w-full object-contain bg-[#F1F5F9] dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="Fotoğrafı kaldır"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <X size={18} />
                </button>
              </div>

              {!result && (
                <div className="space-y-4 p-5">
                  <div>
                    <label
                      htmlFor="kullanici-notu"
                      className="mb-1.5 block text-sm font-semibold text-[#334155] dark:text-slate-300"
                    >
                      Not (opsiyonel)
                    </label>
                    <input
                      id="kullanici-notu"
                      type="text"
                      value={kullaniciNotu}
                      onChange={(e) => setKullaniciNotu(e.target.value)}
                      placeholder='Örn. "sokakta buldum", "3 aylık"'
                      maxLength={200}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#1E293B] outline-none transition focus:border-[#7C3AED] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Analiz ediliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Analiz Et
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMessage && !result && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {result && (!result.isPet || !result.species) && (
            <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <AlertTriangle size={26} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#334155] dark:text-slate-300">
                Fotoğrafta bir evcil hayvan (kedi veya köpek) tespit edilemedi. Kedi veya köpeğinizin net göründüğü başka bir fotoğraf deneyin.
              </p>
              <button
                type="button"
                onClick={basaBaslaTiklandi}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#334155] transition hover:bg-[#F8FAFC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Başka fotoğrafla dene
              </button>
            </div>
          )}

          {result && result.isPet && result.species && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
                <div className="mb-2 flex items-center gap-2.5">
                  <PawPrint size={18} className="text-[#7C3AED] dark:text-violet-300" />
                  <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                    Analiz Özeti
                  </h3>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#334155] dark:text-slate-300">
                  {result.species === "CAT" ? "Kedi" : "Köpek"}
                  {result.breed ? ` — ${result.breed}` : " — Melez / Irk Belirlenemedi"}
                </p>
                {result.breed === null && (
                  <p className="mt-2 text-xs italic text-[#64748B] dark:text-slate-500">
                    Belirgin bir ırk tespit edilemediği için genel tür özellikleri esas alındı.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SonucKarti
                  icon={<PawPrint size={18} />}
                  baslik="Tür"
                  guven={result.speciesConfidence}
                >
                  {result.species === "CAT" ? "Kedi" : "Köpek"}
                </SonucKarti>

                <SonucKarti
                  icon={<Tag size={18} />}
                  baslik="Irk"
                  guven={result.breedConfidence}
                >
                  {result.breed ?? "Belirlenemedi / Melez"}
                </SonucKarti>

                <SonucKarti
                  icon={<Palette size={18} />}
                  baslik="Renk ve Desen"
                >
                  <div>
                    <span className="font-semibold">Renkler: </span>
                    {result.colors.length > 0
                      ? result.colors.map((c) => COLOR_MAP[c] || c).join(", ")
                      : "Belirlenemedi"}
                  </div>
                  <div>
                    <span className="font-semibold">Desen: </span>
                    {PATTERN_MAP[result.coatPattern] || result.coatPattern}
                  </div>
                </SonucKarti>

                {result.eyeColor !== "UNKNOWN" && (
                  <SonucKarti
                    icon={<Eye size={18} />}
                    baslik="Göz Rengi"
                  >
                    {EYE_COLOR_MAP[result.eyeColor] || result.eyeColor}
                  </SonucKarti>
                )}

                {result.collarStatus !== "UNKNOWN" && (
                  <SonucKarti
                    icon={<VenetianMask size={18} />}
                    baslik="Tasma Durumu"
                  >
                    {result.collarStatus === "YES" ? "Tasma Var" : "Tasma Görünmüyor"}
                  </SonucKarti>
                )}

                {result.earTagStatus !== "UNKNOWN" && (
                  <SonucKarti
                    icon={<Fingerprint size={18} />}
                    baslik="Kulak Küpesi"
                  >
                    {result.earTagStatus === "YES" ? "Kulak Küpesi Var" : "Kulak Küpesi Yok"}
                  </SonucKarti>
                )}
              </div>

              {result.modelVersion && (
                <div className="rounded-2xl bg-[#F1F5F9] p-4 text-xs text-[#64748B] dark:bg-slate-800/60 dark:text-slate-400">
                  Model Sürümü: {result.modelVersion}
                </div>
              )}

              <button
                type="button"
                onClick={basaBaslaTiklandi}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#334155] transition hover:bg-[#F8FAFC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Başka fotoğrafla dene
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
