const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type AuthUser = {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  [key: string]: unknown;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AuthResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
  error?: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new Error(
      errorData?.message ||
        errorData?.error ||
        "İşlem sırasında bir hata oluştu.",
    );
  }

  return data as T;
}

export function getStoredToken(): string | null {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
}

export function saveAuthResponse(
  data: AuthResponse,
  rememberMe: boolean = true,
): void {
  const token = data.accessToken || data.token;

  if (!token) {
    throw new Error("Sunucudan giriş anahtarı alınamadı.");
  }

  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem("accessToken");
  otherStorage.removeItem("refreshToken");
  otherStorage.removeItem("user");

  storage.setItem("accessToken", token);

  if (data.refreshToken) {
    storage.setItem("refreshToken", data.refreshToken);
  }

  if (data.user) {
    storage.setItem("user", JSON.stringify(data.user));
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
}

export function login(data: LoginData): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function register(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuthStorage();
    }

    throw new Error(
      data?.message ||
        data?.error ||
        "Kullanıcı bilgileri alınamadı.",
    );
  }

  return data?.user ?? data;
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/change-password`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Mevcut şifreniz yanlış veya oturumunuzun süresi dolmuş.",
      );
    }

    throw new Error(
      responseData?.message ||
        responseData?.error ||
        "Şifre değiştirilemedi.",
    );
  }
}

export async function logoutRequest(): Promise<void> {
  const token = getStoredToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } finally {
    clearAuthStorage();
  }
}

export { API_BASE_URL };