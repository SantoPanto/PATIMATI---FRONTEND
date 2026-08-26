import { request } from "./api";
import type { PoiResponse, PoiType } from "./types";

/**
 * Haritayı besleyen yakın veteriner/petshop/barınakları döner. Kimlik
 * doğrulama gerektirmez (bkz. AdController'daki getPublicNearbyAds deseni).
 */
export function getNearbyPois(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  types?: PoiType[];
}): Promise<PoiResponse[]> {
  const searchParams = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius: String(params.radius ?? 15000),
  });

  params.types?.forEach((type) => searchParams.append("types", type));

  return request<PoiResponse[]>(
    `/api/public/pois?${searchParams.toString()}`,
    { method: "GET" },
  );
}
