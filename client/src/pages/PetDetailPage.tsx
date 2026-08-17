import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ComplaintModal from "../components/ComplaintModal";
import { getPublicAdById } from "../services/ads";
import { downloadLostPoster } from "../services/posters";
import type { AdResponse, AdType } from "../services/types";
import {
  getAdImage,
  getAdLocation,
  getAgeLabel,
  getGenderLabel,
  getOwnerInitials,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";
import { getUserErrorMessage } from "../utils/errorMessage";
import "../App.css";

function getAdTypeBadge(adType: AdType) {
  switch (adType) {
    case "LOST":
      return {
        label: "Kayıp İlanı",
        className: "bg-rose-100 text-rose-700 border-rose-200",
      };
    case "FOUND":
      return {
        label: "Bulunan Dost",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "ADOPTION":
      return {
        label: "Sahiplendirme",
        className: "bg-orange-100 text-orange-700 border-orange-200",
      };
    default:
      return {
        label: "İlan",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

function formatCollarStatus(status: string, collarColor?: string): string {
  if (status === "PRESENT") {
    return collarColor ? `Tasmalı (${collarColor})` : "Tasmalı";
  }
  if (status === "ABSENT") {
    return "Tasmasız";
  }
  return "Tasma durumu bilinmiyor";
}

function formatPattern(pattern?: string): string {
  if (!pattern) return "";
  const patterns: Record<string, string> = {
    SOLID: "Tek Renk",
    BICOLOR: "Çift Renk",
    TRICOLOR: "Üç Renk",
    TABBY: "Tekir / Çizgili",
    SPOTTED: "Benekli",
    HARLEQUIN: "Alaca / Parçalı",
    OTHER: "Diğer Desen",
  };
  return patterns[pattern] || pattern;
}

export default function PetDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [ad, setAd] = useState<AdResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isPosterDownloading, setIsPosterDownloading] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);

  const adId = id ? Number(id) : NaN;
  const isValidId = !Number.isNaN(adId) && adId > 0;

  const fetchAdDetail = useCallback(async () => {
    if (!isValidId) {
      setError("Geçersiz ilan kimliği.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getPublicAdById(adId);
      if (!data) {
        throw new Error("İlan bulunamadı.");
      }
      setAd(data);
      setSelectedPhotoIndex(0);
    } catch (err) {
      console.error("İlan detayı alınırken hata oluştu:", err);
      setError(
        getUserErrorMessage(err, "İlan bilgileri yüklenirken bir sorun oluştu."),
      );
      setAd(null);
    } finally {
      setIsLoading(false);
    }
  }, [adId, isValidId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ilan id'si degistiginde sunucudan veri cekmek (dis sistemle senkronizasyon), fetchAdDetail kendi ici setIsLoading/setError cagirir
    void fetchAdDetail();
  }, [fetchAdDetail]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title || "PATIMATI İlanı",
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openChat = () => {
    if (ad) {
      navigate(`/chat/${ad.ownerId}?adId=${ad.id}`);
    }
  };

  const handleDownloadPoster = async () => {
    if (!ad || ad.adType !== "LOST") {
      return;
    }

    setIsPosterDownloading(true);
    setPosterError(null);

    try {
      await downloadLostPoster(ad.id);
    } catch (err) {
      console.error("Kayıp afişi indirilirken hata oluştu:", err);
      setPosterError(
        getUserErrorMessage(
          err,
          "Kayıp afişi indirilirken bir sorun oluştu.",
        ),
      );
    } finally {
      setIsPosterDownloading(false);
    }
  };

  // 1. YÜKLENİYOR DURUMU (LOADING UI)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="page-container py-10 sm:py-16">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
              <div className="space-y-4">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. HATA VEYA İLAN BULUNAMADI DURUMU (404 UI HANDLE)
  if (error || !ad) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="page-container flex min-h-[65vh] items-center justify-center py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-[#F97316]">
              <Search size={38} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              İlan Bulunamadı
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {error ||
                "Aradığınız ilan sistemden kaldırılmış veya hiç var olmamış olabilir."}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/listings")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#EA580C]"
              >
                <ArrowLeft size={18} />
                Tüm İlanlara Dön
              </button>

              <button
                type="button"
                onClick={() => void fetchAdDetail()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. İLAN DETAYI BAŞARILI DURUMU (SUCCESS UI)
  const badgeInfo = getAdTypeBadge(ad.adType);
  const photos =
    Array.isArray(ad.photoUrls) && ad.photoUrls.length > 0
      ? ad.photoUrls
      : [getAdImage(ad)];

  const currentPhoto = photos[selectedPhotoIndex] || photos[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="page-container py-8 sm:py-12">
        {/* Üst Gezinti / Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/listings")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#F97316]"
          >
            <ArrowLeft size={18} />
            İlanlar Sayfasına Dön
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => navigate("/listings")}
              className="hover:underline"
            >
              İlanlar
            </button>
            <ChevronRight size={14} />
            <span className="max-w-[200px] truncate font-medium text-slate-700 sm:max-w-xs">
              {ad.title}
            </span>
          </div>
        </div>

        {/* Ana İlan Kartı & Galeri Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Sol Kolon: Fotoğraflar & Galeri (5 Kolon) */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-[1/1]">
                <img
                  src={currentPhoto}
                  alt={ad.title}
                  className="h-full w-full object-cover transition-all duration-300"
                />

                {/* Rozetler */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-md ${badgeInfo.className}`}
                  >
                    <PawPrint size={14} />
                    {badgeInfo.label}
                  </span>

                  {ad.aiStatus === "DONE" && ad.aiIsPet === true && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                      <Sparkles size={14} />
                      AI Doğrulandı
                    </span>
                  )}
                </div>

                {/* Aksiyon Butonları (Favori / Paylaş) */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFavorite((prev) => !prev)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition ${
                      isFavorite
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-white/60 bg-white/90 text-slate-700 hover:text-rose-500"
                    }`}
                    aria-label="Favorilere ekle"
                  >
                    <Heart
                      size={20}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-700 shadow-md transition hover:text-[#F97316]"
                    aria-label="İlanı paylaş"
                  >
                    <Share2 size={19} />
                  </button>
                </div>

                {copied && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
                    Bağlantı kopyalandı!
                  </div>
                )}
              </div>

              {/* Küçük Resim Seçici (Thumbnails) */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-4">
                  {photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        selectedPhotoIndex === idx
                          ? "border-[#F97316] ring-2 ring-[#F97316]/20"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photoUrl}
                        alt={`${ad.title} - ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon: Detaylar & Sahip Bilgileri (7 Kolon) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Ana Başlık & Özeti */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                {getSpeciesLabel(ad.species)} · {ad.breed || "Cins Belirtilmemiş"}
              </span>

              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {ad.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#F97316]" />
                  {getAdLocation(ad)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  {getRelativeDate(ad.createdAt)}
                </span>

                {ad.lostDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={15} className="text-rose-500" />
                    Kayıp Tarihi: {ad.lostDate}
                  </span>
                )}
              </div>

              {/* Temel Bilgiler Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                  <span className="block text-[11px] font-semibold text-slate-400">
                    CİNSİYET
                  </span>
                  <strong className="mt-1 block text-sm font-bold text-slate-800">
                    {getGenderLabel(ad.gender)}
                  </strong>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                  <span className="block text-[11px] font-semibold text-slate-400">
                    YAŞ GRUBU
                  </span>
                  <strong className="mt-1 block text-sm font-bold text-slate-800">
                    {getAgeLabel(ad.ageGroup)}
                  </strong>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                  <span className="block text-[11px] font-semibold text-slate-400">
                    DESEN
                  </span>
                  <strong className="mt-1 block truncate text-sm font-bold text-slate-800">
                    {formatPattern(ad.coatPattern)}
                  </strong>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                  <span className="block text-[11px] font-semibold text-slate-400">
                    MİKROÇİP
                  </span>
                  <strong className="mt-1 block text-sm font-bold text-slate-800">
                    {ad.microchipped ? "Var" : "Yok"}
                  </strong>
                </div>
              </div>

              {/* Açıklama Metni */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-base font-bold text-slate-900">
                  İlan Açıklaması
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {ad.description || "Bu ilan için bir açıklama girilmemiş."}
                </p>
              </div>

              {/* Ek Özellikler & Etiketler */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                {ad.microchipped && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <ShieldCheck size={15} />
                    Mikroçipli Dost
                  </span>
                )}

                {ad.collarStatus && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    <Tag size={14} />
                    {formatCollarStatus(ad.collarStatus, ad.collarColor)}
                  </span>
                )}

                {ad.colors && ad.colors.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                    <BadgeCheck size={15} />
                    Renk: {ad.colors.join(", ")}
                  </span>
                )}

                {ad.eyeColor && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <Eye size={14} />
                    Göz Rengi: {ad.eyeColor}
                  </span>
                )}
              </div>
            </div>

            {/* Ayırt Edici Özellikler (Varsa) */}
            {ad.distinctiveMarks && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-base font-bold text-slate-900">
                  Ayırt Edici Özellikler
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {ad.distinctiveMarks}
                </p>
              </div>
            )}

            {/* Kayıp Afişi PDF - yalnızca LOST ilanlarda gösterilir */}
            {ad.adType === "LOST" && (
              <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Kayıp Afişi
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      QR kodlu kayıp afişini PDF olarak indirip paylaşabilir veya yazdırabilirsin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDownloadPoster()}
                    disabled={isPosterDownloading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={19} />
                    {isPosterDownloading
                      ? "PDF hazırlanıyor..."
                      : "Kayıp Afişi İndir (PDF)"}
                  </button>
                </div>

                {posterError && (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {posterError}
                  </p>
                )}
              </div>
            )}

            {/* İlan Sahibi & İletişim Kartı */}
            <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316] font-bold text-white shadow-md">
                    {getOwnerInitials(ad.ownerDisplayName || "İlan Sahibi")}
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      İLAN SAHİBİ
                    </span>
                    <h4 className="text-lg font-bold text-slate-900">
                      {ad.ownerDisplayName || "Kullanıcı"}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={openChat}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#EA580C]"
                >
                  <MessageCircle size={19} />
                  Mesaj Gönder
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/map")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-3.5 font-bold text-[#F97316] shadow-sm transition hover:bg-orange-100"
                >
                  <MapPin size={19} />
                  Haritada Gör
                </button>

                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 font-bold text-rose-700 shadow-sm transition hover:bg-rose-100"
                >
                  <Flag size={19} />
                  Şikayet Et
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {ad && (
        <ComplaintModal
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          targetType={ad.adType === "ADOPTION" ? "ADOPTION" : "AD"}
          targetId={ad.id}
          targetTitle={ad.title}
        />
      )}
    </div>
  );
}
