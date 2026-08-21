import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { getPublicAds } from "../services/ads";
import type { AdResponse, AdType } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import { getUserErrorMessage } from "../utils/errorMessage";
import "../App.css";

type FilterType = "ALL" | AdType;

const PAGE_SIZE = 20;

const FILTERS: Array<{ value: FilterType; label: string }> = [
  { value: "ALL", label: "Tümü" },
  { value: "LOST", label: "Kayıp" },
  { value: "FOUND", label: "Bulunan" },
  { value: "ADOPTION", label: "Sahiplendirme" },
];

function getListingStatus(adType: AdType): string {
  switch (adType) {
    case "LOST":
      return "Kayıp";
    case "FOUND":
      return "Bulunan";
    case "ADOPTION":
      return "Sahiplendirme";
    default:
      return "İlan";
  }
}

function getListingStatusClass(adType: AdType): string {
  switch (adType) {
    case "LOST":
      return "lost";
    case "FOUND":
      return "found";
    case "ADOPTION":
      return "adoption";
    default:
      return "lost";
  }
}

function getSpeciesLabel(species: AdResponse["species"]): string {
  switch (species) {
    case "CAT":
      return "Kedi";
    case "DOG":
      return "Köpek";
    default:
      return species;
  }
}

function getGenderLabel(gender: AdResponse["gender"]): string {
  switch (gender) {
    case "MALE":
      return "Erkek";
    case "FEMALE":
      return "Dişi";
    case "UNKNOWN":
      return "Bilinmiyor";
    default:
      return gender;
  }
}

