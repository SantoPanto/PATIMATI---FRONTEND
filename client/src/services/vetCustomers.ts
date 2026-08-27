import { ApiError, request } from "./api";
import type {
  Pet,
  VetCustomerRequestResponse,
  VetCustomerRequestStatus,
  VetCustomerResponse,
} from "./types";

/**
 * 10. Veteriner Müşteri İlişkisi Servisleri
 */

/**
 * POST /api/vet-customer-requests (Bearer)
 * İstek gönderir/yeniden gönderir (REJECTED durumundaki bir isteği tekrar
 * PENDING'e döndürür).
 */
export function sendVetCustomerRequest(vetUserId: number): Promise<VetCustomerRequestResponse> {
  return request<VetCustomerRequestResponse>("/api/vet-customer-requests", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ vetId: vetUserId }),
  });
}

/**
 * GET /api/vet-customer-requests/me?vetId=X (Bearer)
 * Kayıt hiç yoksa 404 döner -- çağıran bunu `null` olarak yorumlar (buton
 * "İstek Gönder" durumunda kalır).
 */
export async function getMyRequestStatus(
  vetUserId: number,
): Promise<VetCustomerRequestStatus | null> {
  try {
    const response = await request<VetCustomerRequestResponse>(
      `/api/vet-customer-requests/me?vetId=${vetUserId}`,
      { method: "GET", requiresAuth: true },
    );
    return response.status;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * GET /api/vet/customer-requests (Bearer, ROLE_VET)
 */
export function getIncomingRequests(): Promise<VetCustomerRequestResponse[]> {
  return request<VetCustomerRequestResponse[]>("/api/vet/customer-requests", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * POST /api/vet/customer-requests/{id}/accept (Bearer, ROLE_VET)
 */
export function acceptRequest(requestId: number): Promise<VetCustomerRequestResponse> {
  return request<VetCustomerRequestResponse>(`/api/vet/customer-requests/${requestId}/accept`, {
    method: "POST",
    requiresAuth: true,
  });
}

/**
 * POST /api/vet/customer-requests/{id}/reject (Bearer, ROLE_VET)
 */
export function rejectRequest(requestId: number): Promise<VetCustomerRequestResponse> {
  return request<VetCustomerRequestResponse>(`/api/vet/customer-requests/${requestId}/reject`, {
    method: "POST",
    requiresAuth: true,
  });
}

/**
 * GET /api/vet/customers (Bearer, ROLE_VET)
 */
export function getMyCustomers(): Promise<VetCustomerResponse[]> {
  return request<VetCustomerResponse[]>("/api/vet/customers", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * GET /api/vet/customers/{customerId}/pets (Bearer, ROLE_VET)
 * `customerId` = VetCustomerResponse.requesterId.
 */
export function getCustomerPets(customerId: number): Promise<Pet[]> {
  return request<Pet[]>(`/api/vet/customers/${customerId}/pets`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * POST /api/vet/pets/{petId}/treatment-notes (Bearer, ROLE_VET)
 */
export function addTreatmentNote(petId: number, content: string): Promise<void> {
  return request<void>(`/api/vet/pets/${petId}/treatment-notes`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ content }),
  });
}
