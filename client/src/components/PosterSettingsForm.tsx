import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updatePosterSettings } from "../services/ads";
import type { AdResponse } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

export interface PosterSettingsFormProps {
  ad: AdResponse;
  onSuccess: (updatedAd: AdResponse) => void;
  onCancel?: () => void;
  showTitle?: boolean;
}

export default function PosterSettingsForm({
  ad,
  onSuccess,
  onCancel,
  showTitle = true,
}: PosterSettingsFormProps) {
  const [isPosterAllowed, setIsPosterAllowed] = useState(true);
  const [showEmailOnPoster, setShowEmailOnPoster] = useState(true);
  const [showPhoneOnPoster, setShowPhoneOnPoster] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ad) {
      // `ad` degistiginde (dis sistemden gelen guncel veriyle) formu
      // senkronlamak bu effect'in var olma sebebi.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPosterAllowed(ad.isPosterAllowed ?? true);
      setShowEmailOnPoster(ad.showEmailOnPoster ?? true);
      setShowPhoneOnPoster(ad.showPhoneOnPoster ?? true);
      setError(null);
      setSuccessMsg(null);
      setSubmitting(false);
    }
  }, [ad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      isPosterAllowed,
      showEmailOnPoster: isPosterAllowed ? showEmailOnPoster : false,
      showPhoneOnPoster: isPosterAllowed ? showPhoneOnPoster : false,
    };

    try {
      const updatedAd = await updatePosterSettings(ad.id, payload);
      setSuccessMsg("Afiş ayarları başarıyla kaydedildi.");

      const resultAd = updatedAd || { ...ad, ...payload };
      onSuccess(resultAd);
    } catch (err) {
      console.error("Afiş ayarları kaydedilirken hata:", err);
      setError(
        getUserErrorMessage(
          err,
          "Afiş ayarları kaydedilirken bir hata oluştu.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {showTitle && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">İlan: </span>
            {ad.title}
          </p>
        </div>
      )}

      {/* Ana Toggle (Switch) */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 shadow-sm transition hover:border-slate-300">
        <div className="space-y-0.5">
          <label
            htmlFor={`poster-allowed-toggle-${ad.id}`}
            className="text-base font-bold text-slate-900 cursor-pointer"
          >
            Afiş İndirmeyi Dışa Aç
          </label>
          <p className="text-xs text-slate-500">
            Diğer kullanıcıların bu ilan için PDF afişi indirmesine izin verin.
          </p>
        </div>

        <button
          type="button"
          id={`poster-allowed-toggle-${ad.id}`}
          role="switch"
          aria-checked={isPosterAllowed}
          onClick={() => setIsPosterAllowed((prev) => !prev)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-orange-200 ${
            isPosterAllowed ? "bg-orange-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isPosterAllowed ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Bağımlı Seçenekler */}
      {isPosterAllowed && (
        <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 transition-all animate-fadeIn">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Afiş İletişim Detayları
          </p>

          {/* Checkbox: Mail */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEmailOnPoster}
              onChange={(e) => setShowEmailOnPoster(e.target.checked)}
              className="h-5 w-5 rounded-md border-slate-300 text-orange-500 focus:ring-orange-200"
            />
            <span className="text-sm font-medium text-slate-700">
              İletişim için mail adresimi afişe ekle
            </span>
          </label>

          {/* Checkbox: Phone */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPhoneOnPoster}
              onChange={(e) => setShowPhoneOnPoster(e.target.checked)}
              className="h-5 w-5 rounded-md border-slate-300 text-orange-500 focus:ring-orange-200"
            />
            <span className="text-sm font-medium text-slate-700">
              İletişim için telefon numaramı afişe ekle
            </span>
          </label>
        </div>
      )}

      {/* Error & Success Messages */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Ayarları Kaydet"
          )}
        </button>
      </div>
    </form>
  );
}
