import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Heart,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PetListingCard from "../components/PetListingCard";
import { request } from "../services/api";
import type { AdResponse, AdType, Page } from "../services/types";
import { getAdLocation, getSpeciesLabel } from "../utils/adPresentation";
import "../App.css";

// Backend'in /api/favorites/me ucu, favorinin altındaki ilanı farklı sarmalayıcı
// alan adlarıyla (veya doğrudan) döndürebiliyor -- normalizasyon bunu tolere eder.
type FavoriteEntry = {
  ad?: AdResponse;
  pet?: AdResponse;
  listing?: AdResponse;
  id?: unknown;
  adType?: unknown;
};

type FavoriteCategory =
  | "Tümü"
  | "Kayıp"
  | "Bulundu"
  | "Sahiplendirme"
  | "Yardım";

const categoryToAdType: Record<Exclude<FavoriteCategory, "Tümü">, AdType> = {
  Kayıp: "LOST",
  Bulundu: "FOUND",
  Sahiplendirme: "ADOPTION",
  Yardım: "HELP",
};

const categories: FavoriteCategory[] = [
  "Tümü",
  "Kayıp",
  "Bulundu",
  "Sahiplendirme",
  "Yardım",
];

export default function FavoritesPage() {
  const [, navigate] = useLocation();

  const [favorites, setFavorites] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FavoriteCategory>("Tümü");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await request<Page<FavoriteEntry>>(
          "/api/favorites/me?size=50",
          { requiresAuth: true },
        );

        const rawList = data.content || [];
        const normalizedAds: AdResponse[] = rawList
          .map((item) => {
            const adObj: AdResponse | null =
              item?.ad || item?.pet || item?.listing ||
              (item?.id && item?.adType ? (item as unknown as AdResponse) : null);
            return adObj;
          })
          .filter((ad): ad is AdResponse => ad !== null);

        if (isActive) {
          setFavorites(normalizedAds);
        }
      } catch (err) {
        console.error("Favoriler yüklenirken hata oluştu:", err);
        if (isActive) setFavorites([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadFavorites();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredFavorites = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr-TR");

    return favorites.filter((ad) => {
      const matchesCategory =
        selectedCategory === "Tümü" ||
        ad.adType === categoryToAdType[selectedCategory as Exclude<FavoriteCategory, "Tümü">];

      const searchableText = [
        ad.title,
        ad.breed,
        getSpeciesLabel(ad.species),
        ad.description,
        getAdLocation(ad),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [favorites, searchTerm, selectedCategory]);

  const removeFromFavorites = async (adId: number) => {
    try {
      await request(`/api/favorites/${adId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      setFavorites((currentFavorites) =>
        currentFavorites.filter((ad) => ad.id !== adId),
      );
    } catch (err) {
      console.error("Favori silinemedi:", err);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Tümü");
  };

  return (
    <div className="home-page min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main className="mx-auto flex-1 w-full max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-white to-[#EFF6FF] p-5 sm:p-7 dark:from-orange-500/10 dark:via-slate-900 dark:to-blue-500/10">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FED7AA]/40" />
          <div className="absolute -bottom-12 right-28 h-32 w-32 rounded-full bg-[#BFDBFE]/30" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#F97316] shadow-sm dark:bg-slate-800">
                <Heart size={16} fill="currentColor" />
                Kaydettiğin ilanlar
              </div>

              <h1 className="mt-4 text-[30px] font-bold leading-10 sm:text-[34px]">
                Favorilerim
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base dark:text-slate-400">
                Takip etmek istediğin kayıp, bulundu ve sahiplendirme ilanlarına buradan hızlıca ulaşabilirsin.
              </p>
            </div>

            <div className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316] dark:bg-orange-500/10">
                <Heart size={23} fill="currentColor" />
              </span>

              <div>
                <span className="block text-xs font-medium text-[#64748B] dark:text-slate-400">
                  Toplam favori
                </span>

                <strong className="mt-1 block text-2xl font-bold">
                  {favorites.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="İlan başlığı, ırk veya konum ara..."
                className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white pl-12 pr-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1 lg:pb-0">
              <span className="mr-1 hidden shrink-0 items-center gap-2 text-sm font-medium text-[#64748B] sm:inline-flex dark:text-slate-400">
                <SlidersHorizontal size={17} />
                Filtrele
              </span>

              {categories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#FED7AA] ${
                      isSelected
                        ? "bg-[#F97316] text-[#ffffff] shadow-sm"
                        : "border border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FDBA74] hover:bg-[#FFF7ED] hover:text-[#EA580C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-orange-500/10"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Favori ilanların</h2>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
              {filteredFavorites.length} ilan gösteriliyor
            </p>
          </div>

          {(searchTerm || selectedCategory !== "Tümü") && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 text-sm font-semibold text-[#F97316] transition hover:text-[#EA580C]"
            >
              Filtreleri temizle
            </button>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="pet-listings-grid mt-5">
            {filteredFavorites.map((ad) => (
              <PetListingCard
                key={ad.id}
                ad={ad}
                onRemoveFavorite={removeFromFavorites}
              />
            ))}
          </div>
        ) : (
          <EmptyFavorites
            hasFavorites={favorites.length > 0}
            onClearFilters={clearFilters}
            onExplore={() => navigate("/listings")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

type EmptyFavoritesProps = {
  hasFavorites: boolean;
  onClearFilters: () => void;
  onExplore: () => void;
};

function EmptyFavorites({
  hasFavorites,
  onClearFilters,
  onExplore,
}: EmptyFavoritesProps) {
  return (
    <section className="mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F97316] dark:bg-orange-500/10">
        {hasFavorites ? <Search size={34} /> : <Heart size={34} />}
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#0F172A] dark:text-slate-50">
        {hasFavorites
          ? "Aramana uygun ilan bulunamadı"
          : "Henüz favori ilanın yok"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B] dark:text-slate-400">
        {hasFavorites
          ? "Arama kelimelerini veya seçtiğin filtreyi değiştirerek tekrar deneyebilirsin."
          : "Beğendiğin ilanların kalp simgesine dokunarak onları buraya kaydedebilirsin."}
      </p>

      <button
        type="button"
        onClick={hasFavorites ? onClearFilters : onExplore}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 font-semibold text-white transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
      >
        {hasFavorites ? (
          <>
            Filtreleri temizle
            <SlidersHorizontal size={18} />
          </>
        ) : (
          <>
            İlanları keşfet
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </section>
  );
}