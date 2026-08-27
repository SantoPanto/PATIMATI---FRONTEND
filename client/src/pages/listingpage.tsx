import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PetListingCard from "../components/PetListingCard";
import { getPublicAds } from "../services/ads";
import { getPublicAdoptions } from "../services/adoptions";
import type { AdResponse, AdType } from "../services/types";
import { getAdLocation, getGenderLabel, getSpeciesLabel } from "../utils/adPresentation";
import { getUserErrorMessage } from "../utils/errorMessage";
import "../App.css";
import "../styles/adoption.css";

type FilterType = "ALL" | AdType;

const PAGE_SIZE = 20;

const FILTERS: Array<{ value: FilterType; label: string }> = [
  { value: "ALL", label: "Tümü" },
  { value: "LOST", label: "Kayıp" },
  { value: "FOUND", label: "Bulunan" },
  { value: "ADOPTION", label: "Sahiplendirme" },
  { value: "HELP", label: "Yardım" },
];

const getFilterFromUrl = (): FilterType => {
  if (typeof window === "undefined") return "ALL";
  if (window.location.pathname.startsWith("/adoption")) return "ADOPTION";
  const params = new URLSearchParams(window.location.search);
  const type = (params.get("type") || params.get("filter"))?.toUpperCase();
  if (type && ["LOST", "FOUND", "ADOPTION", "HELP"].includes(type)) {
    return type as FilterType;
  }
  return "ALL";
};

interface ListingsPageProps {
  defaultFilter?: FilterType;
  params?: Record<string, string | undefined>;
}

