import { Store } from "lucide-react";
import { Link } from "wouter";

/**
 * Header'daki "Hizmetler" ikonu. Artık üçü arasında seçim yaptıran bir
 * açılır menü DEĞİL -- doğrudan /hizmetler toplu sayfasına götürüyor;
 * Tümü/Veteriner/Petshop/Barınak filtreleri o sayfada, İlanlar
 * sayfasındaki filtre sekmeleriyle aynı desende (ServicesPage.tsx).
 */
export default function ServicesDropdown() {
  return (
    <Link href="/hizmetler" className="header-notification-button" aria-label="Hizmetler" title="Hizmetler">
      <Store size={20} />
    </Link>
  );
}
