import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ServiceHero from "../components/ServiceHero";
import type { AdResponse, ShelterPublicResponse } from "../services/types";
import { getShelter, listShelterAdoptions } from "../services/shelter";
import {
  getAdDetailPath,
  getAdImage,
  getBreedLabel,
  getSpeciesLabel,
} from "../utils/adPresentation";

const PAGE_SIZE = 20;

/**
 * Bir barınağın TÜM sahiplendirme ilanlarını sayfalı grid'de gösterir --
 * `ShelterDetailPage.tsx`'teki "Son Sahiplendirme İlanları" önizlemesinin
 * "Tüm İlanları Gör" butonuyla açtığı sayfa. `PetShopProductsPage.tsx`'in
 * BİREBİR aynı sayfalama deseni; kart tıklaması mevcut `getAdDetailPath`
 * rotasına gider -- Petshop'un aksine barınağa özel yeni bir ilan-detay
 * rotası YOK.
 */
export default function ShelterAdoptionsPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [shelter, setShelter] = useState<ShelterPublicResponse | null>(null);
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shelterId = Number(id);

  useEffect(() => {
    if (!id || Number.isNaN(shelterId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getShelter(shelterId)
      .then((data) => {
        if (!cancelled) {
          if (!data) {
            setNotFound(true);
            return;
          }
          setShelter(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Barınak bilgileri yüklenirken bir hata oluştu.");
        }
      });

    listShelterAdoptions(shelterId, { page, size: PAGE_SIZE })
      .then((response) => {
        if (!cancelled) {
          setAds(response.content);
          setTotalPages(response.totalPages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage((prev) => prev ?? "İlanlar yüklenirken bir hata oluştu.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  const goToPreviousPage = () => setPage((current) => Math.max(0, current - 1));
  const goToNextPage = () =>
    setPage((current) => (totalPages > 0 ? Math.min(totalPages - 1, current + 1) : current));

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={Home}
        eyebrow="Barınak"
        title={shelter ? `${shelter.name} — Tüm İlanlar` : "Tüm İlanlar"}
        color="#0d9488"
      />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Barınak bulunamadı.</p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className={cardClass}>
                <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
              </div>
            ) : ads.length === 0 ? (
              <div className={cardClass}>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Bu barınakta şu anda sahiplendirme ilanı yok.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(getAdDetailPath(ad))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        navigate(getAdDetailPath(ad));
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-[#0d9488]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-2 h-24 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
                      <img
                        src={getAdImage(ad)}
                        alt={ad.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="truncate text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {ad.title}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {getSpeciesLabel(ad.species)} · {getBreedLabel(ad.breed)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="İlan sayfaları"
              >
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={page === 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#0d9488] hover:text-[#0d9488] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Önceki sayfa"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-[#64748B] dark:text-slate-400">
                  {page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={page >= totalPages - 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#0d9488] hover:text-[#0d9488] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
