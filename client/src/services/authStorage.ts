import type { AuthUser } from "./types";

const ACCESS_TOKEN_KEY =
  "accessToken";

const LEGACY_TOKEN_KEY =
  "token";

const REFRESH_TOKEN_KEY =
  "refreshToken";

const USER_KEY =
  "user";

const GUEST_MODE_KEY =
  "userMode";

const OAUTH_REDIRECT_KEY =
  "patimati.oauth.redirect";

const OAUTH_REMEMBER_KEY =
  "patimati.oauth.remember";

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

function clearStorage(
  storage: Storage,
): void {
  storage.removeItem(
    ACCESS_TOKEN_KEY,
  );

  storage.removeItem(
    LEGACY_TOKEN_KEY,
  );

  storage.removeItem(
    REFRESH_TOKEN_KEY,
  );

  storage.removeItem(
    USER_KEY,
  );
}

function getTokenFrom(
  storage: Storage,
): string | null {
  return (
    storage.getItem(
      ACCESS_TOKEN_KEY,
    ) ||
    storage.getItem(
      LEGACY_TOKEN_KEY,
    )
  );
}

function getActiveStorage():
  Storage | null {
  if (
    getTokenFrom(localStorage)
  ) {
    return localStorage;
  }

  if (
    getTokenFrom(sessionStorage)
  ) {
    return sessionStorage;
  }

  return null;
}

export function getStoredToken():
  string | null {
  return (
    getTokenFrom(localStorage) ||
    getTokenFrom(sessionStorage)
  );
}

export function saveAuthTokens(
  tokens: AuthTokens,
  rememberMe: boolean,
): void {
  clearStorage(localStorage);
  clearStorage(sessionStorage);

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    ACCESS_TOKEN_KEY,
    tokens.accessToken,
  );

  if (tokens.refreshToken) {
    storage.setItem(
      REFRESH_TOKEN_KEY,
      tokens.refreshToken,
    );
  }

  localStorage.removeItem(
    GUEST_MODE_KEY,
  );
}

export function getStoredUser():
  AuthUser | null {
  const storage =
    getActiveStorage();

  const storedUser =
    storage?.getItem(USER_KEY);

  if (
    !storage ||
    !storedUser
  ) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser,
    ) as AuthUser;
  } catch {
    storage.removeItem(USER_KEY);
    return null;
  }
}

export function saveStoredUser(
  user: AuthUser,
): void {
  const storage =
    getActiveStorage();

  if (storage) {
    storage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  }
}

export function clearAuthStorage():
  void {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
}

export function sanitizeRedirectPath(
  value:
    | string
    | null
    | undefined,
  fallback = "/",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  try {
    const parsedUrl =
      new URL(
        value,
        window.location.origin,
      );

    if (
      parsedUrl.origin !==
      window.location.origin
    ) {
      return fallback;
    }

    return (
      `${parsedUrl.pathname}` +
      `${parsedUrl.search}` +
      `${parsedUrl.hash}`
    );
  } catch {
    return fallback;
  }
}

export function saveOAuthIntent(
  redirectPath: string,
  rememberMe: boolean,
): void {
  sessionStorage.setItem(
    OAUTH_REDIRECT_KEY,
    sanitizeRedirectPath(
      redirectPath,
    ),
  );

  sessionStorage.setItem(
    OAUTH_REMEMBER_KEY,
    String(rememberMe),
  );
}

export function consumeOAuthIntent(
  fallbackPath = "/",
): {
  redirectPath: string;
  rememberMe: boolean;
} {
  const redirectPath =
    sanitizeRedirectPath(
      sessionStorage.getItem(
        OAUTH_REDIRECT_KEY,
      ),
      fallbackPath,
    );

  const rememberMe =
    sessionStorage.getItem(
      OAUTH_REMEMBER_KEY,
    ) === "true";

  sessionStorage.removeItem(
    OAUTH_REDIRECT_KEY,
  );

  sessionStorage.removeItem(
    OAUTH_REMEMBER_KEY,
  );

  return {
    redirectPath,
    rememberMe,
  };
}