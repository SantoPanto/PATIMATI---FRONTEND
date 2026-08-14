import { request } from "./api";
import type {
  AdComplaintRequestDTO,
  ComplaintReason,
  ComplaintResponse,
  UserComplaintRequestDTO,
} from "./types";

/**
 * 5. Şikayet İşlemleri (/api/complaints ve /api/adoptions/{adId}/complaints)
 */

/**
 * POST /api/complaints/user (Bearer)
 * UserComplaintRequestDTO: { reportedUserId: Long, reason: Enum, description: String }
 */
export function createUserComplaint(
  data: UserComplaintRequestDTO,
): Promise<ComplaintResponse> {
  return request<ComplaintResponse>("/api/complaints/user", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/complaints/ad (Bearer)
 * AdComplaintRequestDTO: { reportedAdId: Long, reason: Enum, description: String }
 */
export function createAdComplaint(
  data: AdComplaintRequestDTO,
): Promise<ComplaintResponse> {
  return request<ComplaintResponse>("/api/complaints/ad", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/adoptions/{adId}/complaints (Bearer)
 * Path: adId: Long
 * Body: { reason: Enum, description: String }
 */
export function createAdoptionComplaint(
  adId: number,
  data: { reason: ComplaintReason; description: string },
): Promise<ComplaintResponse> {
  return request<ComplaintResponse>(`/api/adoptions/${adId}/complaints`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      reportedAdId: adId,
      reason: data.reason,
      description: data.description,
    }),
  });
}
