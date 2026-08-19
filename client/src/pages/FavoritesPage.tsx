import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  MapPin,
  PawPrint,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

type FavoriteCategory =
  | "Tümü"
  | "Kayıp"
  | "Bulundu"
  | "Sahiplendirme";

type FavoriteListing = {
  id: number;
  title: string;
  animalName: string;
  category: Exclude<FavoriteCategory, "Tümü">;
  breed: string;
  location: string;
  date: string;
  image: string;
  description: string;
};

const favoriteListings: FavoriteListing[] = [
  {
    id: 1,
    title: "Kayıp Golden Retriever",
    animalName: "Tarçın",
    category: "Kayıp",
    breed: "Golden Retriever",
    location: "İzmit, Kocaeli",
    date: "2 saat önce",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
    description:
      "Turuncu tasmalı, insanlara karşı oldukça sakin ve yaklaşılabilir.",
  },
  {
    id: 2,
    title: "Bulunan Tekir Kedi",
    animalName: "İsimsiz",
    category: "Bulundu",
    breed: "Tekir",
    location: "Gebze, Kocaeli",
    date: "Dün",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
    description:
      "Mahalle parkında bulundu. Boynunda mavi renkli bir tasma bulunuyor.",
  },
  {
    id: 3,
    title: "Yeni Yuvasını Arayan Dostumuz",
    animalName: "Mia",
    category: "Sahiplendirme",
    breed: "British Shorthair",
    location: "Kadıköy, İstanbul",
    date: "3 gün önce",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
    description:
      "Aşıları tamamlanmış, ev yaşamına alışkın ve oyuncu bir kedidir.",
  },
  {
    id: 4,
    title: "Kayıp Beyaz Köpek",
    animalName: "Bulut",
    category: "Kayıp",
    breed: "Samoyed",
    location: "Başiskele, Kocaeli",
    date: "5 gün önce",
    image:
      "https://images.unsplash.com/photo-1529429617124-95b109e86bb8?auto=format&fit=crop&w=900&q=80",
    description:
      "Beyaz tüylü, kırmızı tasmalı ve oldukça hareketli bir köpektir.",
  },
];

const categories: FavoriteCategory[] = [
  "Tümü",
  "Kayıp",
  "Bulundu",
  "Sahiplendirme",
];

