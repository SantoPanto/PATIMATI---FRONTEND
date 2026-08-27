import { ChevronLeft, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import PetShopProductReviewsSection from "../components/PetShopProductReviewsSection";
import StarRating from "../components/StarRating";
import Footer from "../components/Footer";
import Header from "../components/Header";
import type { PetShopProductResponse } from "../services/types";
import { getPublicProduct } from "../services/petshopProducts";

/**
 * Ürün detay sayfası (yeni, vet'te karşılığı yok -- vet'te yorumlar klinik
 * detay sayfasındaydı, burada ürün bazlı olduğu için kendi sayfası
 * gerekiyor). Rota parametreleri `{shopId, productId}`; `getPublicProduct`
 * ile yükler, isim/fiyat/açıklama/fotoğraf + ortalama puan rozeti +
 * `<PetShopProductReviewsSection productId={product.id} />`;
 * `/hizmetler/petshop/{shopId}`'e geri dönüş linki (plan §12).
 */
export default function PetShopProductDetailPage() {
  const { shopId, productId } = useParams<{ shopId?: string; productId?: string }>();

  const [product, setProduct] = useState<PetShopProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const numericProductId = Number(productId);
    if (!productId || Number.isNaN(numericProductId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getPublicProduct(numericProductId)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          setNotFound(true);
          return;
        }
        setProduct(data);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Ürün bilgileri yüklenirken bir hata oluştu.");
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
  }, [productId]);

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const backHref = `/hizmetler/petshop/${shopId ?? product?.petShopId ?? ""}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main className="mx-auto max-w-[700px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed]"
        >
          <ChevronLeft size={16} />
          Dükkana dön
        </Link>

        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Ürün bulunamadı.</p>
          </div>
        ) : product ? (
          <>
            <div className={cardClass}>
              <div className="mb-4 h-52 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {product.photoUrl && (
                  <img src={product.photoUrl} alt={product.name} className="h-full w-full object-cover" />
                )}
              </div>

              <h1 className="flex items-center gap-2 text-[24px] font-bold leading-8 text-[#0F172A] dark:text-[#F1F5F9]">
                <Package size={22} className="text-[#7c3aed]" />
                {product.name}
              </h1>

              <p className="mt-2 text-xl font-bold text-[#7c3aed]">₺{product.price.toFixed(2)}</p>

              {product.description && (
                <p className="mt-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {product.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={product.averageRating ?? 0} readOnly size={16} />
                  <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {product.reviewCount > 0 && product.averageRating !== null
                      ? `${product.averageRating.toFixed(1)} (${product.reviewCount})`
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
                Puanlar ve Yorumlar
              </h2>
              <PetShopProductReviewsSection productId={product.id} />
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
