import {
  clearAuthStorage,
  getStoredToken,
} from "./authStorage";
import type { ComplaintResponse, MatchResponseDTO, UserComplaintRequestDTO } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

export const AUTH_UNAUTHORIZED_EVENT =
  "patimati:auth-unauthorized";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getErrorMessage(
  data: unknown,
  status: number,
): string {
  if (data && typeof data === "object") {
    const errorData =
      data as Record<string, unknown>;

    const candidates = [
      errorData.message,
      errorData.detail,
      errorData.error,
      errorData.title,
    ];

    const message = candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" &&
        candidate.trim().length > 0,
    );

    if (message) {
      return message;
    }
  }

  return `İşlem sırasında bir hata oluştu (${status})`;
}

function notifyUnauthorized(): void {
  clearAuthStorage();

  window.dispatchEvent(
    new Event(AUTH_UNAUTHORIZED_EVENT),
  );
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    requiresAuth = false,
    headers: customHeaders,
    ...restOptions
  } = options;

  const headers = new Headers(customHeaders);

  if (
    restOptions.body &&
    !(restOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const token = getStoredToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  } else if (requiresAuth) {
    throw new ApiError(
      "Bu işlem için giriş yapmalısınız.",
      401,
      null,
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...restOptions,
        headers,
      },
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Kasıtlı iptal (AbortController.abort()) -- gerçek bir ağ hatası
      // değil, ApiError'a çevrilmeden olduğu gibi fırlatılmalı ki çağıran
      // taraf (ör. bir useEffect cleanup'ı) bunu kullanıcıya hata olarak
      // göstermesin.
      throw err;
    }
    // fetch() burada çıplak bir TypeError fırlatır (bağlantı koptu, DNS
    // çözülemedi, CORS engellendi vb.). Çağıranların çoğu ApiError
    // bekliyor; aynı biçime çeviriyoruz.
    throw new ApiError(
      "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      0,
      null,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
    }

    throw new ApiError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return data as T;
}

/**
 * POST /api/complaints/user (Bearer)
 * Report a user for inappropriate behavior
 */
export function reportUser(
  payload: UserComplaintRequestDTO,
): Promise<ComplaintResponse> {
  return request<ComplaintResponse>("/api/complaints/user", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/matches/my-matches (Bearer)
 * Fetch matches for the authenticated user's ads
 */
export function getMyMatches(): Promise<MatchResponseDTO[]> {
  return request<MatchResponseDTO[]>("/api/matches/my-matches", {
    method: "GET",
    requiresAuth: true,
  });
}

export { API_BASE_URL };