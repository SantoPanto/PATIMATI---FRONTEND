import { request } from "./api";
import type {
  AdResponse,
  AdoptionAdCreateRequest,
  AdoptionAdUpdateRequest,
  Page,
  ResolveAdoptionAdRequest,
} from "./types";

/**
 * 3. Sahiplendirme İlanları (/api/adoptions & /api/public/adoptions)
 */

export async function createAdoptionAd(
  ad: AdoptionAdCreateRequest,
  images: File[],
): Promise<AdResponse> {
  if (!images || images.length === 0) {
    throw new Error(
      "Sahiplendirme ilanı için en az bir fotoğraf zorunludur.",
    );
  }

  const cleanedAd: Record<string, unknown> = { ...ad };
  if (!cleanedAd.date || cleanedAd.date === "") {
    delete cleanedAd.date;
  }
  if (!cleanedAd.lostDate || cleanedAd.lostDate === "") {
    delete cleanedAd.lostDate;
  }

  const formData = new FormData();
  const adBlob = new Blob([JSON.stringify(cleanedAd)], {
    type: "application/json",
  });

  formData.append("ad", adBlob);

  images.forEach((file) => {
    formData.append("images", file);
  });

  return request<AdResponse>("/api/adoptions", {
    method: "POST",
    requiresAuth: true,
    body: formData,
  });
}

export function updateAdoptionAd(
  adId: number,
  data: AdoptionAdUpdateRequest,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/adoptions/${adId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export function deleteAdoptionAd(
  adId: number,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/api/adoptions/${adId}`,
    {
      method: "DELETE",
      requiresAuth: true,
    },
  );
}

export function resolveAdoptionAdopted(
  adId: number,
  requestData?: ResolveAdoptionAdRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/api/adoptions/${adId}/resolve-adopted`,
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(requestData || {}),
    },
  );
}

export function getPublicAdoptions(params?: {
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  const endpoint =
    `/api/public/adoptions${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
  });
}

/**
 * Sahiplendirme detayları ortak public ilan detay adresinden gelir.
 * GET /api/public/ads/{adId} (No Auth)
 */
export function getPublicAdoptionById(
  adId: number,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/public/ads/${adId}`, {
    method: "GET",
  });
}
