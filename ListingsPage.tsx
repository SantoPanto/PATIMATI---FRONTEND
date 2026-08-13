import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Header from "../components/Header";
import { getPublicAds } from "../services/ads";
import type { AdResponse, AdType } from "../services/types";

type FilterType = "all" | AdType;
type SpeciesFilter = "ALL" | "CAT" | "DOG";

const PAGE_SIZE = 20;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=85";

const AD_TYPE_LABELS: Record<AdType, string> = {
  LOST: "Kayıp",
  FOUND: "Bulunan",
  ADOPTION: "Sahiplendirme",
};

const SPECIES_LABELS: Record<string, string> = {
  CAT: "Kedi",
  DOG: "Köpek",
};

function getAdTypeClass(type: AdType) {
  return type.toLowerCase();
}

function getSpeciesLabel(species: string) {
  return SPECIES_LABELS[species] ?? species;
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ListingsPage() {
  const [listings, setListings] = useState<AdResponse[]>([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("all");

  const [searchValue, setSearchValue] = useState("");

  const [speciesFilter, setSpeciesFilter] =
    useState<SpeciesFilter>("ALL");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * --------------------------------------------------------------------------
   * Load public listings
   * --------------------------------------------------------------------------
   *
   * Backend:
   *
   * GET /api/public/ads
   * GET /api/public/ads?adType=LOST
   * GET /api/public/ads?adType=FOUND
   * GET /api/public/ads?adType=ADOPTION
   *
   * Pagination is handled by the backend.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError(null);

      try {
        const response = await getPublicAds({
          page,
          size: PAGE_SIZE,
          adType:
            activeFilter === "all"
              ? undefined
              : activeFilter,
        });

        if (cancelled) return;

        setListings(response.content ?? []);
        setTotalPages(response.totalPages ?? 0);
      } catch (err) {
        if (cancelled) return;

        console.error("İlanlar yüklenemedi:", err);

        setError(
          err instanceof Error
            ? err.message
            : "İlanlar yüklenirken bir hata oluştu.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadListings();

    return () => {
      cancelled = true;
    };
  }, [page, activeFilter]);

  /*
   * --------------------------------------------------------------------------
   * Filter drawer body scroll
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (!isFilterOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  /*
   * --------------------------------------------------------------------------
   * Client-side search / species filtering
   * --------------------------------------------------------------------------
   *
   * The current backend endpoint supports:
   *   adType
   *   page
   *   size
   *
   * It does NOT expose a search parameter, so search is performed against
   * the currently loaded backend page instead of inventing an unsupported
   * backend endpoint.
   */
  const filteredListings = useMemo(() => {
    const normalizedSearch = searchValue
      .trim()
      .toLocaleLowerCase("tr-TR");

    return listings.filter((listing) => {
      const matchesSpecies =
        speciesFilter === "ALL" ||
        listing.species === speciesFilter;

      if (!matchesSpecies) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        listing.title,
        listing.description,
        listing.breed,
        listing.ownerDisplayName,
        getSpeciesLabel(listing.species),
        AD_TYPE_LABELS[listing.adType],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return searchableText.includes(normalizedSearch);
    });
  }, [listings, searchValue, speciesFilter]);

  /*
   * --------------------------------------------------------------------------
   * Filters
   * --------------------------------------------------------------------------
   */
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(0);
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSpeciesFilter("ALL");
    setSearchValue("");
    setPage(0);
  };

  /*
   * --------------------------------------------------------------------------
   * Favorites
   * --------------------------------------------------------------------------
   *
   * This keeps the same local favorite behavior already used by HomePage.
   * We are not inventing a favorites API here.
   */
  const toggleFavorite = (listingId: number) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(listingId)
        ? currentIds.filter((id) => id !== listingId)
        : [...currentIds, listingId],
    );
  };

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */
  return (
    <div className="home-page">
      <Header />

      <main>
        <section className="page-container">
          {/* ---------------------------------------------------------------- */}
          {/* Page heading                                                     */}
          {/* ---------------------------------------------------------------- */}

          <div className="section-heading">
            <span className="section-eyebrow">
              PATIMATI ilanları
            </span>

            <h1>İlanlar</h1>

            <p>
              Kayıp, bulunan ve sahiplendirilecek hayvan
              ilanlarını keşfet.
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Search                                                           */}
          {/* ---------------------------------------------------------------- */}

          <div
            className="hero-search"
            style={{ marginTop: "24px" }}
          >
            <Search size={21} aria-hidden="true" />

            <input
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              placeholder="İsim, tür, ırk veya ilan ara..."
              aria-label="İlanlarda ara"
            />

            {searchValue && (
              <button
                type="button"
                aria-label="Aramayı temizle"
                onClick={() => setSearchValue("")}
              >
                <X size={18} />
              </button>
            )}

            <button
              type="button"
              aria-label="Filtreleri aç"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal size={19} />
              <span>Filtrele</span>
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Quick filters                                                    */}
          {/* ---------------------------------------------------------------- */}

          <div
            className="listing-filters"
            role="tablist"
            aria-label="İlan türleri"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === "all"}
              className={
                activeFilter === "all" ? "active" : ""
              }
              onClick={() => handleFilterChange("all")}
            >
              Tümü
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === "LOST"}
              className={
                activeFilter === "LOST" ? "active" : ""
              }
              onClick={() => handleFilterChange("LOST")}
            >
              Kayıp
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === "FOUND"}
              className={
                activeFilter === "FOUND" ? "active" : ""
              }
              onClick={() => handleFilterChange("FOUND")}
            >
              Bulunan
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === "ADOPTION"}
              className={
                activeFilter === "ADOPTION"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleFilterChange("ADOPTION")
              }
            >
              Sahiplendirme
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Loading                                                          */}
          {/* ---------------------------------------------------------------- */}

          {loading && (
            <div className="empty-listings">
              <span>
                <Search size={28} />
              </span>

              <h3>İlanlar yükleniyor...</h3>

              <p>
                Güncel ilanları getiriyoruz.
              </p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Error                                                            */}
          {/* ---------------------------------------------------------------- */}

          {!loading && error && (
            <div className="empty-listings">
              <span>
                <Search size={28} />
              </span>

              <h3>İlanlar yüklenemedi</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => {
                  /*
                   * Changing page and back forces the effect to run.
                   * For page 0 we temporarily move to page 1 only when
                   * there is another page available.
                   */
                  setError(null);

                  if (page > 0) {
                    setPage(0);
                  } else {
                    setActiveFilter((current) => current);
                  }
                }}
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Empty                                                            */}
          {/* ---------------------------------------------------------------- */}

          {!loading &&
            !error &&
            filteredListings.length === 0 && (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>
                  Aramana uygun ilan bulunamadı
                </h3>

                <p>
                  Farklı bir isim, konum veya hayvan
                  türü aramayı dene.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Filtreleri temizle
                </button>
              </div>
            )}

          {/* ---------------------------------------------------------------- */}
          {/* Listings                                                         */}
          {/* ---------------------------------------------------------------- */}

          {!loading &&
            !error &&
            filteredListings.length > 0 && (
              <>
                <div className="pet-listings-grid">
                  {filteredListings.map((listing) => {
                    const isFavorite =
                      favoriteIds.includes(listing.id);

                    const image =
                      listing.photoUrls?.[0] ||
                      FALLBACK_IMAGE;

                    return (
                      <article
                        className="pet-listing-card"
                        key={listing.id}
                      >
                        {/* Image / status */}
                        <Link
                          href={`/pet/${listing.id}`}
                          className="pet-listing-card__image"
                        >
                          <img
                            src={image}
                            alt={listing.title}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src =
                                FALLBACK_IMAGE;
                            }}
                          />

                          <span
                            className={`listing-status listing-status--${getAdTypeClass(
                              listing.adType,
                            )}`}
                          >
                            {
                              AD_TYPE_LABELS[
                                listing.adType
                              ]
                            }
                          </span>
                        </Link>

                        {/* Favorite */}
                        <button
                          type="button"
                          className={`favorite-button ${
                            isFavorite
                              ? "favorite-button--active"
                              : ""
                          }`}
                          onClick={() =>
                            toggleFavorite(listing.id)
                          }
                          aria-label={
                            isFavorite
                              ? `${listing.title} ilanını favorilerden çıkar`
                              : `${listing.title} ilanını favorilere ekle`
                          }
                          aria-pressed={isFavorite}
                        >
                          <Heart
                            size={20}
                            fill={
                              isFavorite
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>

                        {/* Card body */}
                        <div className="pet-listing-card__body">
                          <div className="pet-listing-card__title-row">
                            <div>
                              <h3>{listing.title}</h3>

                              <p>
                                {getSpeciesLabel(
                                  listing.species,
                                )}

                                {listing.breed
                                  ? ` · ${listing.breed}`
                                  : ""}
                              </p>
                            </div>

                            <span>
                              {formatDate(
                                listing.createdAt,
                              )}
                            </span>
                          </div>

                          <div className="pet-listing-card__location">
                            <MapPin size={17} />

                            <span>
                              {listing.latitude.toFixed(4)}
                              ,{" "}
                              {listing.longitude.toFixed(4)}
                            </span>
                          </div>

                          <Link
                            href={`/pet/${listing.id}`}
                            className="pet-listing-card__button"
                          >
                            İlanı incele
                            <ChevronRight size={18} />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* Pagination                                                       */}
                {/* ---------------------------------------------------------------- */}

                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                      marginTop: "32px",
                      marginBottom: "48px",
                    }}
                  >
                    <button
                      type="button"
                      className="icon-button"
                      disabled={page === 0}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(0, current - 1),
                        )
                      }
                      aria-label="Önceki sayfa"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Sayfa {page + 1} / {totalPages}
                    </span>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        page >= totalPages - 1
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages - 1,
                            current + 1,
                          ),
                        )
                      }
                      aria-label="Sonraki sayfa"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
        </section>
      </main>

      {/* ====================================================================== */}
      {/* FILTER DRAWER                                                         */}
      {/* ====================================================================== */}

      <div
        className={`filter-drawer-overlay ${
          isFilterOpen ? "is-open" : ""
        }`}
        aria-hidden={!isFilterOpen}
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget
          ) {
            setIsFilterOpen(false);
          }
        }}
      >
        <aside
          className="filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="İlan filtreleri"
        >
          <div className="filter-drawer__header">
            <div>
              <span>Arama seçenekleri</span>

              <h2>Filtreler</h2>
            </div>

            <button
              type="button"
              className="filter-drawer__close"
              aria-label="Filtreleri kapat"
              onClick={() =>
                setIsFilterOpen(false)
              }
            >
              <X size={22} />
            </button>
          </div>

          <div className="filter-drawer__body">
            {/* Animal */}
            <section className="filter-group">
              <h3>Hayvan türü</h3>

              <div className="filter-chip-grid">
                <button
                  type="button"
                  className={
                    speciesFilter === "ALL"
                      ? "is-selected"
                      : ""
                  }
                  onClick={() =>
                    setSpeciesFilter("ALL")
                  }
                >
                  Tümü
                </button>

                <button
                  type="button"
                  className={
                    speciesFilter === "CAT"
                      ? "is-selected"
                      : ""
                  }
                  onClick={() =>
                    setSpeciesFilter("CAT")
                  }
                >
                  Kedi
                </button>

                <button
                  type="button"
                  className={
                    speciesFilter === "DOG"
                      ? "is-selected"
                      : ""
                  }
                  onClick={() =>
                    setSpeciesFilter("DOG")
                  }
                >
                  Köpek
                </button>
              </div>
            </section>

            {/* Listing type */}
            <section className="filter-group">
              <h3>İlan türü</h3>

              <div className="filter-checkbox-list">
                <label>
                  <input
                    type="radio"
                    name="listing-type"
                    checked={
                      activeFilter === "all"
                    }
                    onChange={() =>
                      handleFilterChange("all")
                    }
                  />

                  <span>Tümü</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="listing-type"
                    checked={
                      activeFilter === "LOST"
                    }
                    onChange={() =>
                      handleFilterChange("LOST")
                    }
                  />

                  <span>Kayıp</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="listing-type"
                    checked={
                      activeFilter === "FOUND"
                    }
                    onChange={() =>
                      handleFilterChange("FOUND")
                    }
                  />

                  <span>Bulunan</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="listing-type"
                    checked={
                      activeFilter === "ADOPTION"
                    }
                    onChange={() =>
                      handleFilterChange(
                        "ADOPTION",
                      )
                    }
                  />

                  <span>Sahiplendirme</span>
                </label>
              </div>
            </section>
          </div>

          <div className="filter-drawer__footer">
            <button
              type="button"
              className="filter-clear-button"
              onClick={clearFilters}
            >
              Temizle
            </button>

            <button
              type="button"
              className="filter-apply-button"
              onClick={() =>
                setIsFilterOpen(false)
              }
            >
              Filtreleri uygula
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
