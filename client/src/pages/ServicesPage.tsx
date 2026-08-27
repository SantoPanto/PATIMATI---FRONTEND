import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  PawPrint,
  Phone,
  ShoppingBag,
  Star,
  Stethoscope,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ServiceHero from "../components/ServiceHero";
import { useAuth } from "../contexts/AuthContext";
import { getMyBusinessApplication } from "../services/businessApplications";
import { listVetClinics } from "../services/vet";
import { listPetShops } from "../services/petshop";
import { listShelters } from "../services/shelter";
import type {
  AnimalType,
  BusinessApplicationResponse,
  PetShopPublicResponse,
  ShelterPublicResponse,
  VetClinicPublicResponse,
} from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";
import { getAnimalTypeLabel } from "../utils/animalTypeLabels";
import { POI_RENKLERI } from "../utils/haritaSunum";

const BUSINESS_OWNER_ROLES = new Set(["VET", "PETSHOP", "BARINAK", "ADMIN"]);

type ServiceKind = "VET" | "PETSHOP" | "BARINAK";
type FilterType = "ALL" | ServiceKind;

type ServiceItem = {
  kind: ServiceKind;
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  averageRating: number | null;
  reviewCount: number | null;
  /** Yalnızca VET kartlarında dolu -- veterinerin baktığı hayvan türleri. */
  animalTypes: AnimalType[] | null;
};

const PAGE_SIZE = 20;
/** "Tümü" filtresinde her türden gösterilen önizleme sayısı -- üç ayrı
 * kaynağın (klinik/petshop/barınak) sayfalarını birleştirmek yerine, her
 * birinden ilk N kayıt gösterilir (İlanlar sayfasındaki tek kaynaklı
 * sayfalama burada uygulanamıyor). Belirli bir tür seçilince o türün kendi
 * dizin sayfasıyla aynı gerçek sayfalama devreye girer. */
const ALL_PREVIEW_SIZE = 8;

const FILTERS: Array<{ value: FilterType; label: string; color: string | null }> = [
  { value: "ALL", label: "Tümü", color: null },
  { value: "VET", label: "Veteriner", color: POI_RENKLERI.VETERINARY },
  { value: "PETSHOP", label: "Petshop", color: POI_RENKLERI.PET_SHOP },
  { value: "BARINAK", label: "Barınak", color: POI_RENKLERI.SHELTER },
];

/*
 * Tür rozeti rengi -- ana haritadaki POI_RENKLERI ile AYNI kaynaktan
 * (bkz. utils/haritaSunum.ts): kullanıcı bir hizmete girdiğinde haritada
 * gördüğü renkle karşılaşsın (26.08 talebi).
 */
const KIND_META: Record<
  ServiceKind,
  { label: string; icon: typeof Stethoscope; color: string; detailPath: (id: number) => string }
> = {
  VET: {
    label: "Veteriner",
    icon: Stethoscope,
    color: POI_RENKLERI.VETERINARY,
    detailPath: (id) => `/hizmetler/veteriner/${id}`,
  },
  PETSHOP: {
    label: "Petshop",
    icon: ShoppingBag,
    color: POI_RENKLERI.PET_SHOP,
    detailPath: (id) => `/hizmetler/petshop/${id}`,
  },
  BARINAK: {
    label: "Barınak",
    icon: Home,
    color: POI_RENKLERI.SHELTER,
    detailPath: (id) => `/hizmetler/barinak/${id}`,
  },
};

function toServiceItem(
  kind: ServiceKind,
  item: VetClinicPublicResponse | PetShopPublicResponse | ShelterPublicResponse,
): ServiceItem {
  return {
    kind,
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.city,
    district: item.district,
    phone: item.phone,
    workingHours: item.workingHours,
    photoUrl: item.photoUrl,
    averageRating: "averageRating" in item ? item.averageRating : null,
    reviewCount: "reviewCount" in item ? item.reviewCount : null,
    animalTypes: "animalTypes" in item ? item.animalTypes : null,
  };
}

