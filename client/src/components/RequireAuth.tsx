import type { ComponentType } from "react";
import { useCallback } from "react";
import { useLocation } from "wouter";

import { useAuth } from "../contexts/AuthContext";
import { sanitizeRedirectPath } from "../services/auth";
import AuthRequiredModal from "./Modal";

type RequireAuthProps = {
  component: ComponentType;
  fallbackPath?: string;
};

export default function RequireAuth({
  component: ProtectedComponent,
  fallbackPath = "/",
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
