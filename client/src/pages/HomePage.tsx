import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { startGoogleOAuth } from "../services/auth";
import { getPublicAds, getPublicAdCounters } from "../services/ads";
import type { AdResponse } from "../services/types";
import {
  getAdDetailPath,
  getAdImage,
  getAdLocation,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";
import { getUserErrorMessage } from "../utils/errorMessage";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../App.css";
import {
  Camera,
  ChevronRight,
  CirclePlus,
  Heart,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";

type ListingType = "lost" | "found" | "adoption";
type FilterType = "all" | ListingType;

interface PetListing {
  id: number;
  name: string;
  animal: string;
  breed: string;
  location: string;
  distance: string;
  date: string;
  type: ListingType;
  image: string;
  detailPath: string;
  featured?: boolean;
}

function toPetListing(ad: AdResponse): PetListing {
  return {
    id: ad.id,
    name: ad.title,
    animal: getSpeciesLabel(ad.species),
    breed: ad.breed || "Cins belirtilmemiş",
    location: getAdLocation(ad),
    distance: "—",
    date: getRelativeDate(ad.createdAt),
    type: ad.adType.toLocaleLowerCase("tr-TR") as ListingType,
    image: getAdImage(ad),
    detailPath: getAdDetailPath(ad),
  };
}

export default function HomePage() {
  const [, navigate] = useLocation();

  const [searchValue, setSearchValue] = useState("");
  // Arama/filtre sonuçlarının yaşadığı bölüm — Enter ve "N sonucu göster"
  // buraya kaydırır ki süzmenin bir karşılığı ekranda görünsün.
  const resultsSectionRef = useRef<HTMLElement | null>(null);
  const [listings, setListings] = useState<PetListing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState<
    ListingType[]
  >([]);
  const [maxDistance, setMaxDistance] = useState(25);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [counters, setCounters] = useState({ activeAds: 0, happyEndings: 0 });
  const [currentLocation, setCurrentLocation] = useState("Bursa");
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    let isActive = true;

    const loadListings = async () => {
      try {
        setIsListingsLoading(true);
        setListingsError("");
        const page = await getPublicAds({ page: 0, size: 12 });

        if (isActive) {
          setListings(
            page.content
              .filter((ad) => ad.active)
              .map(toPetListing),
          );
        }
      } catch (error) {
        if (isActive) {
          setListingsError(
            getUserErrorMessage(error, "İlanlar yüklenemedi"),
          );
        }
      } finally {
        if (isActive) setIsListingsLoading(false);
      }
    };
    const loadCounters = async () => {
    try {
      const data = await getPublicAdCounters();
      if (isActive) {
        setCounters(data);
      }
    } catch (error) {
      console.error("Sayaç bilgileri alınamadı", error);
    }
  };
    void loadListings();
    void loadCounters();
    return () => {
      isActive = false;
    };
  }, []);

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
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesQuickFilter =
        activeFilter === "all" || listing.type === activeFilter;

      const matchesListingType =
        selectedListingTypes.length === 0 ||
        selectedListingTypes.includes(listing.type);

      const matchesAnimal =
        selectedAnimals.length === 0 ||
        selectedAnimals.some(
          (selected) =>
            listing.animal
              .toLocaleLowerCase("tr-TR")
              .includes(selected.toLocaleLowerCase("tr-TR")) ||
            selected
              .toLocaleLowerCase("tr-TR")
              .includes(listing.animal.toLocaleLowerCase("tr-TR"))
        );
      const numericDistance = Number(
        listing.distance.replace(",", ".").replace(" km", ""),
      );

      const matchesDistance = Number.isFinite(numericDistance)
        ? numericDistance <= maxDistance
        : true;
      const matchesFeatured = !onlyFeatured || listing.featured === true;

      const normalizedSearch = searchValue
        .trim()
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        listing.name
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        listing.animal
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        listing.breed
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        listing.location
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);

      return (
        matchesQuickFilter &&
        matchesListingType &&
        matchesAnimal &&
        matchesDistance &&
        matchesFeatured &&
        matchesSearch
      );
    });
  }, [
    activeFilter,
    searchValue,
    selectedAnimals,
    selectedListingTypes,
    maxDistance,
    onlyFeatured,
    listings,
  ]);

  const requireAuth = (targetPath: string) => {
    navigate(targetPath);
  };

  const scrollToResults = () => {
    // behavior bilerek verilmedi: html'de scroll-behavior:smooth zaten
    // tanımlı, oradan gelir. Kodda sabitlenseydi kullanıcının hareket
    // azaltma tercihi (prefers-reduced-motion) CSS'ten kapatılamazdı.
    resultsSectionRef.current?.scrollIntoView({ block: "start" });
  };

  const toggleFavorite = (listingId: number) => {
    if (!isAuthenticated) {
      const detailPath =
        listings.find((listing) => listing.id === listingId)?.detailPath ||
        `/pet/${listingId}`;
      const redirectPath = encodeURIComponent(detailPath);
      navigate(`/login?redirect=${redirectPath}`);
      return;
    }

    setFavoriteIds((currentIds) =>
      currentIds.includes(listingId)
        ? currentIds.filter((id) => id !== listingId)
        : [...currentIds, listingId],
    );
  };

  const handleGoogleLogin = () => {
    startGoogleOAuth({ redirectPath: "/", rememberMe: false });
  };

  const getListingStatus = (type: ListingType) => {
    if (type === "lost") return "Kayıp";
    if (type === "found") return "Bulundu";

    return "Sahiplendirme";
  };

  const toggleAnimalFilter = (animal: string) => {
    setSelectedAnimals((current) =>
      current.includes(animal)
        ? current.filter((item) => item !== animal)
        : [...current, animal],
    );
  };

  const toggleListingTypeFilter = (type: ListingType) => {
    setSelectedListingTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

 const clearAdvancedFilters = () => {
    setSelectedAnimals([]);
    setSelectedListingTypes([]);
    setMaxDistance(25);
    setOnlyFeatured(false);
    setActiveFilter("all");
    setSearchValue("");
  };

  const handleChangeLocation = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum özelliğini desteklemiyor");
      return;
    }

    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=tr`,
          );

          if (!response.ok) {
            throw new Error("Konum bilgisi alınamadı");
          }

          const data = await response.json();

          const city =
            data.address?.province ||
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.county ||
            "Konumunuz";

          setCurrentLocation(city);
        } catch (error) {
          console.error("Konum adı alınamadı", error);

          setCurrentLocation(
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error("Konum alınamadı", error);

        setIsLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          alert(
            "Konum izni verilmedi. Tarayıcı ayarlarından konum iznini açabilirsiniz.",
          );
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Konum bilgisi şu anda alınamıyor");
          return;
        }

        if (error.code === error.TIMEOUT) {
          alert("Konum alınırken zaman aşımı oluştu");
          return;
        }

        alert("Konumunuz alınamadı. Lütfen tekrar deneyin.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  if (isAuthLoading) {
    return (
      <div className="home-page">
        <div
          className="page-container"
          style={{
            padding: "80px 24px",
          }}
        >
          Oturum kontrol ediliyor
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Header />

      <main>
        <section className="hero-section">
          <div className="hero-decoration hero-decoration--one" />
          <div className="hero-decoration hero-decoration--two" />

          <div className="page-container hero-section__content">
            <div className="hero-copy">
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Minik dostları yuvalarına kavuşturuyoruz</span>
              </div>

              <h1>
                Kaybolan dostlarımızı
                <span> birlikte bulalım</span>
              </h1>

              <p>
                Kayıp bulunan ve sahiplendirilecek hayvan ilanlarını incele
                Yakınındaki dostlara ulaş ve güvenli iletişim kur
              </p>

              {/* form + onSubmit: Enter'ın bir karşılığı olsun diye. Kutu
                  yazarken aşağıdaki "Yakındaki ilanlar" listesini süzüyordu
                  ama liste ekranın dışında kaldığı için kullanıcı hiçbir
                  tepki görmüyor ve aramayı bozuk sanıyordu (canlıda ekipten
                  gelen gerçek şikayet, 21.08). */}
              <form
                className="hero-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  scrollToResults();
                }}
              >
                <Search size={21} aria-hidden="true" />

                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="İsim, tür veya ırk ara"
                  aria-label="İlanlarda arama yap"
                  enterKeyHint="search"
                />

                <button
                  type="button"
                  aria-label="Arama filtrelerini aç"
                  aria-expanded={isFilterOpen}
                  onClick={() => setIsFilterOpen(true)}
                >
                  <SlidersHorizontal size={19} />
                  <span>Filtrele</span>
                </button>
              </form>

              {searchValue.trim().length > 0 && (
                <button
                  type="button"
                  className="hero-search-feedback"
                  onClick={scrollToResults}
                >
                  {filteredListings.length === 0
                    ? "Aramana uyan ilan yok — filtreleri genişletmeyi dene"
                    : `${filteredListings.length} ilan bulundu — sonuçlara in`}
                </button>
              )}

              <div className="hero-actions">
                <button
                  type="button"
                  className="hero-primary-action"
                  onClick={() => requireAuth("/lost/create")}
                >
                  <CirclePlus size={20} />
                  İlan oluştur
                </button>

                <Link href="/map" className="hero-secondary-action">
                  <MapPin size={20} />
                  Haritada ara
                </Link>
              </div>

              <div className="hero-location">
                <MapPin size={16} />

                <span>Konumunuz</span>

                <strong>
                  {isLocationLoading
                    ? "Konum alınıyor..."
                    : currentLocation}
                </strong>

                <button
                  type="button"
                  onClick={handleChangeLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? "Bekleyin" : "Değiştir"}
                </button>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-visual__glow" />

              <div className="hero-image-card">
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=90"
                  alt=""
                />

                <div className="hero-image-card__status">
                  <span className="status-avatar">
                    <PawPrint size={19} />
                  </span>

                  <div>
                    <strong>Mutlu haber</strong>
                    <p>Pamuk ailesine kavuştu</p>
                  </div>

                  <ShieldCheck size={22} />
                </div>
              </div>

              <div className="floating-card floating-card--top">
                <div className="floating-card__icon floating-card__icon--orange">
                  <MapPin size={20} />
                </div>

                <div>
                  <strong>{counters.activeAds}</strong>
                  <span>Aktif ilan</span>
                </div>
              </div>

              <div className="floating-card floating-card--bottom">
                <div className="floating-card__icon floating-card__icon--green">
                  <Heart size={20} />
                </div>

                <div>
                  <strong>{counters.happyEndings}</strong>
                  <span>Mutlu kavuşma</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-container quick-actions-section">
          <div className="section-heading section-heading--center">
            <span className="section-eyebrow">Hızlı başlangıç</span>

            <h2>Nasıl yardımcı olabiliriz</h2>

            <p>
              Durumuna uygun ilan türünü seçerek birkaç adımda paylaşım
              oluşturabilirsin
            </p>
          </div>

          <div className="quick-actions-grid quick-actions-grid--three">
            <button
              type="button"
              className="quick-action-card quick-action-card--lost"
              onClick={() => requireAuth("/lost/create")}
            >
              <div className="quick-action-card__icon">
                <Search size={28} />
              </div>

              <div className="quick-action-card__content">
                <span className="quick-action-card__label">
                  Kayıp ilanı
                </span>

                <h3>Dostumu kaybettim</h3>

                <p>
                  Fotoğrafını ve son görüldüğü konumu paylaşarak aramayı
                  başlat
                </p>

                <span className="quick-action-card__link">
                  Kayıp ilanı oluştur
                  <ChevronRight size={18} />
                </span>
              </div>

              <PawPrint
                className="quick-action-card__decoration"
                size={120}
              />
            </button>

            <button
              type="button"
              className="quick-action-card quick-action-card--found"
              onClick={() => requireAuth("/found/create")}
            >
              <div className="quick-action-card__icon">
                <CirclePlus size={28} />
              </div>

              <div className="quick-action-card__content">
                <span className="quick-action-card__label">
                  Bulunan hayvan
                </span>

                <h3>Bir dost buldum</h3>

                <p>
                  Bulduğun hayvanın bilgilerini paylaşarak ailesine
                  ulaşmasına yardımcı ol
                </p>

                <span className="quick-action-card__link">
                  Buldum ilanı oluştur
                  <ChevronRight size={18} />
                </span>
              </div>

              <Heart
                className="quick-action-card__decoration"
                size={120}
              />
            </button>

            <button
              type="button"
              className="quick-action-card quick-action-card--adoption"
              onClick={() =>
                requireAuth("/adopt/create")
              }
            >
              <div className="quick-action-card__icon">
                <Heart size={28} />
              </div>

              <div className="quick-action-card__content">
                <span className="quick-action-card__label">
                  Sahiplendirme
                </span>

                <h3>Yeni yuva arıyorum</h3>

                <p>
                  Sahiplendirilecek dostun için güvenilir bir yuva bul
                </p>

                <span className="quick-action-card__link">
                  Sahiplendirme ilanı oluştur
                  <ChevronRight size={18} />
                </span>
              </div>

              <PawPrint
                className="quick-action-card__decoration"
                size={120}
              />
            </button>
          </div>
        </section>

        <section className="listings-section" ref={resultsSectionRef}>
          <div className="page-container">
            <div className="section-heading-row">
              <div className="section-heading">
                <span className="section-eyebrow">
                  Çevrendeki dostlar
                </span>

                <h2>Yakındaki ilanlar</h2>

                <p>
                  Konumuna yakın güncel kayıp bulunan ve sahiplendirme
                  ilanları
                </p>
              </div>

              <Link href="/listings" className="view-all-link">
                Tüm ilanları gör
                <ChevronRight size={18} />
              </Link>
            </div>

            <div className="listing-filters" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === "all"}
                className={activeFilter === "all" ? "active" : ""}
                onClick={() => setActiveFilter("all")}
              >
                Tümü
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === "lost"}
                className={activeFilter === "lost" ? "active" : ""}
                onClick={() => setActiveFilter("lost")}
              >
                Kayıp
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === "found"}
                className={activeFilter === "found" ? "active" : ""}
                onClick={() => setActiveFilter("found")}
              >
                Bulunan
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === "adoption"}
                className={
                  activeFilter === "adoption" ? "active" : ""
                }
                onClick={() => setActiveFilter("adoption")}
              >
                Sahiplendirme
              </button>
            </div>

            {isListingsLoading ? (
              <div className="empty-listings" role="status">
                <span>
                  <PawPrint size={28} />
                </span>
                <h3>İlanlar yükleniyor</h3>
                <p>Sunucudaki güncel ilanlar getiriliyor</p>
              </div>
            ) : listingsError ? (
              <div className="empty-listings" role="alert">
                <span>
                  <Search size={28} />
                </span>
                <h3>İlanlar yüklenemedi</h3>
                <p>{listingsError}</p>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="pet-listings-grid">
                {filteredListings.map((listing) => {
                  const isFavorite = favoriteIds.includes(listing.id);

                  return (
                    <article
                      className="pet-listing-card"
                      key={listing.id}
                    >
                      <Link
                        href={listing.detailPath}
                        className="pet-listing-card__image"
                      >
                        <img
                          src={listing.image}
                          alt={listing.name}
                        />

                        <span
                          className={`listing-status listing-status--${listing.type}`}
                        >
                          {getListingStatus(listing.type)}
                        </span>

                        {listing.featured && (
                          <span className="listing-featured">
                            <Sparkles size={14} />
                            Öne çıkan
                          </span>
                        )}
                      </Link>

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
                            ? `${listing.name} ilanını favorilerden çıkar`
                            : `${listing.name} ilanını favorilere ekle`
                        }
                      >
                        <Heart
                          size={20}
                          fill={
                            isFavorite ? "currentColor" : "none"
                          }
                        />
                      </button>

                      <div className="pet-listing-card__body">
                        <div className="pet-listing-card__title-row">
                          <div>
                            <h3>{listing.name}</h3>

                            <p>
                              {listing.animal} · {listing.breed}
                            </p>
                          </div>

                          <span>{listing.date}</span>
                        </div>

                        <div className="pet-listing-card__location">
                          <MapPin size={17} />
                          <span>{listing.location}</span>
                          <strong>{listing.distance}</strong>
                        </div>

                        <Link
                          href={listing.detailPath}
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
            ) : (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>Aramana uygun ilan bulunamadı</h3>

                <p>
                  Farklı bir isim, konum veya hayvan türü aramayı
                  dene.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    setActiveFilter("all");
                  }}
                >
                  Filtreleri temizle
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="ai-match-section">
          <div className="page-container">
            <div className="ai-match-card">
              <div className="ai-match-card__content">
                <span className="ai-match-card__eyebrow">
                  <Sparkles size={16} />
                  Yapay zekâ destekli arama
                </span>

                <h2>Fotoğrafla benzer dostları bul</h2>

                <p>
                  Kayıp veya bulduğun hayvanın fotoğrafını yükle
                  PATIMATI mevcut ilanları karşılaştırarak en benzer
                  sonuçları senin için sıralasın
                </p>

                <div className="ai-match-card__features">
                  <span>Tür ve cins tahmini</span>
                  <span>Görsel benzerlik analizi</span>
                  <span>Benzer ilan sonuçları</span>
                </div>

                <Link
                  href="/ai-match"
                  className="ai-match-card__button"
                >
                  <Camera size={20} />
                  Fotoğrafla ara
                  <ChevronRight size={18} />
                </Link>
              </div>

              <div
                className="ai-match-card__visual"
                aria-hidden="true"
              >
                <div className="ai-match-photo ai-match-photo--back">
                  <img
                    src="https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=700&q=85"
                    alt=""
                  />
                </div>

                <div className="ai-match-photo ai-match-photo--front">
                  <img
                    src="https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=700&q=85"
                    alt=""
                  />

                  <span className="ai-match-score">
                    <Sparkles size={15} />
                    %94 eşleşme
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-container safety-section">
          <div className="safety-card">
            <div className="safety-card__icon">
              <ShieldCheck size={32} />
            </div>

            <div className="safety-card__content">
              <span>Güvenli iletişim</span>

              <h2>İletişim bilgilerin senin kontrolünde</h2>

              <p>
                İlan sahipleriyle PATIMATI mesajlaşma sistemi
                üzerinden iletişime geçebilirsin Telefon numarası
                gibi hassas bilgiler otomatik olarak filtrelenir
              </p>
            </div>

            <Link href="/safety" className="safety-card__button">
              Güvenlik rehberini incele
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="page-container login-options-section">
            <div className="login-options-card">
              <div className="login-options-card__content">
                <span className="section-eyebrow">
                  PATIMATI hesabı
                </span>

                <h2>Daha fazla özellik için giriş yap</h2>

                <p>
                  İlan oluşturmak mesajlaşmak favori eklemek
                  bölgesel bildirim almak ve ilanlarını yönetmek için
                  hesabına giriş yap
                </p>
              </div>

              <div className="login-options-card__actions">
                <button
                  type="button"
                  className="google-login-button"
                  onClick={handleGoogleLogin}
                >
                  <span className="google-icon">G</span>
                  Google ile giriş yap
                </button>

                <Link
                  href="/login"
                  className="email-login-button"
                >
                  E-posta ile giriş yap
                </Link>

                <Link
                  href="/register"
                  className="create-account-link"
                >
                  Hesabın yok mu Kayıt ol
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <div
        className={`filter-drawer-overlay ${
          isFilterOpen ? "is-open" : ""
        }`}
        aria-hidden={!isFilterOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
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
              aria-label="Filtre panelini kapat"
              onClick={() => setIsFilterOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="filter-drawer__body">
            <section className="filter-group">
              <div className="filter-group__heading">
                <h3>Mesafe</h3>
                <strong>{maxDistance} km</strong>
              </div>

              <input
                className="filter-range"
                type="range"
                min="1"
                max="25"
                value={maxDistance}
                onChange={(event) =>
                  setMaxDistance(Number(event.target.value))
                }
              />

              <div className="filter-range__labels">
                <span>1 km</span>
                <span>25 km</span>
              </div>
            </section>

            <section className="filter-group">
              <h3>Hayvan türü</h3>

              <div className="filter-chip-grid">
                {["Kedi", "Köpek", "Kuş", "Diğer"].map(
                  (animal) => (
                    <button
                      key={animal}
                      type="button"
                      className={
                        selectedAnimals.includes(animal)
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        toggleAnimalFilter(animal)
                      }
                    >
                      {animal}
                    </button>
                  ),
                )}
              </div>
            </section>

            <section className="filter-group">
              <h3>İlan türü</h3>

              <div className="filter-checkbox-list">
                {(
                  [
                    ["lost", "Kayıp"],
                    ["found", "Bulunan"],
                    ["adoption", "Sahiplendirme"],
                  ] as const
                ).map(([type, label]) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={selectedListingTypes.includes(type)}
                      onChange={() =>
                        toggleListingTypeFilter(type)
                      }
                    />

                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="filter-group">
              <label className="filter-switch-row">
                <div>
                  <strong>Sadece öne çıkanlar</strong>
                  <span>Öne çıkarılmış ilanları göster</span>
                </div>

                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(event) =>
                    setOnlyFeatured(event.target.checked)
                  }
                />
              </label>
            </section>
          </div>

          <div className="filter-drawer__footer">
            <button
              type="button"
              className="filter-clear-button"
              onClick={clearAdvancedFilters}
            >
              Temizle
            </button>

            <button
              type="button"
              className="filter-apply-button"
              onClick={() => {
                setIsFilterOpen(false);
                // "N sonucu göster" sonuçları GÖSTERMELİ: panel kapanınca
                // sayfa sonuç listesine iner (eskiden yalnız kapanıyordu ve
                // sonuçlar ekran dışında kalıyordu).
                scrollToResults();
              }}
            >
              {filteredListings.length} sonucu göster
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}