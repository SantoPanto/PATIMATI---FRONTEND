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
  logoutRequest,
  normalizeUser,
} from "../services/auth";
import type { AuthUser } from "../services/auth";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialStoredUser(): AuthUser | null {
  try {
    const storedUserJson =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserJson) {
      const parsed = JSON.parse(storedUserJson);
      return normalizeUser(parsed);
    }
  } catch {
    // Graceful fallback on JSON parse error
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialStoredUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    const normalized = normalizeUser(updatedUser);
    setUser(normalized);

    const isLocalStorage = Boolean(
      localStorage.getItem("accessToken") || localStorage.getItem("token"),
    );
    const storage = isLocalStorage ? localStorage : sessionStorage;

    if (normalized) {
      storage.setItem("user", JSON.stringify(normalized));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setUser(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      const normalized = normalizeUser(currentUser);

      setUser(normalized);

      const storage =
        localStorage.getItem("accessToken") || localStorage.getItem("token")
          ? localStorage
          : sessionStorage;

      if (normalized) {
        storage.setItem("user", JSON.stringify(normalized));
      }
    } catch (error) {
      console.error("Kullanıcı oturumu doğrulanamadı:", error);

      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        clearAuthStorage();
        setUser(null);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

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
      isAuthenticated: Boolean(user),
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }

  return context;
}