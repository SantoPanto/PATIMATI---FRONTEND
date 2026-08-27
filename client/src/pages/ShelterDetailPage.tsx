import { Clock, Home, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import MapPicker from "../components/MapPicker";
import ServiceHero from "../components/ServiceHero";
import ShelterReviewsSection from "../components/ShelterReviewsSection";
import StarRating from "../components/StarRating";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getShelter, listShelterAdoptions } from "../services/shelter";
import type { AdResponse, ShelterPublicResponse } from "../services/types";
import {
  getAdDetailPath,
  getAdImage,
  getBreedLabel,
  getSpeciesLabel,
} from "../utils/adPresentation";

const FEATURED_ADOPTION_COUNT = 3;

/**
 * Barınak detay sayfası -- Vet (yorumlar) ve Petshop (ürün/ilan grid'i)
 * desenlerinin ikisini birden içerir (plan §15):
 * - Kart bilgisi + salt-okunur harita konumu (`PetShopDetailPage` deseni).
 * - `<ShelterReviewsSection shelterId={shelter.id} />` -- barınak
 *   SEVİYESİNDE puanlama, ilan bazlı DEĞİL.
 * - Sahiplendirme ilanları grid'i -- yalnız son `FEATURED_ADOPTION_COUNT`
 *   (Petshop'taki "öne çıkan ürünler" deseniyle AYNI) + tüm ilanları
 *   `/hizmetler/barinak/{id}/ilanlar` sayfasında görme butonu. Önizlemedeki
 *   her kart tıklaması `getAdDetailPath(ad)`'e (mevcut `/pet/{id}` rotası)
 *   gider -- Petshop'un aksine barınağa özel yeni bir ilan-detay rotası YOK.
 * - "Müşteri İsteği Gönder" butonu YOK (Petshop ile aynı, plan §10).
 */
export default function ShelterDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [shelter, setShelter] = useState<ShelterPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [ads, setAds] = useState<AdResponse[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);

  useEffect(() => {
    const shelterId = Number(id);
    if (!id || Number.isNaN(shelterId)) {
      setNotFound(true);
      setIsLoading(false);
      setIsLoadingAds(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsLoadingAds(true);

    getShelter(shelterId)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          setNotFound(true);
          return;
        }
        setShelter(data);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Barınak bilgileri yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    listShelterAdoptions(shelterId, { size: FEATURED_ADOPTION_COUNT })
      .then((page) => {
        if (!cancelled) {
          setAds(page.content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage((prev) => prev ?? "İlanlar yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAds(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const hasLocation = shelter !== null && shelter.latitude !== null && shelter.longitude !== null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={Home}
        eyebrow="Barınak"
        title={shelter?.name ?? "Barınak"}
        color="#0d9488"
      />

      <main className="mx-auto max-w-[700px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Barınak bulunamadı.</p>
          </div>
        ) : shelter ? (
          <>
            <div className={cardClass}>
              <div className="mb-4 h-52 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {shelter.photoUrl && (
                  <img src={shelter.photoUrl} alt={shelter.name} className="h-full w-full object-cover" />
                )}
              </div>

              {hasLocation && (
                <div className="mb-4">
                  <MapPicker readOnly latitude={shelter.latitude} longitude={shelter.longitude} />
                </div>
              )}

              <div className="space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {shelter.address}
                    {shelter.district ? `, ${shelter.district}` : ""}, {shelter.city}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  {shelter.phone}
                </p>
                {shelter.workingHours && (
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="shrink-0" />
                    {shelter.workingHours}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={shelter.averageRating ?? 0} readOnly size={16} />
                  <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {shelter.reviewCount > 0 && shelter.averageRating !== null
                      ? `${shelter.averageRating.toFixed(1)} (${shelter.reviewCount})`
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
                Son Sahiplendirme İlanları
              </h2>

              {isLoadingAds ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
              ) : ads.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Bu barınakta şu anda sahiplendirme ilanı yok.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(getAdDetailPath(ad))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          navigate(getAdDetailPath(ad));
                        }
                      }}
                      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-[#2563EB]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="mb-2 h-24 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
                        <img
                          src={getAdImage(ad)}
                          alt={ad.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="truncate text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {ad.title}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {getSpeciesLabel(ad.species)} · {getBreedLabel(ad.breed)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/hizmetler/barinak/${shelter.id}/ilanlar`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#0d9488]/30 px-4 py-3 text-sm font-bold text-[#0d9488] transition hover:bg-[#0d9488]/5"
              >
                Tüm İlanları Gör
              </Link>
            </div>

            <div className={`${cardClass} mt-5`}>
              <h2 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Puanlar ve Yorumlar
              </h2>
              <ShelterReviewsSection shelterId={shelter.id} />
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