export default function ServicesPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myApplication, setMyApplication] = useState<BusinessApplicationResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (user && BUSINESS_OWNER_ROLES.has(user.role))) {
      return;
    }
    let cancelled = false;
    getMyBusinessApplication()
      .then((application) => {
        if (!cancelled) setMyApplication(application);
      })
      .catch(() => {
        // Sessizce yok say -- CTA'nın varsayılan (başvurabilir) haliyle gösterilmesi yeterli.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const cityFilter = city.trim() || undefined;

    try {
      if (activeFilter === "ALL") {
        const [vets, shops, shelters] = await Promise.all([
          listVetClinics({ page: 0, size: ALL_PREVIEW_SIZE, city: cityFilter }),
          listPetShops({ page: 0, size: ALL_PREVIEW_SIZE, city: cityFilter }),
          listShelters({ page: 0, size: ALL_PREVIEW_SIZE, city: cityFilter }),
        ]);

        setItems([
          ...vets.content.map((item) => toServiceItem("VET", item)),
          ...shops.content.map((item) => toServiceItem("PETSHOP", item)),
          ...shelters.content.map((item) => toServiceItem("BARINAK", item)),
        ]);
        setTotalElements(vets.totalElements + shops.totalElements + shelters.totalElements);
        setTotalPages(0);
      } else if (activeFilter === "VET") {
        const response = await listVetClinics({ page, size: PAGE_SIZE, city: cityFilter });
        setItems(response.content.map((item) => toServiceItem("VET", item)));
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } else if (activeFilter === "PETSHOP") {
        const response = await listPetShops({ page, size: PAGE_SIZE, city: cityFilter });
        setItems(response.content.map((item) => toServiceItem("PETSHOP", item)));
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } else {
        const response = await listShelters({ page, size: PAGE_SIZE, city: cityFilter });
        setItems(response.content.map((item) => toServiceItem("BARINAK", item)));
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      }
    } catch (requestError) {
      console.error("Hizmetler yüklenemedi:", requestError);
      setItems([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(getUserErrorMessage(requestError, "Hizmetler yüklenirken bir hata oluştu"));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, city]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- filtre/sayfa degistiginde sunucudan veri cekmek, loadServices kendi ici setIsLoading/setError cagirir
    void loadServices();
  }, [loadServices]);

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
      totalPages > 0 ? Math.min(totalPages - 1, currentPage + 1) : currentPage,
    );
  };

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2563EB]/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={PawPrint}
        eyebrow="Hizmetler"
        title="Tüm Hizmetler"
        subtitle="PatiMati'ye kayıtlı veteriner klinikleri, petshoplar ve barınaklara buradan ulaşabilirsin."
        color="#F97316"
      />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">

        {(!user || !BUSINESS_OWNER_ROLES.has(user.role)) && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="shrink-0 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">İşletme sahibi misiniz?</p>
                {myApplication?.status === "BEKLEMEDE" ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400">Başvurunuz inceleniyor.</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Veteriner kliniği, petshop veya barınağınızı PatiMati'ye ekleyin.
                  </p>
                )}
              </div>
            </div>
            {myApplication?.status === "BEKLEMEDE" ? (
              <span className="shrink-0 rounded-full bg-orange-100 px-4 py-2 text-xs font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                İncelemede
              </span>
            ) : (
              <Link
                href="/hizmetler/isletme-basvurusu"
                className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Başvur
              </Link>
            )}
          </div>
        )}

        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Hizmet türü filtreleri"
        >
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.value;
            const style = filter.color
              ? selected
                ? { backgroundColor: filter.color, color: "#fff" }
                : { backgroundColor: `${filter.color}1a`, color: filter.color }
              : undefined;

            return (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleFilterChange(filter.value)}
                style={style}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter.color
                    ? "hover:opacity-80"
                    : selected
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mb-6 max-w-xs">
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(0);
            }}
            placeholder="İle göre filtrele (ör. Ankara)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
          {isLoading ? "Yükleniyor..." : `${totalElements} hizmet`}
        </p>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={cardClass} aria-hidden="true">
                <div className="mb-3 h-36 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
                <div className="h-5 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Bu kategoride kayıtlı bir hizmet yok.
            </p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const Icon = meta.icon;

              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={meta.detailPath(item.id)}
                  className={cardClass}
                >
                  <div className="mb-3 h-36 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                    {item.photoUrl && (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <span
                    className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon size={13} />
                    {meta.label}
                  </span>

                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    {item.name}
                  </h2>

                  {item.averageRating !== null ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {item.averageRating.toFixed(1)}
                      {item.reviewCount !== null && ` (${item.reviewCount})`}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Henüz değerlendirme yok
                    </p>
                  )}

                  {item.animalTypes && item.animalTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.animalTypes.map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {getAnimalTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                    <p className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>
                        {item.address}
                        {item.district ? `, ${item.district}` : ""}, {item.city}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={16} className="shrink-0" />
                      {item.phone}
                    </p>
                    {item.workingHours && (
                      <p className="flex items-center gap-2">
                        <Clock size={16} className="shrink-0" />
                        {item.workingHours}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && !error && activeFilter !== "ALL" && totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Hizmet sayfaları"
          >
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={page === 0}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Önceki sayfa"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="min-w-24 text-center text-sm font-medium text-[#64748B] dark:text-slate-400">
              {page + 1} / {totalPages}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={page >= totalPages - 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Sonraki sayfa"
            >
              <ChevronRight size={20} />
            </button>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}
