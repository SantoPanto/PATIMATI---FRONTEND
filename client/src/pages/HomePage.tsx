import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  ChevronRight,
  CirclePlus,
  Heart,
  LogIn,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

type ListingType = "lost" | "found" | "adoption";
type FilterType = "all" | ListingType;
type UserMode = "guest" | "user";

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
  featured?: boolean;
}

const listings: PetListing[] = [
  {
    id: 1,
    name: "Luna",
    animal: "Kedi",
    breed: "British Shorthair",
    location: "Nilüfer, Bursa",
    distance: "1,2 km",
    date: "Bugün",
    type: "lost",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    name: "İsmi bilinmiyor",
    animal: "Köpek",
    breed: "Golden Retriever",
    location: "Osmangazi, Bursa",
    distance: "2,8 km",
    date: "2 saat önce",
    type: "found",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    name: "Maviş",
    animal: "Kuş",
    breed: "Muhabbet Kuşu",
    location: "Yıldırım, Bursa",
    distance: "4,1 km",
    date: "Dün",
    type: "lost",
    image:
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    name: "Tarçın",
    animal: "Kedi",
    breed: "Tekir",
    location: "Görükle, Bursa",
    distance: "5,3 km",
    date: "Dün",
    type: "adoption",
    image:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=85",
  },
];

