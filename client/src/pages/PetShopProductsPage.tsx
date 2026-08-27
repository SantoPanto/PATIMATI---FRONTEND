import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ServiceHero from "../components/ServiceHero";
import StarRating from "../components/StarRating";
import type { PetShopProductResponse, PetShopPublicResponse } from "../services/types";
import { getPetShop } from "../services/petshop";
import { listShopProducts } from "../services/petshopProducts";

const PAGE_SIZE = 20;

/**
 * Bir petshop'un TÜM ürünlerini sayfalı grid'de gösterir --
 * `PetShopDetailPage.tsx`'teki "Öne Çıkan Ürünler" önizlemesinin "Tüm
 * Ürünleri Gör" butonuyla açtığı sayfa. Sayfalama kontrolleri
 * `ServicesPage.tsx`'teki desenle aynı; kart/grid `PetShopDetailPage.tsx`'teki
 * ürün kartıyla aynı.
 */
export default function PetShopProductsPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [shop, setShop] = useState<PetShopPublicResponse | null>(null);
  const [products, setProducts] = useState<PetShopProductResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shopId = Number(id);

  useEffect(() => {
    if (!id || Number.isNaN(shopId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getPetShop(shopId)
      .then((data) => {
        if (!cancelled) {
          if (!data) {
            setNotFound(true);
            return;
          }
          setShop(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Petshop bilgileri yüklenirken bir hata oluştu.");
        }
      });

    listShopProducts(shopId, { page, size: PAGE_SIZE })
      .then((response) => {
        if (!cancelled) {
          setProducts(response.content);
          setTotalPages(response.totalPages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage((prev) => prev ?? "Ürünler yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  const goToPreviousPage = () => setPage((current) => Math.max(0, current - 1));
  const goToNextPage = () =>
    setPage((current) => (totalPages > 0 ? Math.min(totalPages - 1, current + 1) : current));

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={ShoppingBag}
        eyebrow="Petshop"
        title={shop ? `${shop.name} — Tüm Ürünler` : "Tüm Ürünler"}
        color="#7c3aed"
      />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Petshop bulunamadı.</p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className={cardClass}>
                <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
              </div>
            ) : products.length === 0 ? (
              <div className={cardClass}>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Bu dükkanda henüz bir ürün yok.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/hizmetler/petshop/${shopId}/urun/${product.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        navigate(`/hizmetler/petshop/${shopId}/urun/${product.id}`);
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-[#7c3aed]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-2 h-24 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
                      {product.photoUrl && (
                        <img
                          src={product.photoUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <p className="truncate text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-[#2563EB]">₺{product.price.toFixed(2)}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <StarRating value={product.averageRating ?? 0} readOnly size={12} />
                      {product.reviewCount > 0 && product.averageRating !== null && (
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          ({product.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="Ürün sayfaları"
              >
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={page === 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F172A] transition hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
