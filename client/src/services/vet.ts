import { ApiError, request } from "./api";
import type { Page, VetClinicPublicResponse, VetClinicResponse, VetClinicUpsertPayload } from "./types";

/**
 * 7. Veteriner Kliniği Servisleri
 */

/**
 * GET /api/vet/clinic (Bearer, ROLE_VET)
 * Kart hiç oluşturulmamışsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyClinic(): Promise<VetClinicResponse | null> {
  try {
    return await request<VetClinicResponse>("/api/vet/clinic", {
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
 * PUT /api/vet/clinic (Bearer, ROLE_VET, multipart/form-data)
 * `photo` verilmezse mevcut fotoğraf korunur.
 */
export function upsertMyClinic(payload: VetClinicUpsertPayload): Promise<VetClinicResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<VetClinicResponse>("/api/vet/clinic", {
    method: "PUT",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * GET /api/vet-clinics/{id} (herkese açık, kimlik gerekmez)
 * Klinik bulunamazsa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getVetClinic(id: number): Promise<VetClinicPublicResponse | null> {
  try {
    return await request<VetClinicPublicResponse>(`/api/vet-clinics/${id}`, {
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
 * GET /api/vet-clinics (herkese açık, kimlik gerekmez)
 */
export function listVetClinics(params?: {
  page?: number;
  size?: number;
  city?: string;
}): Promise<Page<VetClinicPublicResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  if (params?.city?.trim()) searchParams.set("city", params.city.trim());

  const query = searchParams.toString();
  return request<Page<VetClinicPublicResponse>>(
    `/api/vet-clinics${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}
