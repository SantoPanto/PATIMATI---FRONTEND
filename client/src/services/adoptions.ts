import { API_BASE_URL, request } from "./api";
import { getStoredToken } from "./auth";
import type {
  AdResponse,
  AdoptionAdCreateRequest,
  AdoptionAdUpdateRequest,
  Page,
  ResolveAdoptionAdRequest,
} from "./types";

/**
 * 3. Sahiplendirme İlanları (/api/adoptions & /api/public/adoptions)
 */

/**
 * POST /api/adoptions (Bearer)
 * multipart/form-data:
 * - ad: AdoptionAdCreateRequest (JSON)
 * - images: List<MultipartFile> (ZORUNLU)
 */
export async function createAdoptionAd(
  ad: AdoptionAdCreateRequest,
  images: File[],
): Promise<AdResponse> {
  const token = getStoredToken();
  if (!token) {
    throw new Error(
      "Oturum açılmamış. Sahiplendirme ilanı eklemek için giriş yapmalısınız.",
    );
  }

  if (!images || images.length === 0) {
    throw new Error("Sahiplendirme ilanı için en az bir fotoğraf zorunludur.");
  }

  const formData = new FormData();
  formData.append(
    "ad",
    new Blob([JSON.stringify(ad)], { type: "application/json" }),
  );

  images.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${API_BASE_URL}/api/adoptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Sahiplendirme ilanı oluşturulurken bir hata oluştu.",
    );
  }

  return data as AdResponse;
}

/**
 * PUT /api/adoptions/{adId} (Bearer)
 * application/json AdoptionAdUpdateRequest
 */
export function updateAdoptionAd(
  adId: number,
  data: AdoptionAdUpdateRequest,
): Promise<AdResponse> {
  return request<AdResponse>(`/api/adoptions/${adId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

/**
 * DELETE /api/adoptions/{adId} (Bearer)
 */
export function deleteAdoptionAd(
  adId: number,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/adoptions/${adId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * PUT /api/adoptions/{adId}/resolve-adopted (Bearer)
 * ResolveAdoptionAdRequest: { adopterId?: number }
 */
export function resolveAdoptionAdopted(
  adId: number,
  requestData?: ResolveAdoptionAdRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/api/adoptions/${adId}/resolve-adopted`,
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(requestData || {}),
    },
  );
}

/**
 * GET /api/public/adoptions (No Auth)
 * Query: page, size
 */
export function getPublicAdoptions(params?: {
  page?: number;
  size?: number;
}): Promise<Page<AdResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const endpoint = `/api/public/adoptions${query ? `?${query}` : ""}`;

  return request<Page<AdResponse>>(endpoint, {
    method: "GET",
  });
}
