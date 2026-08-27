import { ApiError, request } from "./api";
import type { Page, PetShopReviewResponse, PetShopReviewUpsertPayload } from "./types";

/**
 * Petshop (dükkan seviyesi) Puan/Yorum Servisleri -- `services/shelterReviews.ts`'in
 * birebir aynısı, `/api/petshops/{id}/reviews` yoluna. Ürün bazlı yorumlar
 * (`services/petshopProductReviews.ts`) ile KARIŞTIRILMAMALI.
 */

/**
 * GET /api/petshops/{id}/reviews (herkese açık, sayfalı liste)
 */
export function listPetShopReviews(
  petShopId: number,
  params?: { page?: number; size?: number },
): Promise<Page<PetShopReviewResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<PetShopReviewResponse>>(
    `/api/petshops/${petShopId}/reviews${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

/**
 * GET /api/petshops/{id}/reviews/me (Bearer)
 * Yorum hiç yoksa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyPetShopReview(
  petShopId: number,
): Promise<PetShopReviewResponse | null> {
  try {
    return await request<PetShopReviewResponse>(`/api/petshops/${petShopId}/reviews/me`, {
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
 * PUT /api/petshops/{id}/reviews/me (Bearer) -- oluştur/güncelle (upsert).
 */
export function upsertMyPetShopReview(
  petShopId: number,
  payload: PetShopReviewUpsertPayload,
): Promise<PetShopReviewResponse> {
  return request<PetShopReviewResponse>(`/api/petshops/${petShopId}/reviews/me`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/petshops/{id}/reviews/me (Bearer)
 */
export function deleteMyPetShopReview(petShopId: number): Promise<void> {
  return request<void>(`/api/petshops/${petShopId}/reviews/me`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
