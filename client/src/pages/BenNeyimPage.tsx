import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertTriangle,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PetReportView from "../components/PetReportView";
import { ApiError } from "../services/api";
import { hataNedeniMesaji, petRaporuAl } from "../services/petAnalizi";
import type { PetReportResult } from "../services/types";
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

/**
 * "Ben Neyim?" -- 2026-08-27'den beri LLM tabanlı zengin pet raporu
 * (AI /analyze_pet, BE #185): karakter profili, bakım ipuçları, şaşırtıcı
 * bilgiler... Raporun çizimi MyPets/vet tarafıyla ORTAK {@link PetReportView}
 * bileşeninde; bu sayfa yalnızca yükleme akışını ve hata hâllerini taşır.
 */
export default function BenNeyimPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kullaniciNotu, setKullaniciNotu] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<PetReportResult | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    setErrorMessage("");
    setResult(null);

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
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await petRaporuAl(photo, kullaniciNotu);
      setResult(response);
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
              Bir fotoğraf yükle, dostunu yakından tanı
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#64748B] dark:text-slate-400">
              Kedi veya köpeğinin bir fotoğrafını yükle; karakter profili,
              bakım ipuçları ve şaşırtıcı bilgilerle dolu, sana özel bir
              rapor al.
            </p>

            <p className="mt-3 text-xs font-medium text-[#94A3B8] dark:text-slate-500">
              Günde 3 analiz hakkın var.
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
                  className="max-h-[360px] w-full bg-[#F1F5F9] object-contain dark:bg-slate-800"
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
                    <p className="mt-1.5 text-xs text-[#94A3B8] dark:text-slate-500">
                      Notun rapora bağlam olarak eklenir.
                    </p>
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
                        Rapor hazırlanıyor...
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

          {result && !result.gecerli && (
            <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <AlertTriangle size={26} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#334155] dark:text-slate-300">
                {hataNedeniMesaji(result.hata_nedeni)}
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

          {result?.gecerli && (
            <div className="mt-6 space-y-4">
              <PetReportView result={result} />

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
