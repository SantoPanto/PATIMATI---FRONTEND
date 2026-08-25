import {
  Bell,
  LogOut,
  MessageCircle,
  Moon,
  PawPrint,
  ShieldAlert,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getMyPotentialMatches } from "../services/potentialMatches";
import {
  getNotificationSnapshot,
  subscribeToNotifications,
} from "../services/notifications";

const PENDING_MATCH_STATUSES = new Set(["PENDING", "NOTIFIED", "VIEWED"]);

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const notifications = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationSnapshot,
  );
  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.read,
  );

  const [hasPendingMatch, setHasPendingMatch] = useState(false);

  useEffect(() => {
    // Rozet yalnızca aşağıdaki authenticated dalında render edilir, bu
    // yüzden çıkış yapıldığında state'i senkron sıfırlamaya gerek yok.
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    // Tek seferlik, header mount olduğunda — global bir polling/state
    // yönetimi bu kapsam için gereksiz. Bu, canlı bildirim mağazasının
    // (yukarıdaki useSyncExternalStore) KAPSAMADIĞI durumu kapatır:
    // oturum başlamadan ÖNCE zaten var olan, ön planda hiç görülmemiş
    // olası eşleşmeler -- mağaza yalnızca uygulama açıkken gelen canlı
    // FCM push'larını biriktirir, geçmişi geriye dönük çekmez.
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
    <header className="home-header sticky top-0 z-[1050] w-full">
      <div className="page-container home-header__content">
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 sm:mr-3 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-200 shrink-0 shadow-xs dark:text-blue-400 dark:hover:text-blue-300 dark:bg-blue-500/10 dark:hover:bg-blue-500/15 dark:border-blue-500/20"
            aria-label="Yönetim Paneli"
          >
            <ShieldAlert size={18} className="text-blue-600 dark:text-blue-400" />
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

          <Link
            href="/ben-neyim"
            className={
              isActive("/ben-neyim")
                ? "navigation-link active"
                : "navigation-link"
            }
          >
            Ben neyim?
          </Link>
        </nav>

        <div className="home-header__actions">
          <button
            className="header-notification-button"
            type="button"
            aria-label={
              theme === "dark"
                ? "Aydınlık temaya geç"
                : "Karanlık temaya geç"
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <>
              <button
                className="header-notification-button"
                type="button"
                aria-label="Bildirimleri görüntüle"
                onClick={() => navigate("/notifications")}
              >
                <Bell size={20} />
                {(hasUnreadNotifications || hasPendingMatch) && (
                  <span className="notification-dot" />
                )}
              </button>

              <button
                className="header-notification-button"
                type="button"
                aria-label="Mesajları görüntüle"
                onClick={() => navigate("/chat")}
              >
                <MessageCircle size={20} />
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