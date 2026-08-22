import { request } from "./api";
import type {
  AdCreateRequest,
  AdResponse,
  AdType,
  AdUpdateRequest,
  Page,
  PosterSettingsRequest,
  ResolveLostAdRequest,
} from "./types";

/**
 * 2. Genel ve Kayıp/Buluntu İlanları
 */

export async function createAd(
  ad: AdCreateRequest,
  images?: File[],
): Promise<AdResponse> {
  const cleanedAd: Record<string, unknown> = {
    isMatchRequired: ad.isMatchRequired ?? true,
    ...ad,
    colors: Array.isArray(ad.colors) ? ad.colors : [],
  };
  /*
   * ⚠ `date` KOŞULSUZ düşürülür — boş olduğu için değil, DOLU olduğu için.
   *
   * Sunucuda `date`, `lostDate`'in @JsonAlias'ıdır. İkisi birden gönderilirse
   * Jackson aynı record bileşenine ikinci kez yazmaya çalışır, geri düşecek
   * bir setter bulamaz ve isteğin TAMAMINI reddeder:
   *
   *   No fallback setter/field defined for creator property 'lostDate'
   *   (through reference chain: AdCreateRequest["date"])
   *
   * Ölçüldü (21.08, canlı): POST /api/ads iki denemede de 500 döndü ve hiç
   * ilan oluşmadı. Kısıt buraya gömülü çünkü arıza yolu burası: gövdenin
   * telde aldığı son biçim. Çağıran sayfa yanlışlıkla `date` koysa bile
   * istek sağ çıkar. Takma ad sunucuda KALIYOR, yalnız `date` gönderen eski
   * bir istemci etkilenmez.
   */
  delete cleanedAd.date;

  if (!cleanedAd.lostDate || cleanedAd.lostDate === "") {
    delete cleanedAd.lostDate;
  }

  const formData = new FormData();
  const adBlob = new Blob([JSON.stringify(cleanedAd)], {
    type: "application/json",
  });

  formData.append("ad", adBlob);

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
  return request<AdResponse>(`/api/v1/ads/${adId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * İlanı yayından kaldırır.
 *
 * ⚠ Adı "delete" ama sunucu ilanı SİLMİYOR, pasifleştiriyor
 * (AdService.deactivateAd -> active = false). Karşılığı `republishAd`.
 */
export function deleteAd(
  adId: number,
): Promise<void> {
  return request<void>(`/api/ads/${adId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * Yayından kaldırılmış ilanı yeniden yayına alır.
 *
 * `updateAd` bunu YAPAMAZ: AdUpdateRequest'te `active` alanı yok ve sunucudaki
 * güncelleme akışı yalnız aktif ilanı buluyor. Bu yüzden ayrı bir uç var.
 * Yönetici tarafından askıya alınmış ilanlarda sunucu 403 döner.
 */
export function republishAd(
  adId: number,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/ads/${adId}/republish`, {
    method: "PUT",
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

export function updatePosterSettings(
  adId: number,
  data: PosterSettingsRequest,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/v1/ads/${adId}/poster-settings`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export { downloadLostPoster, downloadLostPoster as downloadAdPoster } from "./posters";