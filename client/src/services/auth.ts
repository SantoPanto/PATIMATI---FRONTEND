import {
  ApiError,
  API_BASE_URL,
  request,
} from "./api";

import {
  clearAuthStorage,
  consumeOAuthIntent,
  getStoredToken,
  saveAuthTokens,
  saveOAuthIntent,
  saveStoredUser,
} from "./authStorage";

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

export {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  sanitizeRedirectPath,
  saveStoredUser,
} from "./authStorage";

export function normalizeUser(
  user: UserResponseDTO | AuthUser | null | undefined,
): AuthUser | null {
  if (!user) {
    return null;
  }

  const phone =
    user.phone ||
    (
      typeof user.phoneNumber === "string"
        ? user.phoneNumber
        : ""
    );

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

export function saveAuthResponse(
  data: AuthResponse,
  rememberMe: boolean = true,
): void {
  const token =
    data.token || data.accessToken;

  if (!token) {
    throw new Error(
      "Sunucudan giriş anahtarı alınamadı.",
    );
  }

  saveAuthTokens(
    {
      accessToken: token,
      refreshToken: data.refreshToken,
    },
    rememberMe,
  );

  if (data.user) {
    const normalizedUser =
      normalizeUser(data.user);

    if (normalizedUser) {
      saveStoredUser(normalizedUser);
    }
  }
}

type GoogleOAuthOptions = {
  redirectPath?: string;
  rememberMe?: boolean;
};

export type GoogleOAuthCallbackResult =
  | {
      status: "none";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "success";
      redirectPath: string;
    };

export function startGoogleOAuth({
  redirectPath = "/",
  rememberMe = false,
}: GoogleOAuthOptions = {}): void {
  saveOAuthIntent(
    redirectPath,
    rememberMe,
  );

  window.location.assign(
    `${API_BASE_URL}/oauth2/authorization/google`,
  );
}

export function completeGoogleOAuthCallback():
  GoogleOAuthCallbackResult {
  const currentUrl =
    new URL(window.location.href);

  const token =
    currentUrl.searchParams.get("token");

  const error =
    currentUrl.searchParams.get("error");

  if (!token && !error) {
    return {
      status: "none",
    };
  }

  currentUrl.searchParams.delete("token");
  currentUrl.searchParams.delete("error");

  window.history.replaceState(
    {},
    document.title,
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
  );

  const {
    redirectPath,
    rememberMe,
  } = consumeOAuthIntent("/");

  if (error) {
    console.error("Google OAuth hatası:", error);

    return {
      status: "error",
      message:
        "Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.",
    };
  }

  if (!token) {
    return {
      status: "error",
      message:
        "Google giriş anahtarı alınamadı.",
    };
  }

  saveAuthTokens(
    {
      accessToken: token,
    },
    rememberMe,
  );

  return {
    status: "success",
    redirectPath,
  };
}

export function register(
  data: RegisterRequest,
): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function login(
  data: LoginRequest,
): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function googleAuth(
  data: GoogleAuthRequest,
): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/google",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getCurrentUser():
  Promise<AuthUser> {
  const token = getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı.",
    );
  }

  try {
    const data = await request<
      UserResponseDTO |
      { user: UserResponseDTO }
    >(
      "/api/auth/me",
      {
        method: "GET",
        requiresAuth: true,
      },
    );

    const rawUser =
      "user" in data
        ? data.user
        : data;

    return (
      normalizeUser(rawUser) ||
      rawUser
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401
    ) {
      /*
       * Yalnizca gercek 401 (oturum gecersiz) durumunda saklanan
       * oturumu temizle. 403 bir yetki sorunudur, oturumun
       * gecersiz oldugu anlamina gelmez; 5xx/network hatalarinda
       * da kullanici yanlislikla cikis yapilmis sayilmamali.
       */
      clearAuthStorage();
    }

    throw error;
  }
}

export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<AuthUser> {
  const responseData = await request<{
    message: string;
    user: UserResponseDTO;
  }>(
    "/api/auth/profile",
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    },
  );

  const updatedUser =
    normalizeUser(responseData.user) ||
    responseData.user;

  saveStoredUser(updatedUser);

  return updatedUser;
}

export async function logoutRequest():
  Promise<{
    success: boolean;
    message: string;
  }> {
  try {
    return await request<{
      success: boolean;
      message: string;
    }>(
      "/api/auth/logout",
      {
        method: "POST",
        requiresAuth: true,
      },
    );
  } finally {
    clearAuthStorage();
  }
}

export function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function resetPassword(
  data: ResetPasswordRequest,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/api/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function getUserList():
  Promise<UserResponseDTO[]> {
  return request<UserResponseDTO[]>(
    "/api/auth/userlist",
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}

export function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  return request<void>(
    "/api/auth/change-password",
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    },
  );
}

export { API_BASE_URL };