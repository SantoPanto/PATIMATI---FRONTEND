import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Flag, Loader2, X } from "lucide-react";
import {
  createAdComplaint,
  createAdoptionComplaint,
  createUserComplaint,
} from "../services/complaints";
import type { ComplaintReason } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

export type ComplaintTargetType = "USER" | "AD" | "ADOPTION";

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ComplaintTargetType;
  targetId: number;
  targetTitle?: string;
  onSuccess?: () => void;
}

const REASON_OPTIONS: { value: ComplaintReason; label: string }[] = [
  { value: "SAHTE_ILAN", label: "Sahte veya Yanıltıcı İlan" },
  { value: "UYGUNSUZ_ICERIK", label: "Uygunsuz / Hakaret İçeren İçerik" },
  { value: "DOLANDIRICILIK", label: "Dolandırıcılık Şüphesi" },
  { value: "KOTU_DIL_KULLANIMI", label: "Kötü Dil Kullanımı / Taciz" },
  { value: "DIGER", label: "Diğer Sebepler" },
];

export default function ComplaintModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
}: ComplaintModalProps) {
  const [reason, setReason] = useState<ComplaintReason>("SAHTE_ILAN");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  /*
   * Modal her acildiginda formu sifirla. Bunu bir effect yerine render
   * sirasinda yapiyoruz (React'in "adjusting state when a prop changes"
   * deseni) ki gereksiz bir ekstra render/flash olusmasin.
   */
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);

    if (isOpen) {
      setReason("SAHTE_ILAN");
      setDescription("");
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

    if (!description.trim()) {
      setError("Lütfen şikayet detayınızı açıklayın.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (targetType === "USER") {
        await createUserComplaint({
          reportedUserId: targetId,
          reason,
          description: description.trim(),
        });
      } else if (targetType === "AD") {
        // İlan şikayetinde reportedUserId GÖNDERİLMEZ
        await createAdComplaint({
          reportedAdId: targetId,
          reason,
          description: description.trim(),
        });
      } else if (targetType === "ADOPTION") {
        // Sahiplendirme şikayetinde reportedUserId GÖNDERİLMEZ
        await createAdoptionComplaint(targetId, {
          reason,
          description: description.trim(),
        });
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Şikayet gönderimi başarısız:", err);
      setError(
        getUserErrorMessage(
          err,
          "Şikayetiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetTypeText = () => {
    switch (targetType) {
      case "USER":
        return "Kullanıcı Şikayeti";
      case "AD":
        return "İlan Şikayeti";
      case "ADOPTION":
        return "Sahiplendirme İlanı Şikayeti";
      default:
        return "Şikayet Et";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={() => !submitting && onClose()}
    >
      <section
        aria-labelledby="complaint-modal-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Flag size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                {getTargetTypeText()}
              </span>
              <h2
                id="complaint-modal-title"
                className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50"
              >
                {targetTitle ? `"${targetTitle}"` : "Bildirim Oluştur"}
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
              Şikayetiniz Alındı
            </h3>
            <p className="mt-2 text-sm text-slate-600 max-w-xs dark:text-slate-400">
              Geri bildiriminiz yöneticilerimize iletilmiştir. İnceleme en kısa sürede yapılacaktır.
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

            {/* Reason Selection */}
            <div>
              <label
                htmlFor="complaint-reason"
                className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300"
              >
                Şikayet Nedeni <span className="text-rose-500">*</span>
              </label>
              <select
                id="complaint-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ComplaintReason)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                disabled={submitting}
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="complaint-description"
                className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300"
              >
                Açıklama Detayı <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="complaint-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Lütfen durumu detaylıca açıklayınız..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                maxLength={1000}
                disabled={submitting}
              />
              <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                {description.length}/1000
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
                disabled={submitting || !description.trim()}
                className="flex h-11 items-center justify-center gap-2 px-6 rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Flag size={17} />
                    <span>Şikayet Et</span>
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
