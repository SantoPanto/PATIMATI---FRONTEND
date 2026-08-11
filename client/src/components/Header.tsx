import {
  Bell,
  ChevronDown,
  LogOut,
  PawPrint,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const userDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Kullanıcı";

  const userInitials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((value) => value?.charAt(0).toLocaleUpperCase("tr-TR"))
      .join("")
      .slice(0, 2) ||
    user?.email?.charAt(0).toLocaleUpperCase("tr-TR") ||
    "P";

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
            className={isActive("/") ? "navigation-link active" : "navigation-link"}
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
              isActive("/map") ? "navigation-link active" : "navigation-link"
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
                <span className="notification-dot" />
              </button>

              <Link href="/profile" className="header-profile">
                <span className="header-profile__avatar">
                  {userInitials ? (
                    userInitials
                  ) : (
                    <UserRound size={19} />
                  )}
                </span>

                <span className="header-profile__content">
                  <small>Hoş geldin</small>
                  <strong>{userDisplayName}</strong>
                </span>

                <ChevronDown
                  className="header-profile__chevron"
                  size={17}
                  aria-hidden="true"
                />
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