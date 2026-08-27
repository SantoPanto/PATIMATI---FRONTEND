import { Link, useLocation } from "wouter";

/**
 * Header'daki "Hizmetler" bağlantısı -- diğer nav öğeleriyle (İlanlar/
 * Harita/Ben neyim?/İhbar Et) aynı gruba, onların sağına alındı (bkz.
 * Header.tsx). Artık üçü arasında seçim yaptıran bir açılır menü DEĞİL --
 * doğrudan /hizmetler toplu sayfasına götürüyor; Tümü/Veteriner/Petshop/
 * Barınak filtreleri o sayfada, İlanlar sayfasındaki filtre sekmeleriyle
 * aynı desende (ServicesPage.tsx).
 */
export default function ServicesDropdown() {
  const [location] = useLocation();
  const isActive = location.startsWith("/hizmetler");

  return (
    <Link
      href="/hizmetler"
      className={isActive ? "navigation-link active" : "navigation-link"}
    >
      Hizmetler
    </Link>
  );
}
