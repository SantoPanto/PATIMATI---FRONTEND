import { useEffect, type ComponentType } from "react";
import { useLocation } from "wouter";

import { useAuth } from "../contexts/AuthContext";

export default function RequireGuest({ component: GuestComponent }: { component: ComponentType }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  if (isAuthLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500" role="status">
        Sayfa hazırlanıyor...
      </div>
    );
  }

  return <GuestComponent />;
}
