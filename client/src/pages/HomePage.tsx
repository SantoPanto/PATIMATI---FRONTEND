import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CirclePlus,
  Heart,
  LocateFixed,
  MapPin,
  MessageCircle,
  PawPrint,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  UserRound,
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

  const { user, isAuthenticated, isAuthLoading, logout } = useAuth();

  const userDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Kullanıcı";

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

  if (isAuthLoading) {
    return (
      <div className="home-page">
        <div className="page-container" style={{ padding: "80px 24px" }}>
          Oturum kontrol ediliyor...
        </div>
      </div>
    );
  }

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
                    <strong>{userDisplayName}</strong>
                  </span>
                </Link>

                <button
                  type="button"
                  className="login-link"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  Çıkış Yap
                </button>
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
                <span>Topluluk gücüyle daha hızlı kavuşma</span>
              </div>

              <h1>
                Bir ilan, bin umut.
                <span> Onları birlikte bulalım.</span>
              </h1>

              <p>
                Kayıp ve bulunan hayvanları konum, fotoğraf ve topluluk
                desteğiyle hızlıca eşleştir. Güvenli iletişim kur, daha fazla
                kişiye ulaş.
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

        <section className="page-container -mt-8 relative z-10" aria-label="Platform özeti">
          <div className="grid gap-3 rounded-[28px] border border-[#FED7AA] bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur md:grid-cols-3 md:p-5">
            <div className="flex items-center gap-4 rounded-2xl bg-[#FFF7ED] px-5 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#F97316] shadow-sm">
                <LocateFixed size={24} />
              </span>
              <div>
                <strong className="block text-base text-[#0F172A]">Konuma göre keşfet</strong>
                <span className="text-sm text-[#64748B]">Yakınındaki güncel ilanları gör</span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-[#F0FDF4] px-5 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#16A34A] shadow-sm">
                <Clock3 size={24} />
              </span>
              <div>
                <strong className="block text-base text-[#0F172A]">Dakikalar içinde yayınla</strong>
                <span className="text-sm text-[#64748B]">Kolay adımlarla ilanını oluştur</span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-[#EFF6FF] px-5 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm">
                <ShieldCheck size={24} />
              </span>
              <div>
                <strong className="block text-base text-[#0F172A]">Güvenli iletişim</strong>
                <span className="text-sm text-[#64748B]">Bilgilerin her zaman kontrolünde</span>
              </div>
            </div>
          </div>
        </section>

        <section className="page-container py-14 sm:py-18" aria-labelledby="smart-eye-title">
          <div className="relative overflow-hidden rounded-[34px] border border-[#FED7AA] bg-[#0F172A] px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:px-10 sm:py-10 lg:px-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F97316]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-3xl" />
            <PawPrint className="pointer-events-none absolute -right-8 bottom-0 rotate-[-14deg] text-white/[0.035]" size={250} />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-[#FDBA74] backdrop-blur">
                  <Sparkles size={16} />
                  PATIMATI Akıllı Göz
                </div>

                <h2 id="smart-eye-title" className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[44px]">
                  Bir fotoğraf yükle,
                  <span className="text-[#FB923C]"> en benzer ilanları saniyeler içinde bul.</span>
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-[#CBD5E1] sm:text-lg">
                  Yapay zekâ; tür, cins, tüy rengi, desen, tasma ve belirgin işaretleri analiz ederek kayıp ve bulunan ilanlarını benzerlik oranına göre sıralar.
                </p>

                <div className="mt-7 flex flex-wrap gap-3 text-sm text-[#E2E8F0]">
                  {["Fotoğraftan analiz", "Akıllı eşleştirme", "Benzerlik yüzdesi"].map((feature) => (
                    <span key={feature} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2">
                      <CheckCircle2 size={16} className="text-[#4ADE80]" />
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/ai-search"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 py-4 font-bold text-white shadow-[0_14px_35px_rgba(249,115,22,0.32)] transition hover:-translate-y-0.5 hover:bg-[#EA580C]"
                  >
                    <Camera size={20} />
                    Fotoğrafla eşleşme ara
                    <ChevronRight size={19} />
                  </Link>

                  <Link
                    href="/ai-search"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/15"
                  >
                    <ScanSearch size={20} />
                    Akıllı Göz'ü keşfet
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[470px]">
                <div className="rounded-[30px] border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="relative overflow-hidden rounded-[24px] bg-white">
                    <img
                      src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=90"
                      alt="Yapay zekâ ile eşleştirilen örnek kedi"
                      className="h-56 w-full object-cover sm:h-64"
                    />

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#0F172A]/85 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                      <ScanSearch size={15} className="text-[#FB923C]" />
                      Görsel analiz tamamlandı
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">En güçlü eşleşme</span>
                          <strong className="mt-1 block text-lg text-[#0F172A]">Luna · British Shorthair</strong>
                        </div>
                        <span className="rounded-xl bg-[#DCFCE7] px-3 py-2 text-lg font-extrabold text-[#15803D]">%98</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[['Tür', 'Kedi'], ['Renk', 'Gri'], ['Tasma', 'Var']].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3 text-center">
                        <span className="block text-xs text-[#94A3B8]">{label}</span>
                        <strong className="mt-1 block text-sm text-white">{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -left-4 top-16 hidden rounded-2xl border border-white/20 bg-white px-4 py-3 shadow-xl sm:block">
                  <span className="text-xs font-semibold text-[#64748B]">2. eşleşme</span>
                  <strong className="block text-[#0F172A]">%91 benzer</strong>
                </div>

                <div className="absolute -right-3 bottom-16 hidden rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 shadow-xl sm:block">
                  <span className="text-xs font-semibold text-[#C2410C]">12 özellik</span>
                  <strong className="block text-[#7C2D12]">AI tarafından incelendi</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

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

        <section className="page-container py-14 sm:py-20">
          <div className="overflow-hidden rounded-[32px] bg-[#0F172A] px-6 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-10 lg:px-14">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#FDBA74]">
                  <PawPrint size={16} />
                  PATIMATI nasıl çalışır?
                </span>
                <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
                  Üç basit adımda daha fazla kişiye ulaş.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#CBD5E1]">
                  İlanını oluştur, konumuyla birlikte yayınla ve topluluktan gelen
                  bildirimleri tek yerden takip et.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { number: "01", title: "İlanını paylaş", text: "Fotoğraf ve temel bilgileri ekle.", icon: CirclePlus },
                  { number: "02", title: "Çevrene ulaş", text: "Konuma göre ilgili kişilere görün.", icon: LocateFixed },
                  { number: "03", title: "Güvenle iletişim kur", text: "Mesajları platform içinden yönet.", icon: MessageCircle },
                ].map((step) => {
                  const StepIcon = step.icon;

                  return (
                    <article
                      key={step.number}
                      className="group rounded-3xl border border-white/10 bg-white/[0.06] p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.10]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                          <StepIcon size={21} />
                        </span>
                        <span className="text-sm font-bold text-white/35">{step.number}</span>
                      </div>
                      <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">{step.text}</p>
                      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#FDBA74]">
                        <CheckCircle2 size={16} />
                        Hızlı ve kolay
                      </div>
                    </article>
                  );
                })}
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

      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="page-container py-10 sm:py-12">
          <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2"
                aria-label="PATIMATI ana sayfa"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <PawPrint size={24} strokeWidth={2.4} />
                </span>

                <span className="text-xl font-bold text-[#0F172A]">
                  PATI<span className="text-[#F97316]">MATI</span>
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-[#64748B]">
                Kayıp, bulunan ve sahiplendirilecek hayvanları güvenli iletişim
                ile doğru kişilere ulaştıran topluluk platformu.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Keşfet
              </h3>

              <nav className="mt-4 flex flex-col gap-3" aria-label="Footer keşfet">
                <Link
                  href="/listings"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  İlanlar
                </Link>

                <Link
                  href="/map"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Harita
                </Link>

                <Link
                  href="/adoption"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Sahiplendirme
                </Link>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                PATIMATI
              </h3>

              <nav className="mt-4 flex flex-col gap-3" aria-label="Footer kurumsal">
                <Link
                  href="/safety"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Güvenlik
                </Link>

                <Link
                  href="/about"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Hakkımızda
                </Link>

                <Link
                  href="/contact"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  İletişim
                </Link>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Yasal
              </h3>

              <nav className="mt-4 flex flex-col gap-3" aria-label="Footer yasal">
                <Link
                  href="/privacy"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Gizlilik
                </Link>

                <Link
                  href="/terms"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Kullanım Koşulları
                </Link>
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#E2E8F0] pt-6 text-sm text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 PATIMATI. Tüm hakları saklıdır.</p>

            <p>Minik dostlarımız için birlikte.</p>
          </div>
        </div>
      </footer>

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