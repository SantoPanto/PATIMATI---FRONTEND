import { Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import MapPicker from "../components/MapPicker";
import PetShopReviewsSection from "../components/PetShopReviewsSection";
import ServiceHero from "../components/ServiceHero";
import StarRating from "../components/StarRating";
import Footer from "../components/Footer";
import Header from "../components/Header";
import type { PetShopProductResponse, PetShopPublicResponse } from "../services/types";
import { getPetShop } from "../services/petshop";
import { listShopProducts } from "../services/petshopProducts";

const FEATURED_PRODUCT_COUNT = 3;

/**
 * Petshop detay sayfası -- `VetDetailPage.tsx` deseni ama:
 * - "Müşteri İsteği Gönder" butonu/`requestStatus` mantığı YOK.
 * - Dükkan bilgisi + salt-okunur harita konumunun altına "Öne Çıkan
 *   Ürünler" önizlemesi (ilk `FEATURED_PRODUCT_COUNT` ürün) + tüm ürünleri
 *   `/hizmetler/petshop/{id}/urunler` sayfasında görme butonu eklenir (her
 *   ürün kartı tıklaması -> /hizmetler/petshop/{shopId}/urun/{productId}).
 * - Dükkan SEVİYESİNDE yorum bölümü en altta (`PetShopReviewsSection`) --
 *   ürün bazlı yorumlardan (ürün detay sayfasında) BAĞIMSIZ.
 */
export default function PetShopDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [shop, setShop] = useState<PetShopPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<PetShopProductResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const shopId = Number(id);
    if (!id || Number.isNaN(shopId)) {
      setNotFound(true);
      setIsLoading(false);
      setIsLoadingProducts(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsLoadingProducts(true);

    getPetShop(shopId)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          setNotFound(true);
          return;
        }
        setShop(data);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Petshop bilgileri yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    listShopProducts(shopId, { size: FEATURED_PRODUCT_COUNT })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage((prev) => prev ?? "Ürünler yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const hasLocation = shop !== null && shop.latitude !== null && shop.longitude !== null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={ShoppingBag}
        eyebrow="Petshop"
        title={shop?.name ?? "Petshop"}
        color="#7c3aed"
      />

      <main className="mx-auto max-w-[700px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Petshop bulunamadı.</p>
          </div>
        ) : shop ? (
          <>
            <div className={cardClass}>
              <div className="mb-4 h-52 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {shop.photoUrl && (
                  <img src={shop.photoUrl} alt={shop.name} className="h-full w-full object-cover" />
                )}
              </div>

              {hasLocation && (
                <div className="mb-4">
                  <MapPicker readOnly latitude={shop.latitude} longitude={shop.longitude} />
                </div>
              )}

              <div className="space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {shop.address}
                    {shop.district ? `, ${shop.district}` : ""}, {shop.city}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  {shop.phone}
                </p>
                {shop.workingHours && (
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="shrink-0" />
                    {shop.workingHours}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={shop.averageRating ?? 0} readOnly size={16} />
                  <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {shop.reviewCount > 0 && shop.averageRating !== null
                      ? `${shop.averageRating.toFixed(1)} (${shop.reviewCount})`
                      : "Henüz değerlendirme yok"}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                  {errorMessage}
                </div>
              )}
            </div>

            <div className={`${cardClass} mt-5`}>
              <h2 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Öne Çıkan Ürünler
              </h2>

              {isLoadingProducts ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Bu dükkanda henüz bir ürün yok.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/hizmetler/petshop/${shop.id}/urun/${product.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          navigate(`/hizmetler/petshop/${shop.id}/urun/${product.id}`);
                        }
                      }}
                      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-[#2563EB]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                      <p className="text-sm font-bold text-[#2563EB]">
                        ₺{product.price.toFixed(2)}
                      </p>
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

              <Link
                href={`/hizmetler/petshop/${shop.id}/urunler`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#7c3aed]/30 px-4 py-3 text-sm font-bold text-[#7c3aed] transition hover:bg-[#7c3aed]/5"
              >
                Tüm Ürünleri Gör
              </Link>
            </div>

            <div className={`${cardClass} mt-5`}>
              <h2 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Puanlar ve Yorumlar
              </h2>
              <PetShopReviewsSection petShopId={shop.id} />
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
