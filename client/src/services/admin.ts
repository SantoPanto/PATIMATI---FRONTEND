import { request } from "./api";
import type {
  AdComplaintAdminResponse,
  AdResponse,
  AdoptionComplaintAdminResponse,
  ExternalPostAdminResponse,
  Page,
  UserComplaintAdminResponse,
  UserDetailForAdminDTO,
} from "./types";

/**
 * 6. Yönetici (Admin) Paneli Servisleri (/api/admin/*)
 * Tüm admin uç noktaları ROLE_ADMIN yetkisi ve Bearer Token gerektirir.
 */

/**
 * GET /api/admin/users
 */
export function getAdminUsers(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<UserDetailForAdminDTO>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  searchParams.set("_t", String(Date.now()));

  const query = searchParams.toString();
  return request<Page<UserDetailForAdminDTO>>(
    `/api/admin/users${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * PUT /api/admin/users/{userId}/ban
 */
export function banUser(userId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/users/${userId}/ban`, {
    method: "PUT",
    requiresAuth: true,
  });
}

/**
 * PUT /api/admin/users/{userId}/unban
 */
export function unbanUser(userId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/users/${userId}/unban`, {
    method: "PUT",
    requiresAuth: true,
  });
}

/**
 * GET /api/admin/ads
 */
export function getAdminAds(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  searchParams.set("_t", String(Date.now()));

  const query = searchParams.toString();
  return request<Page<AdResponse>>(
    `/api/admin/ads${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * PUT /api/admin/ads/{adId}/suspend
 */
export function suspendAd(adId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/ads/${adId}/suspend`, {
    method: "PUT",
    requiresAuth: true,
  });
}

/**
 * PUT /api/admin/ads/{adId}/unhide
 */
export function unhideAd(adId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/ads/${adId}/unhide`, {
    method: "PUT",
    requiresAuth: true,
  });
}

/**
 * DELETE /api/admin/ads/{adId}
 */
export function deleteAdminAd(adId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/ads/${adId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * GET /api/admin/complaints/ads
 */
export function getAdminAdComplaints(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<AdComplaintAdminResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<AdComplaintAdminResponse>>(
    `/api/admin/complaints/ads${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * GET /api/admin/complaints/users
 */
export function getAdminUserComplaints(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<UserComplaintAdminResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<UserComplaintAdminResponse>>(
    `/api/admin/complaints/users${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * GET /api/admin/complaints/adoptions
 */
export function getAdminAdoptionComplaints(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<AdoptionComplaintAdminResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<AdoptionComplaintAdminResponse>>(
    `/api/admin/complaints/adoptions${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * GET /api/admin/external-posts
 */
export function getAdminExternalPosts(params?: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<Page<ExternalPostAdminResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return request<Page<ExternalPostAdminResponse>>(
    `/api/admin/external-posts${query ? `?${query}` : ""}`,
    {
      method: "GET",
      requiresAuth: true,
      signal: params?.signal,
    },
  );
}

/**
 * DELETE /api/admin/complaints/{complaintId}
 */
export function deleteComplaint(complaintId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/complaints/${complaintId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * POST /api/admin/chats/create-with-user/{userId}
 */
export function createAdminChatRoom(
  userId: number,
): Promise<{ chatId?: number; roomId?: number; id?: number }> {
  return request(`/api/admin/chats/create-with-user/${userId}`, {
    method: "POST",
    requiresAuth: true,
  });
}
