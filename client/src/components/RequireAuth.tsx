import type { ComponentType } from "react";
import { useCallback, useEffect } from "react";
import { useLocation } from "wouter";

import { useAuth } from "../contexts/AuthContext";
import { sanitizeRedirectPath } from "../services/auth";
import type { Role } from "../services/types";
import AuthRequiredModal from "./Modal";

/**
 * KURAL (madde 28) - korumali rotalarin giris davranisi:
 *
 *   mode="modal"     Icerikten AKSIYON alarak gelinen sayfa. Kullanici bir
 *                    ilana bakarken "Ilan Ver" / "Mesaj Gonder" gibi bir sey
 *                    yapmaya calisiyordur; sayfadan koparilmaz, giris penceresi
 *                    ustte acilir.
 *   mode="redirect"  Kullanicinin DOGRUDAN kendi hesabina gittigi sayfa
 *                    (profil, ayarlar, bildirimler, sikayetlerim, yonetim).
 *                    Icerik yok, sayfada tutmanin anlami yok; /login'e gider.
 *
 * `mode` bilerek ZORUNLU: varsayilani olsaydi yeni bir korumali rota kurali
 * sessizce ihlal edebilirdi. Her rota tercihini yazili olarak belirtir.
 *
 * Iki yol da donus adresini tasir: modaldaki giris dugmesi de `goToLogin`
 * cagirir, o da /login?redirect=<sayfa> kurar (LoginPage bunu okuyup geri doner).
 */
type RequireAuthProps = {
  component: ComponentType;
  /** Yalniz mode="modal" icin: modal kapatilinca nereye donulecek. */
  fallbackPath?: string;
  mode: "modal" | "redirect";
  /**
   * Verilirse giris yapmis olmak YETMEZ, kullanicinin rolu de bu olmalidir.
   * Rolu tutmayan kullanici /unauthorized sayfasina gonderilir.
   */
  requiredRole?: Role;
};

export default function RequireAuth({
  component: ProtectedComponent,
  fallbackPath = "/",
  mode,
  requiredRole,
}: RequireAuthProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isAuthLoading } = useAuth();

  const rolUyuyor = !requiredRole || user?.role === requiredRole;

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

  useEffect(() => {
    // Giris yapmis ama rolu tutmuyor: giris sayfasina degil, "yetkiniz yok"a.
    if (!isAuthLoading && isAuthenticated && !rolUyuyor) {
      navigate("/unauthorized", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate, rolUyuyor]);

  if (isAuthLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400"
        role="status"
      >
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (isAuthenticated) {
    if (!rolUyuyor) {
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400"
          role="status"
        >
          Yetki kontrol ediliyor...
        </div>
      );
    }
    return <ProtectedComponent />;
  }

  if (mode === "redirect") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400"
        role="status"
      >
        Giriş sayfasına yönlendiriliyor...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-hidden="true" />
      <AuthRequiredModal
        isOpen
        onClose={closeModal}
        onLogin={goToLogin}
      />
    </>
  );
}
