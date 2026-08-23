import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Flag, Loader2, X } from "lucide-react";
import { reportUser } from "../services/api";
import type { ComplaintReason, UserComplaintRequestDTO } from "../services/types";

export interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: number;
  reportedUserName?: string;
  onSuccess?: () => void;
}

// Backend'in kabul ettigi TEK liste: entity/enums/ComplaintReason.
// Burada olmayan bir deger gonderilirse sunucu 400 dondurur; onceki listedeki
// SPAM / HARASSMENT / SCAM / INAPPROPRIATE_CONTENT / OTHER degerlerinin hicbiri
// backend'de yoktu, yani alti sebebin besi (varsayilan dahil) hata veriyordu.
const REASON_OPTIONS: { value: ComplaintReason; label: string }[] = [
  { value: "KOTU_DIL_KULLANIMI", label: "Kötü / Saldırgan Dil Kullanımı" },
  { value: "UYGUNSUZ_ICERIK", label: "Uygunsuz / Hakaret İçeren İçerik" },
  { value: "DOLANDIRICILIK", label: "Dolandırıcılık / Sahtekârlık Şüphesi" },
  { value: "SAHTE_ILAN", label: "Sahte İlan" },
  { value: "DIGER", label: "Diğer Sebepler" },
];

/** Acilisitaki varsayilan sebep - listenin ilk maddesiyle ayni olmali. */
const VARSAYILAN_SEBEP: ComplaintReason = "KOTU_DIL_KULLANIMI";

export default function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  onSuccess,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<ComplaintReason>(VARSAYILAN_SEBEP);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Form state reset when modal opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setReason(VARSAYILAN_SEBEP);
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
      setError("Lütfen şikayet açıklamasını giriniz.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: UserComplaintRequestDTO = {
        reportedUserId,
        reason,
        description: description.trim(),
      };

      await reportUser(payload);

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      console.error("Kullanıcı şikayeti başarısız:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Şikayet gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.";
      setError(errorMessage);
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
        aria-labelledby="report-user-modal-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Flag size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Kullanıcı Şikayeti
              </span>
              <h2
                id="report-user-modal-title"
                className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50"
              >
                {reportedUserName
                  ? `"${reportedUserName}" adlı kullanıcıyı şikayet et`
                  : "Kullanıcıyı Şikayet Et"}
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

        {/* Modal Body / Form */}
        {success ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
              Şikayetiniz Başarıyla İletildi
            </h3>
            <p className="mt-2 text-sm text-slate-600 max-w-xs dark:text-slate-400">
              Kullanıcı hakkındaki bildiriminiz incelenmek üzere yöneticilerimize iletilmiştir.
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
                htmlFor="report-reason"
                className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300"
              >
                Şikayet Nedeni <span className="text-rose-500">*</span>
              </label>
              <select
                id="report-reason"
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

            {/* Description Textarea */}
            <div>
              <label
                htmlFor="report-description"
                className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300"
              >
                Açıklama Detayı <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Şikayetinizle ilgili detaylı bilgi veriniz..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
                maxLength={1000}
                disabled={submitting}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Maksimum 1000 karakter</span>
                <span className={description.length >= 950 ? "text-rose-500 font-bold" : ""}>
                  {description.length}/1000
                </span>
              </div>
            </div>

            {/* Form Actions */}
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