export default function HomePage() {
  const [, navigate] = useLocation();

  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  /*
    Backend JWT entegrasyonu gelene kadar geçici kontrol.

    Gerçek sistemde örnek:
    const token = localStorage.getItem("accessToken");
    const userMode = token ? "user" : "guest";
  */
  const userMode: UserMode = localStorage.getItem("accessToken")
    ? "user"
    : "guest";

  const isAuthenticated = userMode === "user";

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesFilter =
        activeFilter === "all" || listing.type === activeFilter;

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

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchValue]);

  const requireAuth = (targetPath: string) => {
    if (isAuthenticated) {
      navigate(targetPath);
      return;
    }

    const redirectPath = encodeURIComponent(targetPath);
    navigate(`/login?redirect=${redirectPath}`);
  };

  const toggleFavorite = (listingId: number) => {
    if (!isAuthenticated) {
      requireAuth(`/pet/${listingId}`);
      return;
    }

    setFavoriteIds((currentIds) =>
      currentIds.includes(listingId)
        ? currentIds.filter((id) => id !== listingId)
        : [...currentIds, listingId],
    );
  };

  const handleGoogleLogin = () => {
    /*
      Spring Security OAuth2 endpoint.

      Backend hazır olduğunda URL örneği:
      http://localhost:8080/oauth2/authorization/google
    */

    window.location.href =
      "http://localhost:8080/oauth2/authorization/google";
  };

  const getListingStatus = (type: ListingType) => {
    if (type === "lost") return "Kayıp";
    if (type === "found") return "Bulundu";

    return "Sahiplendirme";
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="page-container home-header__content">
          <Link href="/" className="brand" aria-label="PATIMATI ana sayfa">
            <span className="brand__icon">
              <PawPrint size={24} strokeWidth={2.4} />
            </span>

            <span className="brand__text">
              PATI<span>MATI</span>
            </span>
          </Link>

          <nav className="desktop-navigation" aria-label="Ana navigasyon">
            <Link href="/listings">İlanlar</Link>
            <Link href="/map">Harita</Link>
            <Link href="/adoption">Sahiplendirme</Link>
          </nav>

          <div className="home-header__actions">
            {isAuthenticated ? (
              <>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Bildirimleri görüntüle"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell size={21} />
                  <span className="notification-dot" />
                </button>

                <Link href="/profile" className="profile-button">
                  <span className="profile-button__avatar">
                    <UserRound size={19} />
                  </span>

                  <span className="profile-button__text">
                    <small>Hoş geldin</small>
                    <strong>Kullanıcı</strong>
                  </span>
                </Link>
              </>
            ) : (
              <div className="auth-actions">
                <Link href="/login" className="login-link">
                  Giriş Yap
                </Link>

                <Link href="/register" className="register-link">
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

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
                <span> birlikte bulalım.</span>
              </h1>

              <p>
                Kayıp, bulunan ve sahiplendirilecek hayvan ilanlarını incele.
                Yakınındaki dostlara ulaş ve güvenli iletişim kur.
              </p>

              <div className="hero-search">
                <Search size={21} aria-hidden="true" />

                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="İsim, tür, konum veya ırk ara..."
                  aria-label="İlanlarda arama yap"
                />

                <button type="button" aria-label="Arama filtrelerini aç">
                  <SlidersHorizontal size={19} />
                  <span>Filtrele</span>
                </button>
              </div>

              <div className="hero-actions">
                <button
                  type="button"
                  className="hero-primary-action"
                  onClick={() => requireAuth("/add-listing")}
                >
                  <CirclePlus size={20} />
                  İlan oluştur
                </button>

                <Link href="/map" className="hero-secondary-action">
                  <MapPin size={20} />
                  Haritada ara
                </Link>
              </div>

              {!isAuthenticated && (
                <div className="guest-access-card">
                  <div className="guest-access-card__icon">
                    <LogIn size={20} />
                  </div>

                  <div className="guest-access-card__content">
                    <strong>Hesabın olmadan da inceleyebilirsin</strong>
                    <span>
                      Misafir olarak ilanları ve haritayı görüntüleyebilirsin.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/listings")}
                  >
                    Misafir devam et
                  </button>
                </div>
              )}

              <div className="hero-location">
                <MapPin size={16} />
                <span>Konumunuz:</span>
                <strong>Bursa</strong>
                <button type="button">Değiştir</button>
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
                    <strong>Mutlu haber!</strong>
                    <p>Pamuk ailesine kavuştu.</p>
                  </div>

                  <ShieldCheck size={22} />
                </div>
              </div>

              <div className="floating-card floating-card--top">
                <div className="floating-card__icon floating-card__icon--orange">
                  <MapPin size={20} />
                </div>

                <div>
                  <strong>1.248+</strong>
                  <span>Aktif ilan</span>
                </div>
              </div>

              <div className="floating-card floating-card--bottom">
                <div className="floating-card__icon floating-card__icon--green">
                  <Heart size={20} />
                </div>

                <div>
                  <strong>386</strong>
                  <span>Mutlu kavuşma</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="page-container login-options-section">
            <div className="login-options-card">
              <div className="login-options-card__content">
                <span className="section-eyebrow">PATIMATI hesabı</span>

                <h2>Daha fazla özellik için giriş yap</h2>

                <p>
                  İlan oluşturmak, mesajlaşmak, favori eklemek, bölgesel
                  bildirim almak ve ilanlarını yönetmek için hesabına giriş yap.
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

                <Link href="/login" className="email-login-button">
                  E-posta ile giriş yap
                </Link>

                <Link href="/register" className="create-account-link">
                  Hesabın yok mu? Kayıt ol
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="page-container quick-actions-section">
          <div className="section-heading section-heading--center">
            <span className="section-eyebrow">Hızlı başlangıç</span>
            <h2>Nasıl yardımcı olabiliriz?</h2>

            <p>
              Durumuna uygun ilan türünü seçerek birkaç adımda paylaşım
              oluşturabilirsin.
            </p>
          </div>

          <div className="quick-actions-grid quick-actions-grid--three">
            <button
              type="button"
              className="quick-action-card quick-action-card--lost"
              onClick={() => requireAuth("/add-listing?type=lost")}
            >
              <div className="quick-action-card__icon">
                <Search size={28} />
              </div>

              <div className="quick-action-card__content">
                <span className="quick-action-card__label">Kayıp ilanı</span>
                <h3>Dostumu kaybettim</h3>

                <p>
                  Fotoğrafını ve son görüldüğü konumu paylaşarak aramayı
                  başlat.
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
              onClick={() => requireAuth("/add-listing?type=found")}
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
                  ulaşmasına yardımcı ol.
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
              onClick={() => requireAuth("/add-listing?type=adoption")}
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
                  Sahiplendirilecek dostun için güvenilir bir yuva bul.
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

        <section className="listings-section">
          <div className="page-container">
            <div className="section-heading-row">
              <div className="section-heading">
                <span className="section-eyebrow">
                  Çevrendeki dostlar
                </span>

                <h2>Yakındaki ilanlar</h2>

                <p>
                  Konumuna yakın, güncel kayıp, bulunan ve sahiplendirme
                  ilanları.
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
                className={activeFilter === "adoption" ? "active" : ""}
                onClick={() => setActiveFilter("adoption")}
              >
                Sahiplendirme
              </button>
            </div>

            {filteredListings.length > 0 ? (
              <div className="pet-listings-grid">
                {filteredListings.map((listing) => {
                  const isFavorite = favoriteIds.includes(listing.id);

                  return (
                    <article className="pet-listing-card" key={listing.id}>
                      <Link
                        href={`/pet/${listing.id}`}
                        className="pet-listing-card__image"
                      >
                        <img src={listing.image} alt={listing.name} />

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
                          isFavorite ? "favorite-button--active" : ""
                        }`}
                        onClick={() => toggleFavorite(listing.id)}
                        aria-label={
                          isFavorite
                            ? `${listing.name} ilanını favorilerden çıkar`
                            : `${listing.name} ilanını favorilere ekle`
                        }
                      >
                        <Heart
                          size={20}
                          fill={isFavorite ? "currentColor" : "none"}
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
            ) : (
              <div className="empty-listings">
                <span>
                  <Search size={28} />
                </span>

                <h3>Aramana uygun ilan bulunamadı</h3>

                <p>
                  Farklı bir isim, konum veya hayvan türü aramayı dene.
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

        <section className="page-container safety-section">
          <div className="safety-card">
            <div className="safety-card__icon">
              <ShieldCheck size={32} />
            </div>

            <div className="safety-card__content">
              <span>Güvenli iletişim</span>

              <h2>İletişim bilgilerin senin kontrolünde.</h2>

              <p>
                İlan sahipleriyle PATIMATI mesajlaşma sistemi üzerinden
                iletişime geçebilirsin. Telefon numarası gibi hassas bilgiler
                otomatik olarak filtrelenir.
              </p>
            </div>

            <Link href="/safety" className="safety-card__button">
              Güvenlik rehberini incele
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobil navigasyon">
        <Link href="/" className="mobile-bottom-nav__item active">
          <PawPrint size={23} />
          <span>Ana Sayfa</span>
        </Link>

        <Link href="/listings" className="mobile-bottom-nav__item">
          <Search size={23} />
          <span>İlanlar</span>
        </Link>

        <button
          type="button"
          className="mobile-bottom-nav__add"
          aria-label="Yeni ilan oluştur"
          onClick={() => requireAuth("/add-listing")}
        >
          <CirclePlus size={28} />
        </button>

        <Link href="/map" className="mobile-bottom-nav__item">
          <MapPin size={23} />
          <span>Harita</span>
        </Link>

        <button
          type="button"
          className="mobile-bottom-nav__item"
          onClick={() => requireAuth("/profile")}
        >
          <UserRound size={23} />
          <span>Profil</span>
        </button>
      </nav>
    </div>
  );
}