import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  PawPrint,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Header from "../components/Header";
import "../App.css";

import { getPublicAds } from "../services/ads";
import type { AdResponse, AdType } from "../services/types";

type FilterType = "ALL" | AdType;

const PAGE_SIZE = 12;

function getListingStatus(adType: AdType) {
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

function getListingStatusClass(adType: AdType) {
  switch (adType) {
    case "LOST":
      return "listing-status--lost";
    case "FOUND":
      return "listing-status--found";
    case "ADOPTION":
      return "listing-status--adoption";
    default:
      return "";
  }
}

function getSpeciesLabel(species: AdResponse["species"]) {
  switch (species) {
    case "CAT":
      return "Kedi";
    case "DOG":
      return "Köpek";
    default:
      return species;
  }
}

function getGenderLabel(gender: AdResponse["gender"]) {
  switch (gender) {
    case "MALE":
      return "Erkek";
    case "FEMALE":
      return "Dişi";
    default:
      return "Bilinmiyor";
  }
}

function getRelativeDate(date: string) {
  const created = new Date(date);

  if (Number.isNaN(created.getTime())) {
    return "";
  }

  const now = Date.now();
  const difference = Math.max(0, now - created.getTime());

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;

  return created.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getImageUrl(ad: AdResponse) {
  if (ad.photoUrls && ad.photoUrls.length > 0) {
    return ad.photoUrls[0];
  }

  return null;
}

export default function ListingsPage() {
  const [, navigate] = useLocation();

  const [ads, setAds] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("ALL");

  const [searchValue, setSearchValue] = useState("");

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedSpecies, setSelectedSpecies] = useState<
    string[]
  >([]);

  const [selectedGender, setSelectedGender] = useState<
    string[]
  >([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  /*
   * Load public listings.
   *
   * Backend:
   * GET /api/public/ads
   *
   * Supported query:
   * adType, page, size
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPublicAds({
          adType:
            activeFilter === "ALL"
              ? undefined
              : activeFilter,
          page: currentPage,
          size: PAGE_SIZE,
        });

        if (cancelled) return;

        setAds(response.content ?? []);
        setTotalPages(response.totalPages ?? 0);
        setTotalElements(response.totalElements ?? 0);
      } catch (err) {
        console.error("İlanlar yüklenemedi:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "İlanlar yüklenirken bir hata oluştu.",
          );
          setAds([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAds();

    return () => {
      cancelled = true;
    };
  }, [activeFilter, currentPage]);

  /*
   * Reset to page 0 whenever the listing type changes.
   */
  function handleFilterChange(filter: FilterType) {
    setActiveFilter(filter);
    setCurrentPage(0);
  }

  /*
   * Search is intentionally performed on the already-loaded
   * public page because the backend controller currently only
   * supports adType, page and size.
   */
  const filteredAds = useMemo(() => {
    const normalizedSearch = searchValue
      .trim()
      .toLocaleLowerCase("tr-TR");

    return ads.filter((ad) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ad.title
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        ad.description
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        (ad.breed ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        (ad.ownerDisplayName ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        getSpeciesLabel(ad.species)
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);

      const matchesSpecies =
        selectedSpecies.length === 0 ||
        selectedSpecies.includes(ad.species);

      const matchesGender =
        selectedGender.length === 0 ||
        selectedGender.includes(ad.gender);

      return (
        matchesSearch &&
        matchesSpecies &&
        matchesGender
      );
    });
  }, [
    ads,
    searchValue,
    selectedSpecies,
    selectedGender,
  ]);

  function toggleFavorite(id: number) {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSpecies(species: string) {
    setSelectedSpecies((current) =>
      current.includes(species)
        ? current.filter((item) => item !== species)
        : [...current, species],
    );
  }

  function toggleGender(gender: string) {
    setSelectedGender((current) =>
      current.includes(gender)
        ? current.filter((item) => item !== gender)
        : [...current, gender],
    );
  }

  function clearFilters() {
    setSearchValue("");
    setSelectedSpecies([]);
    setSelectedGender([]);
  }

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isFilterOpen]);

  return (
    <div className="home-page">
      <Header />

      <main>
        <section className="listings-section">
          <div className="page-container">
            <div className="section-heading-row">
              <div className="section-heading">
                <span className="section-eyebrow">
                  PATIMATI
                </span>

                <h1>İlanlar</h1>

                <p>
                  Kayıp, bulunan ve sahiplendirilecek
                  hayvan ilanlarını keşfet.
                </p>
              </div>

              <button
                type="button"
                className="filter-open-button"
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal size={18} />
                Filtrele
              </button>
            </div>

            <div className="hero-search listings-search">
              <Search
                size={20}
                aria-hidden="true"
              />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(event.target.value)
                }
                placeholder="İlan, tür, ırk veya kullanıcı ara..."
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
            </div>

            <div
              className="listing-filters"
              role="tablist"
              aria-label="İlan türleri"
            >
              <button
                type="button"
                className={
                  activeFilter === "ALL"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleFilterChange("ALL")
                }
              >
                Tümü
              </button>

              <button
                type="button"
                className={
                  activeFilter === "LOST"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleFilterChange("LOST")
                }
              >
                Kayıp
              </button>

              <button
                type="button"
                className={
                  activeFilter === "FOUND"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleFilterChange("FOUND")
                }
              >
                Bulunan
              </button>

              <button
                type="button"
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

            {loading ? (
              <div className="empty-listings">
                <span>
                  <PawPrint size={28} />
                </span>

                <h3>İlanlar yükleniyor...</h3>

                <p>
                  Güncel ilanları getiriyoruz.
                </p>
              </div>
            ) : error ? (
              <div className="empty-listings">
                <span>
                  <PawPrint size={28} />
                </span>

                <h3>İlanlar yüklenemedi</h3>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(0);
                    setActiveFilter(
                      activeFilter === "ALL"
                        ? "ALL"
                        : activeFilter,
                    );
                  }}
                >
                  Tekrar dene
                </button>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="empty-listings">
                <span>
                  <PawPrint size={28} />
                </span>

                <h3>
                  {ads.length === 0
                    ? "Henüz ilan bulunmuyor"
                    : "Aramanızla eşleşen ilan yok"}
                </h3>

                <p>
                  {ads.length === 0
                    ? "Yeni ilanlar yayınlandığında burada görünecek."
                    : "Filtreleri veya arama kelimenizi değiştirmeyi deneyin."}
                </p>

                {(searchValue ||
                  selectedSpecies.length > 0 ||
                  selectedGender.length > 0) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Filtreleri temizle
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="section-heading-row listing-results-heading">
                  <div className="section-heading">
                    <p>
                      {totalElements > 0
                        ? `${totalElements} ilan`
                        : `${filteredAds.length} ilan`}
                    </p>
                  </div>
                </div>

                <div className="pet-listings-grid">
                  {filteredAds.map((ad) => {
                    const imageUrl =
                      getImageUrl(ad);

                    const isFavorite =
                      favoriteIds.includes(ad.id);

                    return (
                      <article
                        key={ad.id}
                        className="pet-listing-card"
                      >
                        <div className="pet-listing-card__image">
                          <Link
                            href={`/pet/${ad.id}`}
                            aria-label={`${ad.title} detayını görüntüle`}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={ad.title}
                                loading="lazy"
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "grid",
                                  placeItems: "center",
                                  background:
                                    "var(--primary-light)",
                                  color:
                                    "var(--primary)",
                                }}
                              >
                                <PawPrint
                                  size={48}
                                />
                              </div>
                            )}
                          </Link>

                          <span
                            className={`listing-status ${getListingStatusClass(
                              ad.adType,
                            )}`}
                          >
                            {getListingStatus(
                              ad.adType,
                            )}
                          </span>

                          <button
                            type="button"
                            className={`favorite-button ${
                              isFavorite
                                ? "favorite-button--active"
                                : ""
                            }`}
                            aria-label={
                              isFavorite
                                ? "Favorilerden çıkar"
                                : "Favorilere ekle"
                            }
                            aria-pressed={
                              isFavorite
                            }
                            onClick={() =>
                              toggleFavorite(ad.id)
                            }
                          >
                            <Heart
                              size={19}
                              fill={
                                isFavorite
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>

                          {ad.aiStatus ===
                            "DONE" &&
                            ad.aiIsPet === true && (
                              <span className="listing-featured">
                                AI doğrulandı
                              </span>
                            )}
                        </div>

                        <div className="pet-listing-card__body">
                          <div className="pet-listing-card__title-row">
                            <div>
                              <h3>
                                {ad.title}
                              </h3>

                              <p>
                                {getSpeciesLabel(
                                  ad.species,
                                )}
                                {ad.breed
                                  ? ` · ${ad.breed}`
                                  : ""}
                              </p>
                            </div>

                            <span>
                              {getRelativeDate(
                                ad.createdAt,
                              )}
                            </span>
                          </div>

                          <div className="pet-listing-card__location">
                            <MapPin size={15} />

                            <span>
                              {ad.latitude != null &&
                              ad.longitude != null
                                ? `${ad.latitude.toFixed(
                                    4,
                                  )}, ${ad.longitude.toFixed(
                                    4,
                                  )}`
                                : "Konum belirtilmemiş"}
                            </span>

                            <strong>
                              {getGenderLabel(
                                ad.gender,
                              )}
                            </strong>
                          </div>

                          <Link
                            href={`/pet/${ad.id}`}
                            className="pet-listing-card__button"
                          >
                            Detayları görüntüle
                            <ChevronRight
                              size={17}
                            />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      marginTop: "32px",
                    }}
                  >
                    <button
                      type="button"
                      className="pet-listing-card__button"
                      style={{
                        marginTop: 0,
                        width: "auto",
                        padding: "0 16px",
                      }}
                      disabled={currentPage === 0}
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(0, page - 1),
                        )
                      }
                    >
                      <ChevronLeft size={17} />
                      Önceki
                    </button>

                    <span
                      style={{
                        color:
                          "var(--text-secondary)",
                        fontSize: "14px",
                      }}
                    >
                      {currentPage + 1} /{" "}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      className="pet-listing-card__button"
                      style={{
                        marginTop: 0,
                        width: "auto",
                        padding: "0 16px",
                      }}
                      disabled={
                        currentPage >=
                        totalPages - 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages - 1,
                              page + 1,
                            ),
                        )
                      }
                    >
                      Sonraki
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

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
            <section className="filter-group">
              <h3>Hayvan türü</h3>

              <div className="filter-chip-grid">
                {[
                  ["CAT", "Kedi"],
                  ["DOG", "Köpek"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      selectedSpecies.includes(
                        value,
                      )
                        ? "is-selected"
                        : ""
                    }
                    onClick={() =>
                      toggleSpecies(value)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-group">
              <h3>Cinsiyet</h3>

              <div className="filter-chip-grid">
                {[
                  ["MALE", "Erkek"],
                  ["FEMALE", "Dişi"],
                  ["UNKNOWN", "Bilinmiyor"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      selectedGender.includes(
                        value,
                      )
                        ? "is-selected"
                        : ""
                    }
                    onClick={() =>
                      toggleGender(value)
                    }
                  >
                    {label}
                  </button>
                ))}
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
              {filteredAds.length} sonucu göster
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
