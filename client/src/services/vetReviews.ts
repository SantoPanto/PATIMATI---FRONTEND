import { ApiError, request } from "./api";
import type { Page, VetClinicReviewResponse, VetClinicReviewUpsertPayload } from "./types";

/**
 * 12. Veteriner Kliniği Puan/Yorum Servisleri
 */

/**
 * GET /api/vet-clinics/{id}/reviews (herkese açık, sayfalı liste)
 * `api.ts`'in `request()` fonksiyonu token varsa `requiresAuth` bayrağından
 * BAĞIMSIZ olarak Authorization başlığını ekliyor -- yani kullanıcı giriş
 * yapmışsa token gider ve backend `canEdit` hesabını doğru yapabilir.
 */
export function listClinicReviews(
  clinicId: number,
  params?: { page?: number; size?: number },
): Promise<Page<VetClinicReviewResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<VetClinicReviewResponse>>(
    `/api/vet-clinics/${clinicId}/reviews${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

/**
 * GET /api/vet-clinics/{id}/reviews/me (Bearer)
 * Yorum hiç yoksa 404 döner -- çağıran bunu `null` olarak yorumlar
 * (`getMyRequestStatus` ile aynı sözleşme).
 */
export async function getMyClinicReview(
  clinicId: number,
): Promise<VetClinicReviewResponse | null> {
  try {
    return await request<VetClinicReviewResponse>(`/api/vet-clinics/${clinicId}/reviews/me`, {
      method: "GET",
      requiresAuth: true,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * PUT /api/vet-clinics/{id}/reviews/me (Bearer) -- oluştur/güncelle (upsert).
 * `(vetClinicId, authorId)` başına tek satır -- ikinci gönderim mevcut
 * yorumu günceller, yeni satır AÇILMAZ.
 */
export function upsertMyClinicReview(
  clinicId: number,
  payload: VetClinicReviewUpsertPayload,
): Promise<VetClinicReviewResponse> {
  return request<VetClinicReviewResponse>(`/api/vet-clinics/${clinicId}/reviews/me`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/vet-clinics/{id}/reviews/me (Bearer)
 */
export function deleteMyClinicReview(clinicId: number): Promise<void> {
  return request<void>(`/api/vet-clinics/${clinicId}/reviews/me`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
