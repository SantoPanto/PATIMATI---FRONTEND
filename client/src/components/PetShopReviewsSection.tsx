import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/api";
import type { PetShopReviewResponse } from "../services/types";
import {
  deleteMyPetShopReview,
  listPetShopReviews,
  upsertMyPetShopReview,
} from "../services/petshopReviews";
import StarRating from "./StarRating";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/**
 * Petshop (dükkan seviyesi) puan/yorum listesi + gönderim formu --
 * `ShelterReviewsSection.tsx`'in satır satır aynısı, `{shelterId}` yerine
 * `{petShopId}` prop'u. Ürün bazlı `PetShopProductReviewsSection` ile
 * KARIŞTIRILMAMALI -- bu, ürün değil DÜKKANIN kendisi için verilen puan.
 *
 * Petshop sahibinin kendi dükkanına yorum yapamaması SUNUCU tarafında
 * uygulanır (`BusinessException`) -- bu bileşen yalnızca `petShopId` alır,
 * görüntüleyenin dükkan sahibi olup olmadığını bilemez; sahip yine de
 * denerse gönderim hatası (`errorMessage`) olarak görünür.
 */
export default function PetShopReviewsSection({ petShopId }: { petShopId: number }) {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<PetShopReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = () => {
    setIsLoading(true);
    return listPetShopReviews(petShopId)
      .then((page) => setReviews(page.content))
      .catch(() => setErrorMessage("Yorumlar yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petShopId]);

  const startEdit = (review: PetShopReviewResponse) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
  };

  const handleUpdate = async (reviewId: number) => {
    if (editRating < 1) return;
    setBusyId(reviewId);
    setErrorMessage(null);
    try {
      await upsertMyPetShopReview(petShopId, {
        rating: editRating,
        comment: editComment.trim() || undefined,
      });
      setEditingId(null);
      await loadReviews();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Yorum güncellenirken bir hata oluştu.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm("Bu yorum silinsin mi?")) return;
    setBusyId(reviewId);
    setErrorMessage(null);
    try {
      await deleteMyPetShopReview(petShopId);
      await loadReviews();
    } catch {
      setErrorMessage("Yorum silinirken bir hata oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmit = async () => {
    if (formRating < 1) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await upsertMyPetShopReview(petShopId, {
        rating: formRating,
        comment: formComment.trim() || undefined,
      });
      setFormRating(0);
      setFormComment("");
      await loadReviews();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Yorum gönderilirken bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Henüz bir yorum yok.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-slate-800/60">
              {editingId === review.id ? (
                <div className="space-y-2">
                  <StarRating value={editRating} onChange={setEditRating} />
                  <textarea
                    value={editComment}
                    onChange={(event) => setEditComment(event.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(review.id)}
                      disabled={busyId === review.id || editRating < 1}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {review.authorName}
                      </p>
                      <StarRating value={review.rating} readOnly size={14} />
                    </div>
                    {review.canEdit && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          aria-label="Düzenle"
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          disabled={busyId === review.id}
                          aria-label="Sil"
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-[#0F172A] dark:text-[#F1F5F9]">{review.comment}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <div
          data-testid="petshop-review-form"
          className="space-y-2 rounded-xl border border-gray-200 p-3 dark:border-slate-700"
        >
          <StarRating value={formRating} onChange={setFormRating} />
          <textarea
            value={formComment}
            onChange={(event) => setFormComment(event.target.value)}
            placeholder="Yorumunuzu yazın (isteğe bağlı)"
            rows={2}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || formRating < 1}
            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gönder
          </button>
        </div>
      )}
    </div>
  );
}
