import { ApiError, request } from "./api";
import type {
  BusinessApplicationCreatePayload,
  BusinessApplicationResponse,
  BusinessApplicationStatus,
  BusinessType,
  Page,
} from "./types";

/**
 * İşletme sahibi olma başvuruları -- kullanıcı tarafı (herhangi bir giriş
 * yapmış kullanıcı) ve admin tarafı (inceleme/onay/red).
 */

/**
 * POST /api/business-applications (Bearer, multipart/form-data)
 */
export function submitBusinessApplication(
  payload: BusinessApplicationCreatePayload,
): Promise<BusinessApplicationResponse> {
  const { photo, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }

  return request<BusinessApplicationResponse>("/api/business-applications", {
    method: "POST",
    requiresAuth: true,
    body: formData,
  });
}

/**
 * GET /api/business-applications/mine (Bearer)
 * Kullanıcı hiç başvurmadıysa 404 döner -- çağıran bunu `null` olarak yorumlar.
 */
export async function getMyBusinessApplication(): Promise<BusinessApplicationResponse | null> {
  try {
    return await request<BusinessApplicationResponse>("/api/business-applications/mine", {
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
 * GET /api/admin/business-applications (Bearer, ROLE_ADMIN)
 */
export function getBusinessApplications(params?: {
  status?: BusinessApplicationStatus;
  type?: BusinessType;
  page?: number;
  size?: number;
}): Promise<Page<BusinessApplicationResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<BusinessApplicationResponse>>(
    `/api/admin/business-applications${query ? `?${query}` : ""}`,
    { method: "GET", requiresAuth: true },
  );
}

/**
 * PATCH /api/admin/business-applications/{id}/approve (Bearer, ROLE_ADMIN)
 */
export function approveBusinessApplication(id: number): Promise<BusinessApplicationResponse> {
  return request<BusinessApplicationResponse>(`/api/admin/business-applications/${id}/approve`, {
    method: "PATCH",
    requiresAuth: true,
  });
}

/**
 * PATCH /api/admin/business-applications/{id}/reject (Bearer, ROLE_ADMIN)
 */
export function rejectBusinessApplication(
  id: number,
  reason: string,
): Promise<BusinessApplicationResponse> {
  return request<BusinessApplicationResponse>(`/api/admin/business-applications/${id}/reject`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ reason }),
  });
}
