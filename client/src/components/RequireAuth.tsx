import type { ComponentType } from "react";
import { useCallback, useEffect } from "react";
import { useLocation } from "wouter";

import { useAuth } from "../contexts/AuthContext";
import { sanitizeRedirectPath } from "../services/auth";
import AuthRequiredModal from "./Modal";

type RequireAuthProps = {
  component: ComponentType;
  fallbackPath?: string;
  mode?: "modal" | "redirect";
};

export default function RequireAuth({
  component: ProtectedComponent,
  fallbackPath = "/",
  mode = "modal",
}: RequireAuthProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isAuthLoading } = useAuth();

  const closeModal = useCallback(() => {
    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, navigate]);

  const goToLogin = useCallback(() => {
    const requestedPath = sanitizeRedirectPath(
      `${window.location.pathname}${window.location.search}`,
    );
    navigate(
      `/login?redirect=${encodeURIComponent(requestedPath)}`,
      { replace: true },
    );
  }, [navigate]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && mode === "redirect") {
      goToLogin();
    }
  }, [goToLogin, isAuthLoading, isAuthenticated, mode]);

  if (isAuthLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500"
        role="status"
      >
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (isAuthenticated) {
    return <ProtectedComponent />;
  }

  if (mode === "redirect") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500"
        role="status"
      >
        Giriş sayfasına yönlendiriliyor...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50" aria-hidden="true" />
      <AuthRequiredModal
        isOpen
        onClose={closeModal}
        onLogin={goToLogin}
      />
    </>
  );
}
