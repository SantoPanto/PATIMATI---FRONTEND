import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  clearAuthStorage,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  logoutRequest,
  normalizeUser,
  saveStoredUser,
} from "../services/auth";
import type { AuthUser } from "../services/auth";
import { ApiError, AUTH_UNAUTHORIZED_EVENT } from "../services/api";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (updatedUser: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialStoredUser(): AuthUser | null {
  if (!getStoredToken()) return null;
  return normalizeUser(getStoredUser());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialStoredUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    const normalized = normalizeUser(updatedUser);
    setUser(normalized);

    if (normalized) {
      saveStoredUser(normalized);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setUser(null);
      setIsAuthLoading(false);
      return null;
    }

    try {
      const currentUser = await getCurrentUser();
      const normalized = normalizeUser(currentUser);

      setUser(normalized);

      if (normalized) {
        saveStoredUser(normalized);
      }

      return normalized;
    } catch (error) {
      console.error("Kullanıcı oturumu doğrulanamadı:", error);

      /*
       * Yalnizca gercek 401 (ApiError, HTTP status 401) oturumu
       * gecersiz kilar. 403/5xx veya network hatasinda (backend
       * kapali, baglanti kopuk) mevcut oturum durumu korunur --
       * aksi halde sunucu gecici olarak ulasilamaz oldugunda
       * kullanici yanlislikla giris ekranina dusuyordu.
       */
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
      }

      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthLoading(false);
    };

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Çıkış isteği başarısız oldu:", error);
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getStoredToken()),
      isAuthLoading,
      refreshUser,
      updateUser,
      logout,
    }),
    [user, isAuthLoading, refreshUser, updateUser, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// AuthProvider ve useAuth aynı modülde tutulduğu için Fast Refresh uyarısını
// yalnızca bu hook dışa aktarımı için kapatıyoruz.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }

  return context;
}
