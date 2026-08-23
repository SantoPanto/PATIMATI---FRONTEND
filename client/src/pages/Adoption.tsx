import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { getPublicAdoptions } from "../services/adoptions";
import { getPublicAds } from "../services/ads";
import type { AdResponse } from "../services/types";
import {
  getAdImage,
  getAdLocation,
  getAgeLabel,
  getGenderLabel,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";
import { getUserErrorMessage } from "../utils/errorMessage";
import "../styles/adoption.css";

// İlanlar sayfasıyla aynı sayfa boyu (listingpage.tsx).
const PAGE_SIZE = 20;

export default function Adoption() {
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [species, setSpecies] = useState("Tümü");
  const [gender, setGender] = useState("Tümü");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadAdoptions = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        let items: AdResponse[] = [];

        // 1. Try public adoptions endpoint
        try {
          const page = await getPublicAdoptions({ page: 0, size: 100 });
          if (page && Array.isArray(page.content) && page.content.length > 0) {
            items = page.content;
          }
        } catch {
          // Fallback to getPublicAds with adType=ADOPTION
        }

        // 2. Fallback to GET /api/public/ads?adType=ADOPTION
        if (items.length === 0) {
          try {
            const page = await getPublicAds({ adType: "ADOPTION", page: 0, size: 100 });
            if (page && Array.isArray(page.content)) {
              items = page.content;
            }
          } catch (err) {
            console.error("Failed to load adoption ads via fallback:", err);
          }
        }

        if (isActive) {
          setAds(
            items.filter(
              (ad) => ad && ad.active !== false,
            ),
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getUserErrorMessage(error, "Sahiplendirme ilanları yüklenemedi"),
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadAdoptions();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredAds = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("tr-TR");

    return ads.filter((ad) => {
      const searchableText = [
        ad.title,
        ad.breed,
        ad.description,
        getAdLocation(ad),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesSpecies =
        species === "Tümü" || getSpeciesLabel(ad.species) === species;
      const matchesGender =
        gender === "Tümü" || getGenderLabel(ad.gender) === gender;

      return matchesSearch && matchesSpecies && matchesGender;
    });
  }, [ads, searchTerm, species, gender]);

  // Süzgeç sonucu istemcide sayfalanır (süzgeçler tam kümenin üstünde
  // çalışmayı sürdürür). currentPage klempi: süzgeç daralıp sayfa sayısı
  // düşünce elde kalan taşkın `page` boş ekran çizmesin.
  const totalPages = Math.ceil(filteredAds.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const pagedAds = filteredAds.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const goToPreviousPage = () => {
    setPage(Math.max(0, currentPage - 1));
  };

  const goToNextPage = () => {
    setPage(
      totalPages > 0
        ? Math.min(totalPages - 1, currentPage + 1)
        : currentPage,
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSpecies("Tümü");
    setGender("Tümü");
    setPage(0);
  };

  return (
    <div className="pm-page adoption-page">
      <Header />

      <main>
        <section className="adoption-hero">
          <div className="pm-container adoption-hero__content">
            <div className="adoption-hero__text">
              <span className="adoption-hero__eyebrow">
                <Sparkles size={17} />
                Yeni bir yuva yeni bir hayat
              </span>

              <h1>
                Onlara sadece bir ev değil
                <span> sevgi dolu bir aile ver</span>
              </h1>

              <p>
                Yuva arayan dostlarımızı incele. Sana en uygun yol
                arkadaşını bul ve onun hayatını değiştir.
              </p>

              <div className="adoption-hero__actions">
                <a href="#adoption-list" className="pm-button pm-button--primary">
                  <PawPrint size={19} />
                  Dostları İncele
                </a>

                <Link
                  href="/adoption/create"
                  className="pm-button pm-button--secondary"
                >
                  <Plus size={19} />
                  Sahiplendirme İlanı Ver
                </Link>
              </div>

              <div className="adoption-hero__features">
                <span>
                  <ShieldCheck size={18} />
                  Güvenli iletişim
                </span>
                <span>
                  <Heart size={18} />
                  Ücretsiz sahiplendirme
                </span>
                <span>
                  <BadgeCheck size={18} />
                  Gerçek ve güncel ilanlar
                </span>
              </div>
            </div>

            <div className="adoption-hero__visual" aria-hidden="true">
              <div className="adoption-hero__image">
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1100&q=85"
                  alt=""
                />
              </div>

              <div className="adoption-hero__floating-card">
                <span className="adoption-hero__floating-icon">
                  <Heart size={22} fill="currentColor" />
                </span>
                <div>
                  <strong>Bir dost seni bekliyor</strong>
                  <span>Sevgi dolu bir yuva için</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="adoption-list" className="pm-container adoption-content">
          <div className="adoption-section-heading">
            <div>
              <span className="pm-eyebrow">Sahiplendirme ilanları</span>
              <h2>Yeni dostunla tanış</h2>
              <p>Sunucudaki güncel sahiplendirme ilanlarını inceleyebilirsin</p>
            </div>

            <Link
              href="/adoption/create"
              className="pm-button pm-button--primary adoption-section-heading__button"
            >
              <Plus size={19} />
              İlan Ver
            </Link>
          </div>

          <div className="adoption-filter pm-card">
            <div className="adoption-filter__search">
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(0);
                }}
                placeholder="Başlık cins veya konum ara"
                aria-label="Sahiplendirme ilanlarında ara"
              />
            </div>

            <div className="adoption-filter__selects">
              <label>
                <span>Tür</span>
                <select
                  value={species}
                  onChange={(event) => {
                    setSpecies(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="Tümü">Tüm türler</option>
                  <option value="Kedi">Kedi</option>
                  <option value="Köpek">Köpek</option>
                </select>
              </label>

              <label>
                <span>Cinsiyet</span>
                <select
                  value={gender}
                  onChange={(event) => {
                    setGender(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="Tümü">Tümü</option>
                  <option value="Dişi">Dişi</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Belirtilmemiş">Belirtilmemiş</option>
                </select>
              </label>
            </div>

            <div className="adoption-filter__bottom">
              <span>
                <strong>{filteredAds.length}</strong> ilan bulundu
              </span>
              <button
                type="button"
                className="adoption-filter__clear"
                onClick={resetFilters}
              >
                Filtreleri temizle
              </button>
            </div>
          </div>

          {isLoading ? (
            <StatusCard title="İlanlar yükleniyor" description="Lütfen bekleyin" />
          ) : errorMessage ? (
            <StatusCard title="İlanlar yüklenemedi" description={errorMessage} />
          ) : filteredAds.length > 0 ? (
            <div className="adoption-grid">
              {pagedAds.map((ad) => (
                <article key={ad.id} className="adoption-card pm-card">
                  <div className="adoption-card__image">
                    <img
                      src={getAdImage(ad)}
                      alt={`${ad.title} isimli ${getSpeciesLabel(ad.species)}`}
                    />
                    <span className="adoption-card__type">
                      <PawPrint size={15} />
                      {getSpeciesLabel(ad.species)}
                    </span>
                  </div>

                  <div className="adoption-card__content">
                    <div className="adoption-card__header">
                      <div>
                        <h3>{ad.title}</h3>
                        <p>{ad.breed || "Cins belirtilmemiş"}</p>
                      </div>
                      <span className="adoption-card__gender">
                        <UserRound size={15} />
                        {getGenderLabel(ad.gender)}
                      </span>
                    </div>

                    <div className="adoption-card__meta">
                      <span>
                        <CalendarDays size={17} />
                        {getAgeLabel(ad.ageGroup)}
                      </span>
                      <span>
                        <MapPin size={17} />
                        {getAdLocation(ad)}
                      </span>
                    </div>

                    <p className="adoption-card__description">
                      {ad.description || "Açıklama eklenmemiş"}
                    </p>

                    <div className="adoption-card__health">
                      <span className="adoption-health-badge adoption-health-badge--info">
                        <CalendarDays size={15} />
                        {getRelativeDate(ad.createdAt)}
                      </span>
                      {ad.microchipped && (
                        <span className="adoption-health-badge adoption-health-badge--success">
                          <ShieldCheck size={15} />
                          Mikroçipli
                        </span>
                      )}
                    </div>

                    <div className="adoption-card__actions">
                      <Link
                        href={`/adoption/${ad.id}`}
                        className="pm-button pm-button--secondary"
                      >
                        Detayları Gör
                      </Link>
                      <Link
                        href={`/adoption/${ad.id}`}
                        className="pm-button pm-button--primary"
                      >
                        <Heart size={18} />
                        Sahiplen
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <StatusCard
              title="Aramana uygun ilan bulunamadı"
              description="Filtreleri değiştirerek tekrar deneyebilirsin"
              onReset={resetFilters}
            />
          )}

          {!isLoading && !errorMessage && totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-3"
              aria-label="Sahiplendirme ilanı sayfaları"
            >
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="min-w-24 text-center text-sm font-medium text-[#64748B] dark:text-slate-400">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight size={20} />
              </button>
            </nav>
          )}

          <section className="adoption-safety">
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
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatusCard({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
}) {
  return (
    <div className="adoption-empty pm-card" role="status">
      <span className="adoption-empty__icon">
        <Search size={32} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onReset && (
        <button
          type="button"
          className="pm-button pm-button--primary"
          onClick={onReset}
        >
          Filtreleri Temizle
        </button>
      )}
    </div>
  );
}