import { Clock, Home, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ServiceHero from "../components/ServiceHero";
import StarRating from "../components/StarRating";
import type { ShelterPublicResponse } from "../services/types";
import { listShelters } from "../services/shelter";

/**
 * Barınak dizini -- `PetShopDirectoryPage.tsx`'in kopyası (plan §16),
 * `listShelters` kullanır, kart tıklaması `/hizmetler/barinak/{id}`'e gider.
 * Petshop'un aksine barınakta puanlama VAR (plan "Bilinçli kapsam
 * sınırları") -- kartlarda `StarRating` VetDirectoryPage'deki gibi render
 * edilir.
 */
export default function ShelterDirectoryPage() {
  const [, navigate] = useLocation();
  const [shelters, setShelters] = useState<ShelterPublicResponse[]>([]);
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listShelters({ city: city || undefined, size: 50 })
      .then((page) => {
        if (!cancelled) {
          setShelters(page.content);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Barınaklar yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={Home}
        eyebrow="Hizmetler"
        title="Barınaklar"
        subtitle="PatiMati'ye kayıtlı barınakların bilgilerine buradan ulaşabilirsiniz."
        color="#0d9488"
      />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6 max-w-xs">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="İle göre filtrele (ör. Ankara)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {isLoading && (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && shelters.length === 0 && (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Henüz kayıtlı bir barınak yok.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && shelters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelters.map((shelter) => (
              <div
                key={shelter.id}
                className={`${cardClass} cursor-pointer transition duration-300 hover:-translate-y-1 hover:border-[#0d9488]/40 hover:shadow-lg`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/hizmetler/barinak/${shelter.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/hizmetler/barinak/${shelter.id}`);
                  }
                }}
              >
                <div className="mb-3 h-36 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                  {shelter.photoUrl && (
                    <img
                      src={shelter.photoUrl}
                      alt={shelter.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  {shelter.name}
                </h2>

                <div className="mt-1 flex items-center gap-1.5">
                  <StarRating value={shelter.averageRating ?? 0} readOnly size={13} />
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {shelter.reviewCount > 0 && shelter.averageRating !== null
                      ? `${shelter.averageRating.toFixed(1)} (${shelter.reviewCount})`
                      : "Henüz değerlendirme yok"}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>
                      {shelter.address}
                      {shelter.district ? `, ${shelter.district}` : ""}, {shelter.city}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="shrink-0" />
                    {shelter.phone}
                  </p>
                  {shelter.workingHours && (
                    <p className="flex items-center gap-2">
                      <Clock size={16} className="shrink-0" />
                      {shelter.workingHours}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
