import {
  Bell,
  LogOut,
  PawPrint,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { getMyPotentialMatches } from "../services/potentialMatches";

const PENDING_MATCH_STATUSES = new Set(["PENDING", "NOTIFIED", "VIEWED"]);

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [hasPendingMatch, setHasPendingMatch] = useState(false);

  useEffect(() => {
    // Rozet yalnızca aşağıdaki authenticated dalında render edilir, bu
    // yüzden çıkış yapıldığında state'i senkron sıfırlamaya gerek yok.
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    // Tek seferlik, header mount olduğunda — global bir polling/state
    // yönetimi bu kapsam için gereksiz; STOMP/FCM entegrasyonu henüz yok.
    getMyPotentialMatches()
      .then((matches) => {
        if (!cancelled) {
          setHasPendingMatch(
            matches.some((match) => PENDING_MATCH_STATUSES.has(match.status)),
          );
        }
      })
      .catch(() => {
        // Sessizce yut — bildirim noktası ikincil bir göstergedir,
        // başarısız olması header'ın geri kalanını bozmamalı.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }

    return location.startsWith(path);
  };

  return (
    <header className="home-header">
      <div className="page-container home-header__content">
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 sm:mr-3 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-200 shrink-0 shadow-xs"
            aria-label="Yönetim Paneli"
          >
            <ShieldAlert size={18} className="text-blue-600" />
            <span>Admin Panel</span>
          </Link>
        )}

        <Link href="/" className="brand" aria-label="PATIMATI ana sayfa">
          <span className="brand__icon">
            <PawPrint size={24} strokeWidth={2.4} />
          </span>

          <span className="brand__text">
            PATI<span>MATI</span>
          </span>
        </Link>

        <nav className="desktop-navigation" aria-label="Ana navigasyon">
          <Link
            href="/"
            className={
              isActive("/")
                ? "navigation-link active"
                : "navigation-link"
            }
          >
            Ana Sayfa
          </Link>

          <Link
            href="/listings"
            className={
              isActive("/listings")
                ? "navigation-link active"
                : "navigation-link"
            }
          >
            İlanlar
          </Link>

          <Link
            href="/map"
            className={
              isActive("/map")
                ? "navigation-link active"
                : "navigation-link"
            }
          >
            Harita
          </Link>

          <Link
            href="/adoption"
            className={
              isActive("/adoption")
                ? "navigation-link active"
                : "navigation-link"
            }
          >
            Sahiplendirme
          </Link>
        </nav>

        <div className="home-header__actions">
          {isAuthenticated ? (
            <>
              <button
                className="header-notification-button"
                type="button"
                aria-label="Bildirimleri görüntüle"
                onClick={() => navigate("/notifications")}
              >
                <Bell size={20} />
                {hasPendingMatch && <span className="notification-dot" />}
              </button>

              <Link
                href="/profile"
                className="header-profile-icon"
                aria-label="Profili görüntüle"
              >
                <UserRound size={22} strokeWidth={2} />
              </Link>

              <button
                type="button"
                className="header-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Çıkış Yap</span>
              </button>
            </>
          ) : (
            <div className="auth-actions">
              <Link href="/login" className="header-login-button">
                Giriş Yap
              </Link>

              <Link href="/register" className="header-register-button">
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}