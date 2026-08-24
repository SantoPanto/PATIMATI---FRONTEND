import { request } from "./api";

/**
 * "Gördüm" bildirimi: üçüncü kişi (girişsiz de olabilir) kayıp ilanına
 * konum + opsiyonel foto + not bırakır; görülmeleri YALNIZ ilan sahibi
 * listeler (BE: POST /api/public/... + GET /api/ads/...).
 */
export type SightingCreate = {
  latitude: number;
  longitude: number;
  note?: string;
  reporterContact: string;
};

export type Sighting = {
  id: number;
  latitude: number;
  longitude: number;
  note: string | null;
  reporterContact: string | null;
  photoUrl: string | null;
  createdAt: string;
};

/**
 * POST /api/public/ads/{adId}/sightings — girişsiz erişilebilir; oturum
 * varsa jeton kendiliğinden eklenir ve bildirim kullanıcıya bağlanır.
 * Gövde multipart: "sighting" JSON parçası + opsiyonel "photo" (JPEG).
 */
export function createSighting(
  adId: number,
  data: SightingCreate,
  photo?: File | null,
): Promise<Sighting> {
  const formData = new FormData();
  formData.append(
    "sighting",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photo) {
    formData.append("photo", photo);
  }

  return request<Sighting>(`/api/public/ads/${adId}/sightings`, {
    method: "POST",
    body: formData,
  });
}

/** GET /api/ads/{adId}/sightings (Bearer) — yalnız ilan sahibi; en yenisi önce. */
export function getSightings(adId: number): Promise<Sighting[]> {
  return request<Sighting[]>(`/api/ads/${adId}/sightings`, {
    method: "GET",
    requiresAuth: true,
  });
}
