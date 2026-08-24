import { Heart, Home, List, Map, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

/**
 * Mobil alt gezinme çubuğu (DESIGN_SYSTEM.md "Bottom Navigation" bölümü:
 * mobilde kullanılır, ikon 24px, aktif sekme Primary, pasif Text Muted,
 * 3-5 eleman).
 *
 * Neden var: masaüstü menüsü (.desktop-navigation) 1023px altında
 * gizleniyor ve yerine HİÇBİR gezinme kalmıyordu — 22.08 canlı ölçümü:
 * 390px'te görünür menü linki 0. Bu çubuk aynı kırılımda görünür olur;
 * iki menünün eşiği App.css'te aynı media query değerindedir (1023px).
 *
 * Auth ekranlarında çizilmez: onlar tam ekran tek işlik akışlar, gezinme
 * çubuğu akışın dışına çağırır.
 */

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth-redirect",
];

const TABS = [
  { href: "/", label: "Ana Sayfa", Icon: Home },
  { href: "/listings", label: "İlanlar", Icon: List },
  { href: "/map", label: "Harita", Icon: Map },
  { href: "/adoption", label: "Sahiplendirme", Icon: Heart },
  // 22.08 mobil taraması: Mesajlar'a ne header'dan ne bu çubuktan
  // ulaşılabiliyordu — tek yol Profil→Mesajlarım kartıydı. Tasarım sınırı
  // 5 eleman (yukarıdaki DESIGN_SYSTEM notu), bu beşincisi.
  { href: "/chat", label: "Mesajlar", Icon: MessageCircle },
];

export default function BottomNav() {
  const [location] = useLocation();

  const hidden = AUTH_ROUTES.some((route) => location.startsWith(route));

  // Sayfanın son satırı sabit çubuğun altında kalmasın: çubuk çizildiği
  // sürece gövdeye pay bırakılır. Sınıf hep eklenir ama padding yalnız
  // çubuğun görünür olduğu dar-ekran media query'sinde uygulanır.
  useEffect(() => {
    if (hidden) return;

    document.body.classList.add("has-bottom-nav");
    return () => {
      document.body.classList.remove("has-bottom-nav");
    };
  }, [hidden]);

  if (hidden) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }

    return location.startsWith(path);
  };

  return (
    <nav className="bottom-navigation" aria-label="Mobil gezinme">
      {TABS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={
            isActive(href)
              ? "bottom-navigation__link active"
              : "bottom-navigation__link"
          }
          aria-current={isActive(href) ? "page" : undefined}
        >
          <Icon size={24} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
