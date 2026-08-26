import { CheckCircle2, AlertTriangle, Loader2, Sparkles, X } from "lucide-react";
import { useLocation } from "wouter";
import type { MatchingState } from "../hooks/useAdMatchingMachine";
import type { MatchResponseDTO } from "../services/types";
import MatchCard from "./MatchCard";

interface AdCreationMatchModalProps {
  state: MatchingState;
  matches: MatchResponseDTO[];
  errorMessage?: string;
  onClose: () => void;
}

export default function AdCreationMatchModal({
  state,
  matches,
  errorMessage,
  onClose,
}: AdCreationMatchModalProps) {
  const [, navigate] = useLocation();

  if (state === "IDLE" || state === "CREATING_AD" || state === "AD_CREATED") {
    return null;
  }

  const handleFinish = () => {
    onClose();
    navigate("/");
  };

  const handleGoToMatches = () => {
    onClose();
    navigate("/my-matches");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
        {/* SEARCHING STATE */}
        {state === "SEARCHING" && (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            </div>

            <h2
              id="modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3"
            >
              Veri tabanında arama yapılıyor
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              İlanınız başarıyla oluşturuldu. Şimdi uygun eşleşmeleri kontrol
              ediyoruz.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-full dark:text-orange-400">
              <Sparkles size={14} className="animate-spin" />
              Yapay zeka modelleri görsel ve metinsel verileri tarıyor...
            </div>
          </div>
        )}

        {/* MATCH_FOUND STATE */}
        {state === "MATCH_FOUND" && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 dark:border-slate-800">
              <h2
                id="modal-title"
                className="text-2xl font-bold text-slate-900 flex items-center gap-2 dark:text-slate-50"
              >
                <Sparkles className="text-orange-500" size={26} />
                Olası Eşleşme Bulundu!
              </h2>
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition dark:hover:bg-slate-800"
                aria-label="Kapat"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-slate-600 mb-6 dark:text-slate-400">
              İlanınız başarıyla yayınlandı ve sistemimizde eşleşen ilanlar
              bulundu. Lütfen inceleyin:
            </p>

            <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {matches.map((match, idx) => (
                <MatchCard key={match.id || idx} match={match} />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={handleGoToMatches}
                className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700 shadow-md"
              >
                Tüm Eşleşmelerime Git
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Tamam
              </button>
            </div>
          </div>
        )}

        {/* NO_MATCH STATE */}
        {state === "NO_MATCH" && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={44} />
            </div>

            <h2
              id="modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3"
            >
              İlanınız Yayınlandı
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mb-8">
              İlanınız başarıyla oluşturuldu. Şu anda uygun bir eşleşme
              bulunamadı. Yeni bir eşleşme çıktığında size bildirim
              gönderilecektir.
            </p>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full max-w-xs rounded-xl bg-slate-900 py-3.5 font-bold text-white transition hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-700 shadow-md"
            >
              Tamam
            </button>
          </div>
        )}

        {/* SEARCH_FAILED STATE */}
        {state === "SEARCH_FAILED" && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle size={44} />
            </div>

            <h2
              id="modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3"
            >
              İlanınız Yayınlandı
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mb-2">
              İlanınız başarıyla yayınlandı ancak eşleşme araması tamamlanamadı.
              Daha sonra tekrar kontrol edebilirsiniz.
            </p>

            {errorMessage && (
              <p className="text-xs text-slate-500 mb-6 italic dark:text-slate-500">
                ({errorMessage})
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-center w-full mt-4">
              <button
                type="button"
                onClick={handleGoToMatches}
                className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700 shadow-md"
              >
                Eşleşmelerime Git
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
