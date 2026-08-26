import { Clock, MapPin, Phone, Send, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import MapPicker from "../components/MapPicker";
import ServiceHero from "../components/ServiceHero";
import StarRating from "../components/StarRating";
import VetClinicReviewsSection from "../components/VetClinicReviewsSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/api";
import type { VetClinicPublicResponse, VetCustomerRequestStatus } from "../services/types";
import { getVetClinic } from "../services/vet";
import { getMyRequestStatus, sendVetCustomerRequest } from "../services/vetCustomers";
import { getAnimalTypeLabel } from "../utils/animalTypeLabels";

export default function VetDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [clinic, setClinic] = useState<VetClinicPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requestStatus, setRequestStatus] = useState<VetCustomerRequestStatus | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const clinicId = Number(id);
    if (!id || Number.isNaN(clinicId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getVetClinic(clinicId)
      .then(async (data) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          setNotFound(true);
          return;
        }
        setClinic(data);

        if (isAuthenticated) {
          const status = await getMyRequestStatus(data.vetUserId).catch(() => null);
          if (!cancelled) {
            setRequestStatus(status);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Klinik bilgileri yüklenirken bir hata oluştu.");
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
  }, [id, isAuthenticated]);

  const handleSendRequest = async () => {
    if (!clinic) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setErrorMessage(null);
    setIsSending(true);
    try {
      const response = await sendVetCustomerRequest(clinic.vetUserId);
      setRequestStatus(response.status);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "İstek gönderilirken bir hata oluştu.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const hasLocation =
    clinic !== null && clinic.latitude !== null && clinic.longitude !== null;

  const buttonLabel = !isAuthenticated
    ? "Giriş Yap"
    : requestStatus === "PENDING"
      ? "İstek Gönderildi"
      : requestStatus === "ACCEPTED"
        ? "Müşterisiniz"
        : requestStatus === "REJECTED"
          ? "Tekrar İstek Gönder"
          : "Müşteri İsteği Gönder";

  const buttonDisabled = isSending || requestStatus === "PENDING" || requestStatus === "ACCEPTED";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={Stethoscope}
        eyebrow="Veteriner Kliniği"
        title={clinic?.name ?? "Veteriner Kliniği"}
        color="#2563eb"
      />

      <main className="mx-auto max-w-[700px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : notFound ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Klinik bulunamadı.</p>
          </div>
        ) : clinic ? (
          <>
            <div className={cardClass}>
              <div className="mb-4 h-52 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {clinic.photoUrl && (
                  <img src={clinic.photoUrl} alt={clinic.name} className="h-full w-full object-cover" />
                )}
              </div>

              {hasLocation && (
                <div className="mb-4">
                  <MapPicker readOnly latitude={clinic.latitude} longitude={clinic.longitude} />
                </div>
              )}

              <div className="space-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {clinic.address}
                    {clinic.district ? `, ${clinic.district}` : ""}, {clinic.city}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  {clinic.phone}
                </p>
                {clinic.workingHours && (
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="shrink-0" />
                    {clinic.workingHours}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={clinic.averageRating ?? 0} readOnly size={16} />
                  <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {clinic.reviewCount > 0 && clinic.averageRating !== null
                      ? `${clinic.averageRating.toFixed(1)} (${clinic.reviewCount})`
                      : "Henüz değerlendirme yok"}
                  </span>
                </div>
              </div>

              {clinic.animalTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {clinic.animalTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-[#2563EB]/20"
                    >
                      {getAnimalTypeLabel(type)}
                    </span>
                  ))}
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendRequest}
                disabled={buttonDisabled}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {buttonLabel}
              </button>
            </div>

            <div className={`${cardClass} mt-5`}>
              <h2 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Puanlar ve Yorumlar
              </h2>
              <VetClinicReviewsSection clinicId={clinic.id} />
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
