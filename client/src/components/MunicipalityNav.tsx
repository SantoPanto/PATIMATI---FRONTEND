import { Link, useLocation } from "wouter";
import { ArrowLeft, BarChart3, Inbox } from "lucide-react";

/**
 * Belediye paneli bölüm sekmeleri ve ana sayfaya dönüş gezintisi.
 *
 * <p>Tüm belediye ekranlarında sol üstte görünür "Ana sayfaya dön" butonu ve
 * bölüm sekmelerini tek bir ortak gezinti bileşeni olarak sunar.
 */
export default function MunicipalityNav() {
  const [location] = useLocation();

  const SEKMELER = [
    { yol: "/municipality", etiket: "Genel Bakış", Ikon: BarChart3 },
    { yol: "/municipality/queue", etiket: "İhbar Kuyruğu", Ikon: Inbox },
  ] as const;

  return (
    <nav aria-label="Belediye paneli bölümleri" className="mb-5 flex flex-wrap items-center gap-2">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 pm-button pm-button--secondary font-semibold"
      >
        <ArrowLeft size={16} />
        Ana sayfaya dön
      </Link>
      <span className="hidden text-[var(--pm-muted)] sm:inline" aria-hidden="true">
        ·
      </span>
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
