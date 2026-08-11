import { API_BASE_URL, request } from "./api";
import type {
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserResponseDTO,
} from "./types";

export type {
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserResponseDTO,
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Legacy compatibility type
export type UpdateProfileData = UpdateProfileRequest;

export function normalizeUser(
  user: UserResponseDTO | AuthUser | null | undefined,
): AuthUser | null {
  if (!user) return null;
  const phone =
    user.phone ||
    (typeof user.phoneNumber === "string" ? user.phoneNumber : "");

  return {
    ...user,
    id: user.uid ?? user.id,
    phone,
    phoneNumber: phone,
    latitude:
      typeof user.latitude === "number"
        ? user.latitude
        : typeof user.latitude === "string"
        ? parseFloat(user.latitude)
        : null,
    longitude:
      typeof user.longitude === "number"
        ? user.longitude
        : typeof user.longitude === "string"
        ? parseFloat(user.longitude)
        : null,
  };
}

export function getStoredToken(): string | null {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

export function saveAuthResponse(
  data: AuthResponse,
  rememberMe: boolean = true,
): void {
  const token = data.token || data.accessToken;

  if (!token) {
    throw new Error("Sunucudan giriş anahtarı alınamadı.");
  }

  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem("accessToken");
  otherStorage.removeItem("token");
  otherStorage.removeItem("refreshToken");
  otherStorage.removeItem("user");

  storage.setItem("accessToken", token);
  storage.setItem("token", token);

  if (data.refreshToken) {
    storage.setItem("refreshToken", data.refreshToken);
  }

  if (data.user) {
    storage.setItem("user", JSON.stringify(normalizeUser(data.user)));
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
}

// -------------------------------------------------------------
// 1. Kullanıcı ve Kimlik Doğrulama Servisleri (/api/auth)
// -------------------------------------------------------------

/**
 * POST /api/auth/register
 */
export function register(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/auth/login
 */
export function login(data: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/auth/google
 */
export function googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET /api/auth/me (Bearer)
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  try {
    const data = await request<UserResponseDTO | { user: UserResponseDTO }>(
      "/api/auth/me",
      {
        method: "GET",
        requiresAuth: true,
      },
    );

    const rawUser = "user" in data ? data.user : data;
    return normalizeUser(rawUser) || rawUser;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("403"))
    ) {
      clearAuthStorage();
    }
    throw error;
  }
}

/**
 * PUT /api/auth/profile (Bearer)
 * Request Body: { firstName, lastName, email, phone, city, latitude, longitude }
 * Response: { message: string, user: UserResponseDTO }
 */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<AuthUser> {
  const responseData = await request<{ message: string; user: UserResponseDTO }>(
    "/api/auth/profile",
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    },
  );

  const updatedUser = normalizeUser(responseData.user) || responseData.user;

  const isLocalStorage = Boolean(
    localStorage.getItem("accessToken") || localStorage.getItem("token"),
  );
  const storage = isLocalStorage ? localStorage : sessionStorage;
  const currentUserJson = storage.getItem("user");

  if (currentUserJson) {
    try {
      const existingUser = JSON.parse(currentUserJson);
      storage.setItem(
        "user",
        JSON.stringify({ ...existingUser, ...updatedUser }),
      );
    } catch {
      storage.setItem("user", JSON.stringify(updatedUser));
    }
  } else {
    storage.setItem("user", JSON.stringify(updatedUser));
  }

  return updatedUser;
}

/**
 * POST /api/auth/logout (Bearer)
 */
export async function logoutRequest(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await request<{ success: boolean; message: string }>(
      "/api/auth/logout",
      {
        method: "POST",
        requiresAuth: true,
      },
    );
    return res;
  } finally {
    clearAuthStorage();
  }
}

/**
 * POST /api/auth/forgot-password
 */
export function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/auth/reset-password
 */
export function resetPassword(
  data: ResetPasswordRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET /api/auth/userlist (Bearer)
 */
export function getUserList(): Promise<UserResponseDTO[]> {
  return request<UserResponseDTO[]>("/api/auth/userlist", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * Change password utility (Auth required)
 */
export function changePassword(data: ChangePasswordRequest): Promise<void> {
  return request<void>("/api/auth/change-password", {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export { API_BASE_URL };