function getAgeGroupLabel(ageGroup: AdResponse["ageGroup"]): string {
  switch (ageGroup) {
    case "BABY":
      return "Yavru";
    case "YOUNG":
      return "Genç";
    case "ADULT":
      return "Yetişkin";
    case "SENIOR":
      return "Yaşlı";
    default:
      return ageGroup;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getLocationLabel(ad: AdResponse): string {
  /*
   * The public AdResponse currently exposes latitude/longitude,
   * but does not expose a city/district name.
   *
   * Therefore we deliberately do not invent a location name here.
   * If the backend later adds a location field, this helper can
   * be updated without changing the card component.
   */
  if (
    typeof ad.latitude === "number" &&
    typeof ad.longitude === "number"
  ) {
    return `${ad.latitude.toFixed(4)}, ${ad.longitude.toFixed(4)}`;
  }

  return "Konum belirtilmemiş";
}

function getPrimaryImage(ad: AdResponse): string | null {
  if (!Array.isArray(ad.photoUrls) || ad.photoUrls.length === 0) {
    return null;
  }

  const firstValidUrl = ad.photoUrls.find(
    (url) => typeof url === "string" && url.trim().length > 0,
  );

  return firstValidUrl ? getImageUrl(firstValidUrl) : null;
}

function PetListingCard({ ad }: { ad: AdResponse }) {
  const image = getPrimaryImage(ad);
  const statusClass = getListingStatusClass(ad.adType);

  const subtitle = [
    getSpeciesLabel(ad.species),
    ad.breed?.trim() || "Cins belirtilmemiş",
  ].join(" ");

  return (
    <article className="pet-listing-card">
      <Link
        href={`/pet/${ad.id}`}
        className="pet-listing-card__image"
        aria-label={`${ad.title} ilanını görüntüle`}
      >
        {image ? (
          <img src={image} alt={ad.title} loading="lazy" />
        ) : (
          <div
            className="flex h-full min-h-[220px] w-full items-center justify-center bg-[#FFF7ED] text-[#F97316]"
            aria-label="Fotoğraf bulunmuyor"
          >
            <Search size={42} />
          </div>
        )}

        <span
          className={`listing-status listing-status--${statusClass}`}
        >
          {getListingStatus(ad.adType)}
        </span>

        {ad.aiStatus === "DONE" && ad.aiIsPet === true && (
          <span className="listing-featured">
            <Sparkles size={14} />
            AI doğrulandı
          </span>
        )}
      </Link>

      <div className="pet-listing-card__body">
        <div className="pet-listing-card__title-row">
          <div className="min-w-0">
            <h3 className="truncate">{ad.title}</h3>

            <p>
              {subtitle}
            </p>
          </div>

          <span>{formatDate(ad.createdAt)}</span>
        </div>

        <div className="pet-listing-card__location">
          <MapPin size={17} />
          <span className="truncate">{getLocationLabel(ad)}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#64748B]">
          <span>{getGenderLabel(ad.gender)}</span>
          <span>{getAgeGroupLabel(ad.ageGroup)}</span>
        </div>

        <Link
          href={`/pet/${ad.id}`}
          className="pet-listing-card__button"
        >
          İlanı incele
          <ChevronRight size={18} />
        </Link>
      </div>
    </article>
  );
}

export default function ListingsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [ads, setAds] = useState<AdResponse[]>([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPublicAds({
        page,
        size: PAGE_SIZE,
        ...(activeFilter !== "ALL"
          ? { adType: activeFilter }
          : {}),
      });

      setAds(Array.isArray(response.content) ? response.content : []);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } catch (requestError) {
      console.error("İlanlar yüklenemedi:", requestError);

      setAds([]);
      setTotalPages(0);
      setTotalElements(0);

      setError(
        getUserErrorMessage(
          requestError,
          "İlanlar yüklenirken bir hata oluştu",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- filtre/sayfa degistiginde sunucudan veri cekmek (dis sistemle senkronizasyon), loadAds kendi ici setIsLoading/setError cagirir
    void loadAds();
  }, [loadAds]);

  const handleFilterChange = (filter: FilterType) => {
    if (filter === activeFilter) {
      return;
    }

    setActiveFilter(filter);
    setPage(0);
  };

  const goToPreviousPage = () => {
    setPage((currentPage) => Math.max(0, currentPage - 1));
  };

  const goToNextPage = () => {
    setPage((currentPage) =>
      totalPages > 0
        ? Math.min(totalPages - 1, currentPage + 1)
        : currentPage,
    );
  };

  return (
    <div className="home-page min-h-screen bg-[#F8FAFC]">
      <Header />

      <main>
        <section className="page-container pt-12 pb-8 sm:pt-16">
          <div className="section-heading">
            <span className="section-eyebrow">
              PATIMATI ilanları
            </span>

            <h1>Tüm ilanlar</h1>

            <p>
              Kayıp bulunan ve sahiplendirme ilanlarını keşfet
              Sana en uygun dostu bulmak için ilanları incele
            </p>
          </div>

          <div
            className="listing-filters mt-8"
            role="tablist"
            aria-label="İlan türü filtreleri"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.value}
                className={
                  activeFilter === filter.value ? "active" : ""
                }
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="listings-section">
          <div className="page-container pb-16">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-[#0F172A]">
                  {isLoading
                    ? "İlanlar yükleniyor"
                    : `${totalElements} ilan`}
                </strong>

                {!isLoading && totalPages > 0 && (
                  <p className="mt-1 text-sm text-[#64748B]">
                    Sayfa {page + 1} {totalPages}
                  </p>
                )}
              </div>

              <Link
                href="/lost/create"
                className="hero-primary-action inline-flex w-fit"
              >
                İlan oluştur
              </Link>
            </div>

            {isLoading ? (
              <div className="pet-listings-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="pet-listing-card overflow-hidden"
                    aria-hidden="true"
                  >
                    <div className="min-h-[220px] animate-pulse bg-[#E2E8F0]" />

                    <div className="space-y-4 p-5">
                      <div className="h-5 animate-pulse rounded bg-[#E2E8F0]" />
                      <div className="h-4 animate-pulse rounded bg-[#E2E8F0]" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-[#E2E8F0]" />
                      <div className="h-10 animate-pulse rounded bg-[#E2E8F0]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>İlanlar yüklenemedi</h3>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => void loadAds()}
                >
                  Tekrar dene
                </button>
              </div>
            ) : ads.length > 0 ? (
              <div className="pet-listings-grid">
                {ads.map((ad) => (
                  <PetListingCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>Bu kategoride ilan bulunamadı</h3>

                <p>
                  Şu anda seçtiğin filtreye uygun aktif bir ilan
                  bulunmuyor Başka bir ilan türünü deneyebilirsin
                </p>

                {activeFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange("ALL")}
                  >
                    Tüm ilanları göster
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="İlan sayfaları"
              >
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={page === 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Önceki sayfa"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-[#64748B]">
                  {page + 1} {totalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={page >= totalPages - 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}