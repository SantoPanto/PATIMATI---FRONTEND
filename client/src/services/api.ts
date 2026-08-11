import { getStoredToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = false, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    ...((restOptions.body && !(restOptions.body instanceof FormData))
      ? { "Content-Type": "application/json" }
      : {}),
    ...(customHeaders as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (requiresAuth) {
    throw new Error("Bu işlem için giriş yapmalısınız (Token bulunamadı).");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `İşlem sırasında bir hata oluştu (${response.status})`
    );
  }

  return data as T;
}

export { API_BASE_URL };