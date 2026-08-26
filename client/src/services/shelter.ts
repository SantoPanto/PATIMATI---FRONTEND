import { ApiError, request } from "./api";
import type { AdResponse, Page, ShelterPublicResponse, ShelterResponse, ShelterUpsertPayload } from "./types";

/**
 * Barınak Servisleri -- `services/petshop.ts`'in aynısı + barınağa özel
 * `listShelterAdoptions` (plan §12).
 */

/**
 * GET /api/shelter/card (Bearer, ROLE_BARINAK)
 * Kart hiç oluşturulmamışsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyShelter(): Promise<ShelterResponse | null> {
  try {
    return await request<ShelterResponse>("/api/shelter/card", {
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
 * PUT /api/shelter/card (Bearer, ROLE_BARINAK, multipart/form-data)
 * `photo` verilmezse mevcut fotoğraf korunur.
 */
export function upsertMyShelter(payload: ShelterUpsertPayload): Promise<ShelterResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<ShelterResponse>("/api/shelter/card", {
    method: "PUT",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * GET /api/shelters/{id} (herkese açık, kimlik gerekmez)
 * Barınak bulunamazsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getShelter(id: number): Promise<ShelterPublicResponse | null> {
  try {
    return await request<ShelterPublicResponse>(`/api/shelters/${id}`, {
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
 * GET /api/shelters (herkese açık, kimlik gerekmez)
 */
export function listShelters(params?: {
  page?: number;
  size?: number;
  city?: string;
}): Promise<Page<ShelterPublicResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  if (params?.city?.trim()) searchParams.set("city", params.city.trim());

  const query = searchParams.toString();
  return request<Page<ShelterPublicResponse>>(
    `/api/shelters${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

/**
 * GET /api/shelters/{shelterId}/adoptions (herkese açık) -- barınağın güncel
 * sahiplendirme ilanları. Yeni backend ucu (plan §5/§10): `AdResponse`
 * döner -- Petshop'un ürün grid'inin aksine bu bir yeni varlık DEĞİL,
 * mevcut sahiplendirme ilanı sisteminin sahip bazlı bir görünümü.
 */
export function listShelterAdoptions(
  shelterId: number,
  params?: { page?: number; size?: number },
): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<AdResponse>>(
    `/api/shelters/${shelterId}/adoptions${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}
