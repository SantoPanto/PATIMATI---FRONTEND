import { request } from "./api";
import type {
  AdCreateRequest,
  AdResponse,
  AdType,
  AdUpdateRequest,
  Page,
  ResolveLostAdRequest,
} from "./types";

/**
 * 2. Genel ve Kayıp/Buluntu İlanları
 */

export async function createAd(
  ad: AdCreateRequest,
  images?: File[],
): Promise<AdResponse> {
  const formData = new FormData();

  formData.append(
    "ad",
    new Blob([JSON.stringify(ad)], {
      type: "application/json",
    }),
  );

  if (images && images.length > 0) {
    images.forEach((file) => {
      formData.append("images", file);
    });
  }

  return request<AdResponse>("/api/ads", {
    method: "POST",
    requiresAuth: true,
    body: formData,
  });
}

export function getAdById(
  adId: number,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/ads/${adId}`, {
    method: "GET",
    requiresAuth: true,
  });
}

export function getAds(params?: {
  adType?: AdType;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();

  if (params?.adType) {
    searchParams.set("adType", params.adType);
  }

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  const endpoint = `/api/ads${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
    requiresAuth: true,
  });
}

export function getMyAds(params?: {
  active?: boolean;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();

  if (params?.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  const endpoint = `/api/ads/me${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
    requiresAuth: true,
  });
}

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

export function deleteAd(
  adId: number,
): Promise<void> {
  return request<void>(`/api/ads/${adId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

export function resolveLostAdFound(
  adId: number,
  requestData?: ResolveLostAdRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/api/ads/lost/${adId}/resolve-found`,
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(requestData || {}),
    },
  );
}

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

  return request<AdResponse[]>(
    `/api/ads/nearby?${searchParams.toString()}`,
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}

export function getPublicAds(params?: {
  adType?: AdType;
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();

  if (params?.adType) {
    searchParams.set("adType", params.adType);
  }

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  const endpoint =
    `/api/public/ads${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
  });
}

export function getPublicAdById(
  adId: number,
): Promise<AdResponse> {
  return request<AdResponse>(
    `/api/public/ads/${adId}`,
    {
      method: "GET",
    },
  );
}

export interface AdCountersResponse {
  activeAds: number;
  happyEndings: number;
}

export function getPublicAdCounters(): Promise<AdCountersResponse> {
  return request<AdCountersResponse>("/api/public/ads/counters", {
    method: "GET",
  });
}