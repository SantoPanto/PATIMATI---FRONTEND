import { Link, useLocation } from "wouter";
import { BarChart3, Inbox } from "lucide-react";

/**
 * Belediye paneli bölüm sekmeleri (S6, 27.08): Genel Bakış ↔ İhbar Kuyruğu.
 *
 * <p>İki sayfa daha önce yalnız adres yazılarak geziliyordu — panelden kuyruğa
 * hiçbir görünür geçiş yoktu. Sekmeler iki sayfada da aynı bileşenden gelir.
 */
export default function MunicipalityNav() {
  const [location] = useLocation();

  const SEKMELER = [
    { yol: "/municipality", etiket: "Genel Bakış", Ikon: BarChart3 },
    { yol: "/municipality/queue", etiket: "İhbar Kuyruğu", Ikon: Inbox },
  ] as const;

  return (
    <nav aria-label="Belediye paneli bölümleri" className="mb-5 flex flex-wrap gap-2">
      {SEKMELER.map(({ yol, etiket, Ikon }) => {
        const aktif = location === yol;
        return (
          <Link
            key={yol}
            href={yol}
            aria-current={aktif ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 ${
              aktif ? "pm-button pm-button--primary" : "pm-button pm-button--secondary"
            }`}
          >
            <Ikon size={16} />
            {etiket}
          </Link>
        );
      })}
    </nav>
  );
}
