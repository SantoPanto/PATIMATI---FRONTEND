import { ApiError, request } from "./api";
import type { Page, PetShopProductResponse, PetShopProductUpsertPayload } from "./types";

/**
 * Petshop Ürün Servisleri (plan §10, yeni).
 */

/**
 * GET /api/petshop/products (Bearer, ROLE_PETSHOP) -- çağıranın kendi
 * dükkanının ürün listesi. Backend `Pageable` ile döndüğü için (bkz.
 * `findByPetShop_IdOrderByCreatedAtDesc(Long, Pageable)`) burada da
 * `Page<PetShopProductResponse>` -- `listShopProducts`/`listPetShops` ile
 * aynı sözleşme.
 */
export function listMyProducts(params?: {
  page?: number;
  size?: number;
}): Promise<Page<PetShopProductResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<PetShopProductResponse>>(
    `/api/petshop/products${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}

/**
 * POST /api/petshop/products (Bearer, ROLE_PETSHOP, multipart/form-data)
 */
export function createProduct(payload: PetShopProductUpsertPayload): Promise<PetShopProductResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<PetShopProductResponse>("/api/petshop/products", {
    method: "POST",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * PUT /api/petshop/products/{productId} (Bearer, ROLE_PETSHOP, multipart/form-data)
 * `photo` verilmezse mevcut fotoğraf korunur.
 */
export function updateProduct(
  productId: number,
  payload: PetShopProductUpsertPayload,
): Promise<PetShopProductResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<PetShopProductResponse>(`/api/petshop/products/${productId}`, {
    method: "PUT",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * DELETE /api/petshop/products/{productId} (Bearer, ROLE_PETSHOP)
 */
export function deleteProduct(productId: number): Promise<void> {
  return request<void>(`/api/petshop/products/${productId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * GET /api/petshop-products/{id} (herkese açık, kimlik gerekmez)
 * Ürün bulunamazsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getPublicProduct(id: number): Promise<PetShopProductResponse | null> {
  try {
    return await request<PetShopProductResponse>(`/api/petshop-products/${id}`, {
      method: "GET",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * GET /api/petshops/{shopId}/products (herkese açık, kimlik gerekmez) --
 * bir dükkanın herkese açık ürün listesi.
 */
export function listShopProducts(
  shopId: number,
  params?: { page?: number; size?: number },
): Promise<Page<PetShopProductResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<PetShopProductResponse>>(
    `/api/petshops/${shopId}/products${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}
