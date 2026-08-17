import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";

import Footer from "../components/Footer";
import Header from "../components/Header";
import ComplaintModal from "../components/ComplaintModal";
import { useAuth } from "../contexts/AuthContext";
import { getPublicAdoptionById } from "../services/adoptions";
import { createOrGetChatRoom } from "../services/messages";
import type { AdResponse } from "../services/types";
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

export default function AdoptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [ad, setAd] = useState<AdResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const adId = Number(id);
  const hasValidId = Number.isInteger(adId) && adId > 0;

  const currentUserId = user?.id ?? user?.uid;
  const isOwner = Boolean(currentUserId && ad?.ownerId && Number(currentUserId) === Number(ad.ownerId));


  useEffect(() => {
    let isActive = true;

    if (!hasValidId) {
      return () => {
        isActive = false;
      };
    }

    const loadAd = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await getPublicAdoptionById(adId);

        if (response.adType !== "ADOPTION" || !response.active) {
          throw new Error("Bu sahiplendirme ilanı artık yayında değil.");
        }

        if (isActive) setAd(response);
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getUserErrorMessage(error, "Sahiplendirme ilanı yüklenemedi."),
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadAd();

    return () => {
      isActive = false;
    };
  }, [adId, hasValidId]);

  const openConversation = async () => {
    if (!ad || !ad.ownerId) return;

    const partnerId = Number(ad.ownerId);
    if (currentUserId && Number(currentUserId) === partnerId) {
      alert("Kendinizle sohbet odası oluşturamazsınız.");
      return;
    }

    try {
      await createOrGetChatRoom(partnerId);
      navigate(`/chat/${partnerId}?adId=${ad.id}`);
    } catch (err) {
      console.error("Sohbet odası oluşturulamadı:", err);
      alert(getUserErrorMessage(err, "Sohbet odası oluşturulurken bir hata oluştu."));
    }
  };

  if (!hasValidId) {
    return (
      <DetailStatus
        title="İlan bulunamadı"
        description="Geçersiz ilan numarası."
        onBack={() => navigate("/adoption")}
      />
    );
  }

  if (isLoading) {
    return <DetailStatus title="İlan yükleniyor" description="Lütfen bekleyin..." />;
  }

  if (!ad || errorMessage) {
    return (
      <DetailStatus
        title="İlan bulunamadı"
        description={
          errorMessage ||
          "Bu sahiplendirme ilanı kaldırılmış veya artık yayında olmayabilir."
        }
        onBack={() => navigate("/adoption")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/adoption")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
          >
            <ArrowLeft size={19} />
            Sahiplendirme ilanlarına dön
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Sahiplendirme</span>
            <ChevronRight size={15} />
            <span className="font-medium text-slate-600">{ad.title}</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[420px] overflow-hidden bg-slate-100 lg:min-h-[620px]">
              <img
                src={getAdImage(ad)}
                alt={`${ad.title} isimli ${getSpeciesLabel(ad.species)}`}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/55 to-transparent p-5 sm:p-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm backdrop-blur">
                  <PawPrint size={16} className="text-orange-500" />
                  {getSpeciesLabel(ad.species)}
                </span>

                <button
                  type="button"
                  onClick={() => setIsFavorite((value) => !value)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/40 shadow-sm backdrop-blur transition ${
                    isFavorite
                      ? "bg-rose-500 text-white"
                      : "bg-white/90 text-slate-700 hover:text-rose-500"
                  }`}
                  aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                >
                  <Heart size={21} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-9">
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">Yuva arıyor</span>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{ad.title}</h1>
              <p className="mt-2 text-lg text-slate-500">{ad.breed || "Cins belirtilmemiş"}</p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <Info label="Cinsiyet" value={getGenderLabel(ad.gender)} icon={<UserRound size={19} />} />
                <Info label="Yaş" value={getAgeLabel(ad.ageGroup)} icon={<CalendarDays size={19} />} />
                <Info label="Konum" value={getAdLocation(ad)} icon={<MapPin size={19} />} />
                <Info label="Yayın" value={getRelativeDate(ad.createdAt)} icon={<CalendarDays size={19} />} />
              </div>

              <div className="mt-7 border-t border-slate-100 pt-7">
                <h2 className="text-lg font-bold text-slate-900">İlan açıklaması</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                  {ad.description || "Bu ilan için açıklama eklenmemiş."}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {ad.microchipped && <DetailBadge icon={<ShieldCheck size={16} />} text="Mikroçipli" />}
                {ad.colors.map((color) => (
                  <DetailBadge key={color} icon={<BadgeCheck size={16} />} text={`Renk: ${color}`} />
                ))}
                {ad.eyeColor && <DetailBadge icon={<BadgeCheck size={16} />} text={`Göz: ${ad.eyeColor}`} />}
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                      {getOwnerInitials(ad.ownerDisplayName)}
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">İlan sahibi</span>
                      <p className="font-bold text-slate-800">{ad.ownerDisplayName}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {!isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={openConversation}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3.5 font-bold text-orange-600 transition hover:bg-orange-100"
                      >
                        <MessageCircle size={19} />
                        Mesaj Gönder
                      </button>
                      <button
                        type="button"
                        onClick={openConversation}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white transition hover:bg-orange-600"
                      >
                        <Heart size={19} />
                        Sahiplenmek İstiyorum
                      </button>
                    </>
                  ) : (
                    <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-semibold flex items-center justify-center">
                      Bu ilan size aittir. Kendi ilanınıza mesaj gönderemezsiniz.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsComplaintModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    <Flag size={19} />
                    Şikayet Et
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {ad.distinctiveMarks && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Ayırt edici özellikler</h2>
            <p className="mt-3 leading-7 text-slate-600">{ad.distinctiveMarks}</p>
          </section>
        )}
      </main>

      <Footer />

      {ad && (
        <ComplaintModal
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          targetType="ADOPTION"
          targetId={ad.id}
          targetTitle={ad.title}
        />
      )}
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-orange-500">{icon}</div>
      <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <strong className="mt-1 block break-words text-sm text-slate-800">{value}</strong>
    </div>
  );
}

function DetailBadge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
      {icon}
      {text}
    </span>
  );
}

function DetailStatus({ title, description, onBack }: { title: string; description: string; onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="flex min-h-[65vh] items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm" role="status">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <PawPrint size={32} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 leading-7 text-slate-500">{description}</p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-7 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Sahiplendirme ilanlarına dön
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
