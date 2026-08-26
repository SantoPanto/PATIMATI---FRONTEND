import { ApiError, request } from "./api";
import type { Page, PetShopProductReviewResponse, PetShopProductReviewUpsertPayload } from "./types";

/**
 * Petshop Ürün Puan/Yorum Servisleri -- `services/vetReviews.ts`'in birebir
 * aynısı, `/api/petshop-products/{id}/reviews[/me]` yoluna (plan §10).
 */

/**
 * GET /api/petshop-products/{id}/reviews (herkese açık, sayfalı liste)
 * `api.ts`'in `request()` fonksiyonu token varsa `requiresAuth` bayrağından
 * BAĞIMSIZ olarak Authorization başlığını ekliyor -- yani kullanıcı giriş
 * yapmışsa token gider ve backend `canEdit` hesabını doğru yapabilir.
 */
export function listProductReviews(
  productId: number,
  params?: { page?: number; size?: number },
): Promise<Page<PetShopProductReviewResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<PetShopProductReviewResponse>>(
    `/api/petshop-products/${productId}/reviews${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

/**
 * GET /api/petshop-products/{id}/reviews/me (Bearer)
 * Yorum hiç yoksa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyProductReview(
  productId: number,
): Promise<PetShopProductReviewResponse | null> {
  try {
    return await request<PetShopProductReviewResponse>(
      `/api/petshop-products/${productId}/reviews/me`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * PUT /api/petshop-products/{id}/reviews/me (Bearer) -- oluştur/güncelle (upsert).
 * `(productId, authorId)` başına tek satır -- ikinci gönderim mevcut
 * yorumu günceller, yeni satır AÇILMAZ.
 */
export function upsertMyProductReview(
  productId: number,
  payload: PetShopProductReviewUpsertPayload,
): Promise<PetShopProductReviewResponse> {
  return request<PetShopProductReviewResponse>(`/api/petshop-products/${productId}/reviews/me`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/petshop-products/{id}/reviews/me (Bearer)
 */
export function deleteMyProductReview(productId: number): Promise<void> {
  return request<void>(`/api/petshop-products/${productId}/reviews/me`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
