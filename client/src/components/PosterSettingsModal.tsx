import { useEffect } from "react";
import { Settings, X } from "lucide-react";
import PosterSettingsForm from "./PosterSettingsForm";
import type { AdResponse } from "../services/types";

interface PosterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdResponse | null;
  onSuccess: (updatedAd: AdResponse) => void;
}

export default function PosterSettingsModal({
  isOpen,
  onClose,
  ad,
  onSuccess,
}: PosterSettingsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ad) return null;

  const handleFormSuccess = (updatedAd: AdResponse) => {
    onSuccess(updatedAd);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="poster-settings-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <Settings size={24} aria-hidden="true" />
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">
                KVKK & Gizlilik
              </span>
              <h2
                id="poster-settings-title"
                className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-50"
              >
                Afiş Ayarları
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Pencereyi kapat"
          >
            <X size={19} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6">
          <PosterSettingsForm
            ad={ad}
            onSuccess={handleFormSuccess}
            onCancel={onClose}
            showTitle={true}
          />
        </div>
      </section>
    </div>
  );
}
