import {
  Camera,
  CheckCircle2,
  Clock,
  Home,
  Info,
  MapPin,
  PawPrint,
  ShoppingBag,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import AnimalTypeSelector from "../components/AnimalTypeSelector";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MapPicker from "../components/MapPicker";
import ServiceHero from "../components/ServiceHero";
import { ApiError } from "../services/api";
import { getMyBusinessApplication, submitBusinessApplication } from "../services/businessApplications";
import type { AnimalType, BusinessApplicationResponse, BusinessType } from "../services/types";

const MAX_FILE_SIZE_MB = 5;

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300";
const cardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string; icon: typeof Stethoscope }> = [
  { value: "VET", label: "Veteriner", icon: Stethoscope },
  { value: "PETSHOP", label: "Petshop", icon: ShoppingBag },
  { value: "BARINAK", label: "Barınak", icon: Home },
];

export default function BusinessApplicationFormPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [existingApplication, setExistingApplication] = useState<BusinessApplicationResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyBusinessApplication()
      .then((application) => {
        if (!cancelled) {
          setExistingApplication(application);
        }
      })
      .catch(() => {
        // Sessizce forma düş -- başvuru geçmişi yüklenemese de yeni başvuru yapılabilmeli.
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero
        icon={PawPrint}
        eyebrow="Hizmetler"
        title="İşletme Sahibi Başvurusu"
        subtitle="Veteriner kliniği, petshop veya barınağınızı PatiMati'ye ekleyin -- başvurunuz admin onayından sonra aktif olur."
        color="#F97316"
      />

      <main className="mx-auto max-w-[700px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : existingApplication && existingApplication.status !== "REDDEDILDI" ? (
          <ApplicationStatusCard application={existingApplication} />
        ) : (
          <ApplicationForm
            previousRejection={
              existingApplication?.status === "REDDEDILDI" ? existingApplication : null
            }
            onSubmitted={setExistingApplication}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function ApplicationStatusCard({ application }: { application: BusinessApplicationResponse }) {
  if (application.status === "BEKLEMEDE") {
    return (
      <div className={cardClass}>
        <div className="flex items-start gap-3">
          <Clock size={22} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold">Başvurunuz inceleniyor</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              "{application.name}" için yaptığınız başvuru admin tarafından değerlendiriliyor. Onaylandığında
              bildirim alacaksınız.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3">
        <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-500" />
        <div>
          <h2 className="text-lg font-bold">Başvurunuz onaylandı</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Tekrar giriş yaparak panelinize ulaşabilirsiniz.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
          >
            Giriş yap
          </Link>
        </div>
      </div>
    </div>
  );
}

function ApplicationForm({
  previousRejection,
  onSubmitted,
}: {
  previousRejection: BusinessApplicationResponse | null;
  onSubmitted: (application: BusinessApplicationResponse) => void;
}) {
  const [businessType, setBusinessType] = useState<BusinessType>(
    previousRejection?.businessType ?? "VET",
  );
  const [name, setName] = useState(previousRejection?.name ?? "");
  const [address, setAddress] = useState(previousRejection?.address ?? "");
  const [city, setCity] = useState(previousRejection?.city ?? "");
  const [district, setDistrict] = useState(previousRejection?.district ?? "");
  const [phone, setPhone] = useState(previousRejection?.phone ?? "");
  const [workingHours, setWorkingHours] = useState(previousRejection?.workingHours ?? "");
  const [latitude, setLatitude] = useState<number | null>(previousRejection?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(previousRejection?.longitude ?? null);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>(previousRejection?.animalTypes ?? []);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`);
      return;
    }
    setErrorMessage(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !address.trim() || !city.trim() || !phone.trim()) {
      setErrorMessage("İşletme adı, adres, il ve telefon zorunludur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const application = await submitBusinessApplication({
        businessType,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        phone: phone.trim(),
        workingHours: workingHours.trim() || undefined,
        photo: photo ?? undefined,
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
        animalTypes: businessType === "VET" ? animalTypes : undefined,
      });
      onSubmitted(application);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Başvuru gönderilirken bir hata oluştu, tekrar deneyin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {previousRejection && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Önceki başvurunuz reddedildi</p>
            {previousRejection.rejectionReason && <p className="mt-0.5">{previousRejection.rejectionReason}</p>}
            <p className="mt-1 text-red-600/80 dark:text-red-400/80">Bilgilerinizi güncelleyip tekrar başvurabilirsiniz.</p>
          </div>
        </div>
      )}

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-bold">İşletme Türü</h2>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = businessType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setBusinessType(option.value)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/40 hover:text-[#2563EB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <Icon size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Camera size={20} className="text-[#2563EB]" />
          Fotoğraf
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
            {photoPreview && (
              <img src={photoPreview} alt="İşletme fotoğrafı" className="h-full w-full object-cover" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Fotoğraf Seç
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-bold">İşletme Bilgileri</h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>İşletme Adı</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={inputClass}
              placeholder="Pati Veteriner Kliniği"
            />
          </div>

          <div>
            <label className={labelClass}>Adres</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              className={inputClass}
              placeholder="Örnek Mah. 1. Sk. No:1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>İl</label>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                className={inputClass}
                placeholder="Ankara"
              />
            </div>
            <div>
              <label className={labelClass}>İlçe</label>
              <input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className={inputClass}
                placeholder="Çankaya"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Telefon</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className={inputClass}
              placeholder="0312 000 00 00"
            />
          </div>

          <div>
            <label className={labelClass}>Çalışma Saatleri</label>
            <input
              value={workingHours}
              onChange={(event) => setWorkingHours(event.target.value)}
              className={inputClass}
              placeholder="Hafta içi 09:00 - 18:00"
            />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-[#2563EB]" />
          Konum
        </h2>
        <MapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </section>

      {businessType === "VET" && (
        <section className={cardClass}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <PawPrint size={20} className="text-[#2563EB]" />
            Baktığınız Hayvan Türleri
          </h2>
          <AnimalTypeSelector value={animalTypes} onChange={setAnimalTypes} />
        </section>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <Info size={19} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </button>
    </form>
  );
}
