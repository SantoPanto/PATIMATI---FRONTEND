import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Megaphone, Send, X } from "lucide-react";
import { publishAdToInstagram } from "../services/admin";
import { getUserErrorMessage } from "../utils/errorMessage";

interface InstagramPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueItemId: number;
  adTitle: string;
  suggestedCaption: string;
  onPublished?: () => void;
}

const CAPTION_MAX_LENGTH = 2200;

/**
 * "Instagram'a Gönder" onayı -- ComplaintModal.tsx ile AYNI iskelet
 * (header+icon, overlay, Escape/backdrop kapatma, submitting/error/success
 * durumları), tek fark: seçim yerine önceden AI'nın önerdiği caption ile
 * doldurulmuş, düzenlenebilir bir metin alanı.
 */
export default function InstagramPublishModal({
  isOpen,
  onClose,
  queueItemId,
  adTitle,
  suggestedCaption,
  onPublished,
}: InstagramPublishModalProps) {
  const [caption, setCaption] = useState(suggestedCaption);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Modal her açıldığında formu sıfırla -- ComplaintModal.tsx'in aynı
  // render-sırasında-state-ayarlama deseni.
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);

    if (isOpen) {
      setCaption(suggestedCaption);
      setError(null);
      setSuccess(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caption.trim()) {
      setError("Gönderi metni boş olamaz.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await publishAdToInstagram(queueItemId, caption.trim());

      setSuccess(true);
      if (onPublished) {
        onPublished();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Instagram'a gönderim başarısız:", err);
      setError(
        getUserErrorMessage(
          err,
          "İlan Instagram'a gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={() => !submitting && onClose()}
    >
      <section
        aria-labelledby="instagram-publish-modal-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-violet-500/15 dark:text-violet-300">
              <Megaphone size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] dark:text-violet-300">
                Instagram'a Gönder
              </span>
              <h2
                id="instagram-publish-modal-title"
                className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50"
              >
                "{adTitle}"
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
              Instagram'a Gönderildi
            </h3>
            <p className="mt-2 text-sm text-slate-600 max-w-xs dark:text-slate-400">
              İlan PatiMati'nin Instagram hesabında paylaşıldı.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                <AlertCircle size={20} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="instagram-publish-caption"
                className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300"
              >
                Gönderi Metni <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="instagram-publish-caption"
                rows={8}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Gönderi metnini yazın..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                maxLength={CAPTION_MAX_LENGTH}
                disabled={submitting}
              />
              <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                {caption.length}/{CAPTION_MAX_LENGTH}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting || !caption.trim()}
                className="flex h-11 items-center justify-center gap-2 px-6 rounded-xl bg-[#7C3AED] text-sm font-bold text-white transition hover:bg-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:opacity-50 shadow-md shadow-violet-600/20"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    <span>Instagram'a Gönder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
