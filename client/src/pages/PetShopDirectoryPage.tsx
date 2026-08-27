import { Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ServiceHero from "../components/ServiceHero";
import type { PetShopPublicResponse } from "../services/types";
import { listPetShops } from "../services/petshop";

/**
 * Petshop dizini -- `VetDirectoryPage.tsx`'in kopyası eksi hayvan türleri
 * (plan §12). Dükkan bazlı ortalama puan YOK -- puanlama tamamen ürün bazlı,
 * bu yüzden kartlarda `StarRating` YOK (bkz. "Bilinçli kapsam sınırları").
 */
export default function PetShopDirectoryPage() {
  const [, navigate] = useLocation();
  const [shops, setShops] = useState<PetShopPublicResponse[]>([]);
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listPetShops({ city: city || undefined, size: 50 })
      .then((page) => {
        if (!cancelled) {
          setShops(page.content);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Petshoplar yüklenirken bir hata oluştu.");
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
        icon={ShoppingBag}
        eyebrow="Hizmetler"
        title="Petshoplar"
        subtitle="PatiMati'ye kayıtlı petshopların bilgilerine buradan ulaşabilirsiniz."
        color="#7c3aed"
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

        {!isLoading && !errorMessage && shops.length === 0 && (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Henüz kayıtlı bir petshop yok.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && shops.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className={`${cardClass} cursor-pointer transition duration-300 hover:-translate-y-1 hover:border-[#7c3aed]/40 hover:shadow-lg`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/hizmetler/petshop/${shop.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/hizmetler/petshop/${shop.id}`);
                  }
                }}
              >
                <div className="mb-3 h-36 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                  {shop.photoUrl && (
                    <img
                      src={shop.photoUrl}
                      alt={shop.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  {shop.name}
                </h2>

                <div className="mt-3 space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>
                      {shop.address}
                      {shop.district ? `, ${shop.district}` : ""}, {shop.city}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="shrink-0" />
                    {shop.phone}
                  </p>
                  {shop.workingHours && (
                    <p className="flex items-center gap-2">
                      <Clock size={16} className="shrink-0" />
                      {shop.workingHours}
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