export default function FavoritesPage() {
  const [, navigate] = useLocation();

  const [favorites, setFavorites] =
    useState<FavoriteListing[]>(favoriteListings);

  const [selectedCategory, setSelectedCategory] =
    useState<FavoriteCategory>("Tümü");

  const [searchTerm, setSearchTerm] = useState("");

  const filteredFavorites = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("tr-TR");

    return favorites.filter((listing) => {
      const matchesCategory =
        selectedCategory === "Tümü" ||
        listing.category === selectedCategory;

      const searchableText = [
        listing.title,
        listing.animalName,
        listing.breed,
        listing.location,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [favorites, searchTerm, selectedCategory]);

  const removeFromFavorites = (listingId: number) => {
    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (listing) => listing.id !== listingId,
      ),
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Tümü");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-white to-[#EFF6FF] p-5 sm:p-7">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FED7AA]/40" />

          <div className="absolute -bottom-12 right-28 h-32 w-32 rounded-full bg-[#BFDBFE]/30" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#F97316] shadow-sm">
                <Heart size={16} fill="currentColor" />
                Kaydettiğin ilanlar
              </div>

              <h1 className="mt-4 text-[30px] font-bold leading-10 sm:text-[34px]">
                Favorilerim
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                Takip etmek istediğin kayıp, bulunan ve
                sahiplendirme ilanlarına buradan hızlıca
                ulaşabilirsin.
              </p>
            </div>

            <div className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                <Heart size={23} fill="currentColor" />
              </span>

              <div>
                <span className="block text-xs font-medium text-[#64748B]">
                  Toplam favori
                </span>

                <strong className="mt-1 block text-2xl font-bold">
                  {favorites.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="İsim, cins veya konum ara..."
                className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white pl-12 pr-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="mr-1 hidden shrink-0 items-center gap-2 text-sm font-medium text-[#64748B] sm:inline-flex">
                <SlidersHorizontal size={17} />
                Filtrele
              </span>

              {categories.map((category) => {
                const isSelected =
                  selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                    className={`h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#FED7AA] ${
                      isSelected
                        ? "bg-[#F97316] text-white shadow-sm"
                        : "border border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FDBA74] hover:bg-[#FFF7ED] hover:text-[#EA580C]"
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
            <h2 className="text-xl font-semibold">
              Favori ilanların
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              {filteredFavorites.length} ilan gösteriliyor.
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

        {filteredFavorites.length > 0 ? (
          <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFavorites.map((listing) => (
              <FavoriteCard
                key={listing.id}
                listing={listing}
                onRemove={() =>
                  removeFromFavorites(listing.id)
                }
                onDetail={() =>
                  navigate(`/pet/${listing.id}`)
                }
              />
            ))}
          </section>
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

type FavoriteCardProps = {
  listing: FavoriteListing;
  onRemove: () => void;
  onDetail: () => void;
};

function FavoriteCard({
  listing,
  onRemove,
  onDetail,
}: FavoriteCardProps) {
  const categoryStyle = getCategoryStyle(listing.category);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#FED7AA] hover:shadow-lg">
      <div className="relative h-52 overflow-hidden bg-[#F1F5F9]">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${categoryStyle}`}
          >
            {listing.category}
          </span>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Favorilerden kaldır"
            title="Favorilerden kaldır"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#EF4444] shadow-md transition hover:scale-105 hover:bg-[#FEF2F2] focus:outline-none focus:ring-4 focus:ring-[#FECACA]"
          >
            <Heart size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F97316]">
              {listing.breed}
            </p>

            <h3 className="mt-1 truncate text-lg font-bold text-[#0F172A]">
              {listing.animalName}
            </h3>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
            <PawPrint size={20} />
          </span>
        </div>

        <p className="mt-2 line-clamp-1 text-sm font-medium text-[#334155]">
          {listing.title}
        </p>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#64748B]">
          {listing.description}
        </p>

        <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-4">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <MapPin
              size={17}
              className="shrink-0 text-[#3B82F6]"
            />

            <span className="truncate">
              {listing.location}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <CalendarDays
              size={17}
              className="shrink-0 text-[#F97316]"
            />

            <span>{listing.date}</span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] transition hover:bg-[#FEE2E2] focus:outline-none focus:ring-4 focus:ring-[#FECACA]"
            aria-label="Favorilerden kaldır"
            title="Favorilerden kaldır"
          >
            <Trash2 size={18} />
          </button>

          <button
            type="button"
            onClick={onDetail}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 text-sm font-semibold text-white transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
          >
            İlanı görüntüle
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </article>
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
    <section className="mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F97316]">
        {hasFavorites ? (
          <Search size={34} />
        ) : (
          <Heart size={34} />
        )}
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#0F172A]">
        {hasFavorites
          ? "Aramana uygun ilan bulunamadı"
          : "Henüz favori ilanın yok"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
        {hasFavorites
          ? "Arama kelimelerini veya seçtiğin filtreyi değiştirerek tekrar deneyebilirsin."
          : "Beğendiğin ilanların kalp simgesine dokunarak onları buraya kaydedebilirsin."}
      </p>

      <button
        type="button"
        onClick={
          hasFavorites ? onClearFilters : onExplore
        }
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

function getCategoryStyle(
  category: FavoriteListing["category"],
): string {
  switch (category) {
    case "Kayıp":
      return "bg-[#FEF2F2] text-[#DC2626]";

    case "Bulundu":
      return "bg-[#EFF6FF] text-[#2563EB]";

    case "Sahiplendirme":
      return "bg-[#F0FDF4] text-[#15803D]";

    default:
      return "bg-white text-[#0F172A]";
  }
}