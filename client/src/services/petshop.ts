import { ApiError, request } from "./api";
import type { Page, PetShopPublicResponse, PetShopResponse, PetShopUpsertPayload } from "./types";

/**
 * Petshop Servisleri -- `services/vet.ts`'in aynısı (plan §10).
 */

/**
 * GET /api/petshop/card (Bearer, ROLE_PETSHOP)
 * Kart hiç oluşturulmamışsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyPetShop(): Promise<PetShopResponse | null> {
  try {
    return await request<PetShopResponse>("/api/petshop/card", {
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
 * PUT /api/petshop/card (Bearer, ROLE_PETSHOP, multipart/form-data)
 * `photo` verilmezse mevcut fotoğraf korunur.
 */
export function upsertMyPetShop(payload: PetShopUpsertPayload): Promise<PetShopResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<PetShopResponse>("/api/petshop/card", {
    method: "PUT",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * GET /api/petshops/{id} (herkese açık, kimlik gerekmez)
 * Dükkan bulunamazsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getPetShop(id: number): Promise<PetShopPublicResponse | null> {
  try {
    return await request<PetShopPublicResponse>(`/api/petshops/${id}`, {
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
 * GET /api/petshops (herkese açık, kimlik gerekmez)
 */
export function listPetShops(params?: {
  page?: number;
  size?: number;
  city?: string;
}): Promise<Page<PetShopPublicResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  if (params?.city?.trim()) searchParams.set("city", params.city.trim());

  const query = searchParams.toString();
  return request<Page<PetShopPublicResponse>>(
    `/api/petshops${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}
