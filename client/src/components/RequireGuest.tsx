import { useEffect, type ComponentType } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

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
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-950"
        role="status"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Sayfa hazırlanıyor...
        </p>
      </div>
    );
  }

  return <GuestComponent />;
}
