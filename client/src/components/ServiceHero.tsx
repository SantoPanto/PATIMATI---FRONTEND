import type { LucideIcon } from "lucide-react";

type ServiceHeroProps = {
  /** Küçük rozet + başlık ikonu için AYNI ikon -- Veteriner/Petshop/Barınak
   * sayfalarının kendi türünü, `/hizmetler` gibi karma sayfaların ise
   * marka ikonunu (`PawPrint`) taşıması beklenir. */
  icon: LucideIcon;
  /** Rozetteki kısa etiket, ör. "Veteriner Kliniği". */
  eyebrow: string;
  /** Büyük başlık -- sayfanın adı/işletmenin adı. */
  title: string;
  subtitle?: string;
  /** Kimlik rengi (hex) -- `utils/haritaSunum.ts`'teki `POI_RENKLERI` ile
   * AYNI kaynaktan: Veteriner mavi, Petshop mor, Barınak turkuaz. Karma
   * sayfalarda marka turuncusu (`#F97316`) kullanılır. */
  color: string;
};

/**
 * Hizmetler bölümünün (Veteriner/Petshop/Barınak dizin+detay+panel
 * sayfaları ve `/hizmetler` ana sayfası) ortak hero bandı --
 * `CreateAdLayout.tsx`'teki gradyan hero + rozet chip desenini izler
 * (sitenin en güncel/tutarlı görsel dili), yalnız tek bir sabit türe
 * bağlı değil, her hizmetin kendi kimlik rengiyle parametrik çalışır.
 * Önceki düz "küçük renkli etiket + `<h1>`" bloğunun yerine geçer.
 */
export default function ServiceHero({ icon: Icon, eyebrow, title, subtitle, color }: ServiceHeroProps) {
  return (
    <section
      className="border-b"
      style={{
        background: `linear-gradient(135deg, ${color}1a, #ffffff 55%, ${color}0d)`,
        borderColor: `${color}33`,
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <span
          className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold shadow-xs dark:bg-slate-900"
          style={{ borderColor: `${color}4d`, color }}
        >
          <Icon size={16} />
          {eyebrow}
        </span>

        <h1 className="mt-4 flex items-center gap-2.5 text-[28px] font-bold leading-9 text-[#0F172A] sm:text-[32px] sm:leading-10 dark:text-[#F1F5F9]">
          <Icon size={28} style={{ color }} />
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 max-w-2xl text-base leading-6 text-[#64748B] dark:text-[#94A3B8]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