export default function ListingsPage({ defaultFilter }: ListingsPageProps = {}) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => defaultFilter || getFilterFromUrl());
  const [ads, setAds] = useState<AdResponse[]>([]);

  // Sahiplendirme alt filtreleri
  const [speciesFilter, setSpeciesFilter] = useState<string>("Tümü");
  const [genderFilter, setGenderFilter] = useState<string>("Tümü");

  // Kutudaki anlık metin ile sunucuya giden terim ayrı tutuluyor
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL değişimini dinle (örn: header dropdown'dan tıklanınca)
  useEffect(() => {
    const handlePopState = () => {
      setActiveFilter(getFilterFromUrl());
      setPage(0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!defaultFilter) {
      const searchFromUrl = getFilterFromUrl();
      if (searchFromUrl !== activeFilter) {
        setActiveFilter(searchFromUrl);
        setPage(0);
      }
    }
  }, [defaultFilter]);

  useEffect(() => {
    const zamanlayici = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);

    return () => window.clearTimeout(zamanlayici);
  }, [searchInput]);

  const loadAds = useCallback(async () => {
    if (activeFilter === "ADOPTION" && ads.length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let items: AdResponse[] = [];
      let fetchedTotalPages = 0;

      if (activeFilter === "ADOPTION") {
        try {
          const response = await getPublicAdoptions({ page: 0, size: 100 });
          if (response && Array.isArray(response.content) && response.content.length > 0) {
            items = response.content;
            fetchedTotalPages = response.totalPages ?? Math.ceil(items.length / PAGE_SIZE);
          }
        } catch {
          // Fallback to getPublicAds
        }
      }

      if (items.length === 0) {
        const response = await getPublicAds({
          page,
          size: PAGE_SIZE,
          ...(search.length > 0 ? { search } : {}),
          ...(activeFilter !== "ALL"
            ? { adType: activeFilter }
            : {}),
        });

        items = Array.isArray(response.content) ? response.content : [];
        fetchedTotalPages = response.totalPages ?? 0;
      }

      setAds(items.filter((ad) => ad && ad.active !== false));
      setTotalPages(fetchedTotalPages);
    } catch (requestError) {
      console.error("İlanlar yüklenemedi:", requestError);

      setAds([]);
      setTotalPages(0);

      setError(
        getUserErrorMessage(
          requestError,
          "İlanlar yüklenirken bir hata oluştu",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, activeFilter === "ADOPTION" ? "" : search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- filtre/sayfa degistiginde sunucudan veri cekmek
    void loadAds();
  }, [loadAds]);

  const handleFilterChange = (filter: FilterType) => {
    if (filter === activeFilter) {
      return;
    }

    setActiveFilter(filter);
    setPage(0);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (filter === "ALL") {
        params.delete("type");
        params.delete("filter");
      } else {
        params.set("type", filter);
      }
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Sahiplendirme sekmesinde veya aramada istemci taraflı alt filtreleme
  const displayedAds = useMemo(() => {
    let result = ads;
    if (activeFilter === "ADOPTION") {
      result = result.filter((ad) => {
        const matchesSpecies =
          speciesFilter === "Tümü" || getSpeciesLabel(ad.species) === speciesFilter;
        const matchesGender =
          genderFilter === "Tümü" || getGenderLabel(ad.gender) === genderFilter;
        return matchesSpecies && matchesGender;
      });
    }

    if (search.trim().length > 0 && activeFilter === "ADOPTION") {
      const searchNormalized = search.trim().toLocaleLowerCase("tr-TR");
      result = result.filter((ad) => {
        const searchable = [ad.title, ad.breed, ad.description, getAdLocation(ad)]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");
        return searchable.includes(searchNormalized);
      });
    }

    return result;
  }, [ads, activeFilter, speciesFilter, genderFilter, search]);

  // Sahiplendirme sekmesinde tek seferde çekilen toplu listenin istemci sayfalama hesabı
  const effectiveTotalPages = useMemo(() => {
    if (activeFilter === "ADOPTION" && ads.length > PAGE_SIZE) {
      return Math.ceil(displayedAds.length / PAGE_SIZE);
    }
    return totalPages;
  }, [activeFilter, ads.length, displayedAds.length, totalPages]);

  const effectiveCurrentPage = useMemo(() => {
    if (activeFilter === "ADOPTION" && ads.length > PAGE_SIZE) {
      return Math.min(page, Math.max(effectiveTotalPages - 1, 0));
    }
    return page;
  }, [activeFilter, ads.length, page, effectiveTotalPages]);

  const pagedAds = useMemo(() => {
    if (activeFilter === "ADOPTION" && ads.length > PAGE_SIZE) {
      return displayedAds.slice(
        effectiveCurrentPage * PAGE_SIZE,
        (effectiveCurrentPage + 1) * PAGE_SIZE,
      );
    }
    return displayedAds;
  }, [activeFilter, ads.length, displayedAds, effectiveCurrentPage]);

  // Enter, bekletmeyi (debounce) beklemeden aramayı hemen gönderir
  const flushSearch = () => {
    setSearch(searchInput.trim());
    setPage(0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  const goToPreviousPage = () => {
    setPage((currentPage) => Math.max(0, currentPage - 1));
  };

  const goToNextPage = () => {
    setPage((currentPage) =>
      effectiveTotalPages > 0
        ? Math.min(effectiveTotalPages - 1, currentPage + 1)
        : currentPage,
    );
  };

  return (
    <div className="home-page min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <Header />

      <main>
        <section className="page-container pt-12 pb-8 sm:pt-16">
          {activeFilter === "ADOPTION" && (
            <section className="adoption-hero mb-8 rounded-2xl overflow-hidden border border-orange-100 dark:border-orange-950/40">
              <div className="pm-container adoption-hero__content !min-h-0 !py-8 !px-6 grid-cols-1 md:grid-cols-2 gap-6">
                <div className="adoption-hero__text">
                  <span className="adoption-hero__eyebrow">
                    <Sparkles size={17} />
                    Yeni bir yuva yeni bir hayat
                  </span>
                  <h1 className="!text-2xl sm:!text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                    Onlara sadece bir ev değil <span>sevgi dolu bir aile ver</span>
                  </h1>
                  <p className="!text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Yuva arayan dostlarımızı incele. Sana en uygun yol arkadaşını bul ve onun hayatını değiştir.
                  </p>
                  <div className="adoption-hero__actions mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/adoption/create"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition"
                    >
                      <Plus size={18} />
                      Sahiplendirme İlanı Ver
                    </Link>
                  </div>
                  <div className="adoption-hero__features mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck size={16} /> Güvenli iletişim
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Heart size={16} /> Ücretsiz sahiplendirme
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck size={16} /> Gerçek ve güncel ilanlar
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="section-heading">
            <span className="section-eyebrow">
              PATIMATI ilanları
            </span>

            <h1>
              {activeFilter === "ADOPTION"
                ? "Sahiplendirme İlanları"
                : activeFilter === "LOST"
                  ? "Kayıp İlanları"
                  : activeFilter === "FOUND"
                    ? "Bulunan İlanlar"
                    : activeFilter === "HELP"
                      ? "Yardım İlanları"
                      : "Tüm İlanlar"}
            </h1>

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

          {activeFilter === "ADOPTION" && (
            <div className="mt-6 flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Tür:</span>
                <select
                  value={speciesFilter}
                  onChange={(e) => {
                    setSpeciesFilter(e.target.value);
                    setPage(0);
                  }}
                  aria-label="Tür filtresi"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium outline-none focus:border-orange-500 dark:text-slate-100"
                >
                  <option value="Tümü">Tüm Türler</option>
                  <option value="Kedi">Kedi</option>
                  <option value="Köpek">Köpek</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Cinsiyet:</span>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    setGenderFilter(e.target.value);
                    setPage(0);
                  }}
                  aria-label="Cinsiyet filtresi"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium outline-none focus:border-orange-500 dark:text-slate-100"
                >
                  <option value="Tümü">Tümü</option>
                  <option value="Dişi">Dişi</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Belirtilmemiş">Belirtilmemiş</option>
                </select>
              </div>

              {(speciesFilter !== "Tümü" || genderFilter !== "Tümü") && (
                <button
                  type="button"
                  onClick={() => {
                    setSpeciesFilter("Tümü");
                    setGenderFilter("Tümü");
                    setPage(0);
                  }}
                  className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          )}

          <div className="relative mx-auto mt-6 max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                const val = event.target.value;
                setSearchInput(val);
                if (activeFilter === "ADOPTION") {
                  setSearch(val.trim());
                  setPage(0);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  flushSearch();
                }
              }}
              placeholder={
                activeFilter === "ADOPTION"
                  ? "Sahiplendirme ilanlarında ara"
                  : "Başlık, ırk veya açıklamada ara"
              }
              aria-label={
                activeFilter === "ADOPTION"
                  ? "Sahiplendirme ilanlarında ara"
                  : "İlanlarda ara"
              }
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-11 pr-4 text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </section>

        <section className="listings-section">
          <div className="page-container pb-16">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-[#0F172A] dark:text-slate-100">
                  {isLoading ? (
                    "İlanlar yükleniyor"
                  ) : search.length > 0 ? (
                    `"${search}" için ${displayedAds.length} ilan`
                  ) : (
                    <>
                      <strong>{displayedAds.length}</strong> ilan
                    </>
                  )}
                </strong>

                {!isLoading && effectiveTotalPages > 0 && (
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                    Sayfa {effectiveCurrentPage + 1} / {effectiveTotalPages}
                  </p>
                )}
              </div>

              <Link
                href={
                  activeFilter === "ADOPTION"
                    ? "/adoption/create"
                    : activeFilter === "FOUND"
                      ? "/found/create"
                      : activeFilter === "HELP"
                        ? "/help/create"
                        : "/lost/create"
                }
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
                    <div className="min-h-[220px] animate-pulse bg-[#E2E8F0] dark:bg-slate-800" />

                    <div className="space-y-4 p-5">
                      <div className="h-5 animate-pulse rounded bg-[#E2E8F0] dark:bg-slate-800" />
                      <div className="h-4 animate-pulse rounded bg-[#E2E8F0] dark:bg-slate-800" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-[#E2E8F0] dark:bg-slate-800" />
                      <div className="h-10 animate-pulse rounded bg-[#E2E8F0] dark:bg-slate-800" />
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
            ) : pagedAds.length > 0 ? (
              <div className="pet-listings-grid">
                {pagedAds.map((ad) => (
                  <PetListingCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : search.length > 0 ? (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>Aramana uyan ilan bulunamadı</h3>

                <p>
                  {`"${search}" başlık, ırk ya da açıklamasında geçen
                  aktif bir ilan yok Farklı bir kelime deneyebilirsin`}
                </p>

                <button type="button" onClick={clearSearch}>
                  Aramayı temizle
                </button>
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

            {!isLoading && !error && effectiveTotalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="İlan sayfaları"
              >
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={effectiveCurrentPage === 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Önceki sayfa"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-[#64748B] dark:text-slate-400">
                  {effectiveCurrentPage + 1} / {effectiveTotalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={effectiveCurrentPage >= effectiveTotalPages - 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}

            {activeFilter === "ADOPTION" && (
              <section className="adoption-safety mt-12">
                <div className="adoption-safety__icon">
                  <ShieldCheck size={32} />
                </div>
                <div className="adoption-safety__content">
                  <span>Güvenli sahiplendirme</span>
                  <h2>Dostlarımızın güvenliği her şeyden önemli</h2>
                  <p>
                    Hayvan sahiplenirken karşı tarafla mutlaka görüş ve hiçbir
                    kullanıcıya sahiplendirme karşılığında ödeme yapma
                  </p>
                </div>
                <Link href="/safety" className="pm-button pm-button--secondary">
                  Güvenlik Rehberi
                </Link>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}