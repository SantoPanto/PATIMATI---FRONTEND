import { ApiError, request } from "./api";
import type { Page, ShelterReviewResponse, ShelterReviewUpsertPayload } from "./types";

/**
 * Barınak Puan/Yorum Servisleri -- `services/vetReviews.ts`'in birebir
 * aynısı, `/api/shelters/{id}/reviews` yoluna (plan §12).
 */

/**
 * GET /api/shelters/{id}/reviews (herkese açık, sayfalı liste)
 */
export function listShelterReviews(
  shelterId: number,
  params?: { page?: number; size?: number },
): Promise<Page<ShelterReviewResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<ShelterReviewResponse>>(
    `/api/shelters/${shelterId}/reviews${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

/**
 * GET /api/shelters/{id}/reviews/me (Bearer)
 * Yorum hiç yoksa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyShelterReview(
  shelterId: number,
): Promise<ShelterReviewResponse | null> {
  try {
    return await request<ShelterReviewResponse>(`/api/shelters/${shelterId}/reviews/me`, {
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
 * PUT /api/shelters/{id}/reviews/me (Bearer) -- oluştur/güncelle (upsert).
 */
export function upsertMyShelterReview(
  shelterId: number,
  payload: ShelterReviewUpsertPayload,
): Promise<ShelterReviewResponse> {
  return request<ShelterReviewResponse>(`/api/shelters/${shelterId}/reviews/me`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/shelters/{id}/reviews/me (Bearer)
 */
export function deleteMyShelterReview(shelterId: number): Promise<void> {
  return request<void>(`/api/shelters/${shelterId}/reviews/me`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
