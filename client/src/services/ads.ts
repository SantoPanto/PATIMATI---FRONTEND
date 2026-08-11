import { API_BASE_URL, request } from "./api";
import { getStoredToken } from "./auth";
import type {
  AdCreateRequest,
  AdResponse,
  AdType,
  AdUpdateRequest,
  Page,
  ResolveLostAdRequest,
} from "./types";

/**
 * 2. Genel ve Kayıp/Buluntu İlanları (/api/ads & /api/public/ads)
 */

/**
 * POST /api/ads (Bearer)
 * Multipart form data:
 * - ad: AdCreateRequest (JSON Blob)
 * - images: List<MultipartFile> (Opsiyonel)
 */
export async function createAd(
  ad: AdCreateRequest,
  images?: File[],
): Promise<AdResponse> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Oturum açılmamış. İlan vermek için giriş yapmalısınız.");
  }

  const formData = new FormData();
  formData.append(
    "ad",
    new Blob([JSON.stringify(ad)], { type: "application/json" }),
  );

  if (images && images.length > 0) {
    images.forEach((file) => {
      formData.append("images", file);
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/ads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "İlan oluşturulurken bir hata oluştu.",
    );
  }

  return data as AdResponse;
}

/**
 * GET /api/ads/{adId} (Bearer)
 */
export function getAdById(adId: number): Promise<AdResponse> {
  return request<AdResponse>(`/api/ads/${adId}`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * GET /api/ads (Bearer)
 * Query: adType, page, size
 */
export function getAds(params?: {
  adType?: AdType;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.adType) searchParams.set("adType", params.adType);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const endpoint = `/api/ads${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * GET /api/ads/me (Bearer)
 * Query: active (default true), page, size
 */
export function getMyAds(params?: {
  active?: boolean;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined)
    searchParams.set("active", String(params.active));
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const endpoint = `/api/ads/me${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * PUT /api/ads/{adId} (Bearer)
 * application/json AdUpdateRequest
 */
export function updateAd(
  adId: number,
  data: AdUpdateRequest,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/ads/${adId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * DELETE /api/ads/{adId} (Bearer)
 * HTTP 204 No Content
 */
export function deleteAd(adId: number): Promise<void> {
  return request<void>(`/api/ads/${adId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * PUT /api/ads/lost/{adId}/resolve-found (Bearer)
 * ResolveLostAdRequest: { finderId?: number }
 */
export function resolveLostAdFound(
  adId: number,
  requestData?: ResolveLostAdRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/ads/lost/${adId}/resolve-found`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(requestData || {}),
  });
}

/**
 * GET /api/ads/nearby (Bearer)
 * Query: latitude (Double), longitude (Double), radius (Double, default 5000m)
 */
export function getNearbyAds(
  latitude: number,
  longitude: number,
  radius: number = 5000,
): Promise<AdResponse[]> {
  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });

  return request<AdResponse[]>(`/api/ads/nearby?${searchParams.toString()}`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * GET /api/public/ads (No Auth)
 * Query: adType, page, size
 */
export function getPublicAds(params?: {
  adType?: AdType;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.adType) searchParams.set("adType", params.adType);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const endpoint = `/api/public/ads${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
  });
}

/**
 * GET /api/public/ads/{adId} (No Auth)
 */
export function getPublicAdById(adId: number): Promise<AdResponse> {
  return request<AdResponse>(`/api/public/ads/${adId}`, {
    method: "GET",
  });
}
