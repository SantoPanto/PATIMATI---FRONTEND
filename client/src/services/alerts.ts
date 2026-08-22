import { ApiError, request } from "./api";

/**
 * Konum tabanlı uyarı aboneliği: "çevremde kayıp ilanı çıkınca bildirim al."
 * Sunucuda kullanıcı başına tek kayıt tutulur (PUT idempotenttir).
 */
export type AlertSubscription = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  enabled: boolean;
};

/**
 * GET /api/alert-subscriptions/me (Bearer)
 * Abonelik hiç kurulmamışsa sunucu 404 döner; bu "hata" değil
 * "henüz yok" durumudur, null'a çevrilir.
 */
export async function getMyAlertSubscription(): Promise<AlertSubscription | null> {
  try {
    return await request<AlertSubscription>(
      "/api/alert-subscriptions/me",
      { method: "GET", requiresAuth: true },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * PUT /api/alert-subscriptions/me (Bearer)
 * Tam durumu gönderir; kayıt yoksa oluşturulur, varsa güncellenir.
 */
export function saveAlertSubscription(
  subscription: AlertSubscription,
): Promise<AlertSubscription> {
  return request<AlertSubscription>(
    "/api/alert-subscriptions/me",
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(subscription),
    },
  );
}
