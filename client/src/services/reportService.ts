import { request } from "./api";

/**
 * Vatandaş ihbarı (belediye modülü, C parçası).
 *
 * <p>Vatandaş yaralı/sahipsiz hayvan görünce foto + konumla ihbar bırakır;
 * sunucu ilçeyi KOORDİNATTAN ters geokodlamayla türetir ve ihbar o ilçenin
 * belediyesinin kuyruğuna düşer.
 *
 * <p><b>Konum neden düz metin olamaz:</b> yönlendirmenin tamamı
 * {@code latitude}/{@code longitude} üzerinden çalışıyor — sunucu ilçeyi
 * koordinattan çıkarıyor. "Nilüfer, Bursa" gibi yazılmış bir metinden ilçe
 * türetilmiyor; koordinatsız ihbar hiçbir belediyeye düşmez. İki alan da
 * arka yüzde zorunlu.
 *
 * <p><b>Gövde biçimi:</b> uç {@code @ModelAttribute} ile bağlanıyor, yani
 * alanlar TEK TEK form alanı olarak gidiyor — "gördüm" bildirimindeki
 * ({@link ./sightings}) tek JSON parçası deseni burada ÇALIŞMAZ. Alan adları
 * {@code AnimalReportCreateRequest} ile birebir aynı olmalı; ayrışırsa
 * doğrulama 400 döner. Bekçisi: {@code reportService.alan-adlari.test.ts}.
 */

/** İhbar türü — BE {@code entity/enums/ReportType} ile birebir. */
export type ReportType = "YARALI" | "SAHIPSIZ" | "DIGER";

/** Kuyruk durumu — BE {@code entity/enums/ReportStatus} ile birebir. */
export type ReportStatus = "YENI" | "ISLEME_ALINDI" | "TAMAMLANDI";

export type AnimalReportCreate = {
  /** Belediyenin geri dönebilmesi için telefon/e-posta. Arka yüzde ZORUNLU. */
  reporterContact: string;
  type: ReportType;
  note?: string;
  latitude: number;
  longitude: number;
};

export type AnimalReport = {
  id: number;
  reporterContact: string | null;
  type: ReportType;
  note: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  /** Ters geokodlama tutmazsa null kalır — o ihbar hiçbir kuyrukta görünmez. */
  city: string | null;
  district: string | null;
  status: ReportStatus;
  createdAt: string;
};

/** Spring {@code Page<T>} sarmalı — kuyruk ucu diziyi doğrudan dönmüyor. */
export type SayfaliCevap<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** 0'dan başlayan sayfa indeksi. */
  number: number;
  size: number;
};

/**
 * POST /api/public/reports — girişsiz erişilebilir; oturum varsa jeton
 * kendiliğinden eklenir ve ihbar kullanıcıya bağlanır.
 */
export function createReport(
  data: AnimalReportCreate,
  photo?: File | null,
): Promise<AnimalReport> {
  const formData = new FormData();
  formData.append("reporterContact", data.reporterContact);
  formData.append("type", data.type);
  formData.append("latitude", String(data.latitude));
  formData.append("longitude", String(data.longitude));
  if (data.note) {
    formData.append("note", data.note);
  }
  if (photo) {
    formData.append("photo", photo);
  }

  return request<AnimalReport>("/api/public/reports", {
    method: "POST",
    body: formData,
  });
}

/**
 * GET /api/municipality/reports (Bearer) — kurumun KENDİ ilçesindeki ihbarlar.
 * İlçe istekten alınmaz, sunucuda oturumdaki kullanıcıdan türetilir.
 */
export function getMunicipalityReports(params?: {
  status?: ReportStatus;
  page?: number;
  size?: number;
}): Promise<SayfaliCevap<AnimalReport>> {
  const sorgu = new URLSearchParams();
  if (params?.status) sorgu.set("status", params.status);
  if (params?.page !== undefined) sorgu.set("page", String(params.page));
  if (params?.size !== undefined) sorgu.set("size", String(params.size));

  const ek = sorgu.toString() ? `?${sorgu.toString()}` : "";
  return request<SayfaliCevap<AnimalReport>>(`/api/municipality/reports${ek}`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * PATCH /api/municipality/reports/{id}/status (Bearer) — yeni durum sorgu
 * parametresi olarak gidiyor, gövdede değil.
 */
export function updateReportStatus(
  id: number,
  status: ReportStatus,
): Promise<AnimalReport> {
  return request<AnimalReport>(
    `/api/municipality/reports/${id}/status?status=${status}`,
    { method: "PATCH", requiresAuth: true },
  );
}
