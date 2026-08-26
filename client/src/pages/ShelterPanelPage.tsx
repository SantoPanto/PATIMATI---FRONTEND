import {
  Archive,
  Camera,
  CheckCircle2,
  CirclePlus,
  Eye,
  Heart,
  Home,
  Info,
  MapPin,
  PartyPopper,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MapPicker from "../components/MapPicker";
import ServiceHero from "../components/ServiceHero";
import { ApiError } from "../services/api";
import { deleteAd, getMyAds, republishAd } from "../services/ads";
import { resolveAdoptionAdopted } from "../services/adoptions";
import { getMyShelter, upsertMyShelter } from "../services/shelter";
import type { AdResponse } from "../services/types";
import {
  getAdDetailPath,
  getAdImage,
  getAdLocation,
  getAdTypeLabel,
  getBreedLabel,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";

const MAX_FILE_SIZE_MB = 5;

/**
 * Barınak Paneli -- `PetShopPanelPage.tsx` iskeleti, **2 sekme**: "Barınak
 * Kartı" ve "İlanlarım". Hayvan türü seçici YOK (Petshop'ta da yoktu, aynı
 * disiplin). "Gelen İstekler"/"Müşterilerim" YOK -- vet'teki gibi süregelen
 * bir müşteri ilişkisi kavramı yok (plan "Bilinçli kapsam sınırları").
 *
 * "İlanlarım" sekmesi `AdoptionCreatePage.tsx`'i (1280 satır, tam çalışan
 * form) YENİDEN YAZMIYOR: ince bir sarmalayıcı -- mevcut `/adopt/create`
 * rotasına giden bir link + `getMyAds`'ten yalnızca `adType === "ADOPTION"`
 * filtrelenen bir kart listesi, mevcut `deleteAd`/`republishAd`/
 * `resolveAdoptionAdopted` fonksiyonlarını kullanarak (plan §14).
 */
type ShelterTab = "card" | "listings";

export default function ShelterPanelPage() {
  const [activeTab, setActiveTab] = useState<ShelterTab>("card");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero icon={Home} eyebrow="Barınak Paneli" title="Barınak Paneli" color="#0d9488" />

      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-slate-800">
          <TabButton active={activeTab === "card"} onClick={() => setActiveTab("card")} icon={<Home size={16} />}>
            Barınak Kartı
          </TabButton>
          <TabButton active={activeTab === "listings"} onClick={() => setActiveTab("listings")} icon={<Heart size={16} />}>
            İlanlarım
          </TabButton>
        </div>

        {activeTab === "card" && <CardTab />}
        {activeTab === "listings" && <ListingsTab />}
      </main>

      <Footer />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
        active
          ? "border-[#2563EB] text-[#2563EB]"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300";
const cardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

function CardTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMyShelter()
      .then((shelter) => {
        if (cancelled || !shelter) {
          return;
        }
        setName(shelter.name);
        setAddress(shelter.address);
        setCity(shelter.city);
        setDistrict(shelter.district ?? "");
        setPhone(shelter.phone);
        setWorkingHours(shelter.workingHours ?? "");
        setExistingPhotoUrl(shelter.photoUrl);
        setLatitude(shelter.latitude);
        setLongitude(shelter.longitude);
      })
      .catch(() => {
        setErrorMessage("Barınak bilgileri yüklenirken bir hata oluştu.");
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
    setNewPhoto(file);
    setNewPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !address.trim() || !city.trim() || !phone.trim()) {
      setErrorMessage("Barınak adı, adres, il ve telefon zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await upsertMyShelter({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        phone: phone.trim(),
        workingHours: workingHours.trim() || undefined,
        photo: newPhoto ?? undefined,
        // Yalnızca ikisi BİRDEN seçiliyse gönderilir -- konum ayarlanmadan
        // kart kaydedilebilmeli, tek biri gönderilirse backend'in
        // doğrulaması reddeder (plan §6, VetClinic/PetShop ile aynı desen).
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      });

      setExistingPhotoUrl(updated.photoUrl);
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setSuccessMessage("Barınak bilgi kartınız kaydedildi.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Kaydedilirken bir hata oluştu, tekrar deneyin.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayedPhoto = newPhotoPreview ?? existingPhotoUrl;

  if (isLoading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            {displayedPhoto && (
              <img
                src={displayedPhoto}
                alt="Barınak fotoğrafı"
                className="h-full w-full object-cover"
              />
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
        <h2 className="mb-4 text-lg font-bold">Barınak Bilgileri</h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Barınak Adı</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={inputClass}
              placeholder="Umut Barınağı"
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

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <Info size={19} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function ListingsTab() {
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [republishingId, setRepublishingId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  /**
   * `getMyAds`'te sunucu tarafı `adType` filtresi YOK -- istemci tarafında
   * ADOPTION'a filtreleniyor (plan §14, bilinçli tercih: sayfalanmış 100
   * satırlık dilim üzerinde filtreleme yapılıyor, çok üretken bir barınağın
   * eski ilanları teorik olarak kırpılabilir, v1 için kabul edilebilir).
   */
  const loadAds = () => {
    setIsLoading(true);
    return getMyAds({ page: 0, size: 100 })
      .then((page) => setAds(page.content.filter((ad) => ad.adType === "ADOPTION")))
      .catch(() => setErrorMessage("İlanlarınız yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleDelete = async (ad: AdResponse) => {
    const confirmed = window.confirm(
      `"${ad.title}" ilanını yayından kaldırmak istediğinize emin misiniz?`,
    );
    if (!confirmed) return;

    setDeletingId(ad.id);
    setErrorMessage(null);
    try {
      await deleteAd(ad.id);
      await loadAds();
    } catch {
      setErrorMessage("İlan yayından kaldırılamadı.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRepublish = async (ad: AdResponse) => {
    setRepublishingId(ad.id);
    setErrorMessage(null);
    try {
      await republishAd(ad.id);
      await loadAds();
    } catch {
      setErrorMessage("İlan yeniden yayınlanamadı.");
    } finally {
      setRepublishingId(null);
    }
  };

  const handleResolveAdopted = async (ad: AdResponse) => {
    const confirmed = window.confirm(
      `"${ad.title}" ilanını sahiplendirildi olarak işaretlemek istediğinize emin misiniz?`,
    );
    if (!confirmed) return;

    setResolvingId(ad.id);
    setErrorMessage(null);
    try {
      await resolveAdoptionAdopted(ad.id);
      await loadAds();
    } catch {
      setErrorMessage("İlan sahiplendirildi olarak işaretlenemedi.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Sahiplendirme İlanlarım</h2>
        <Link
          href="/adopt/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
        >
          <CirclePlus size={17} />
          Yeni İlan Ver
        </Link>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <Info size={19} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className={cardClass}>
          <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
        </div>
      ) : ads.length === 0 ? (
        <div className={`${cardClass} text-center`}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10 text-[#2563EB]">
            <Archive size={28} />
          </span>
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Henüz bir sahiplendirme ilanınız yok.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className={cardClass}>
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                  <img src={getAdImage(ad)} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">
                      {getAdTypeLabel(ad.adType)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ad.active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                      }`}
                    >
                      {ad.active
                        ? "Yayında"
                        : ad.suspended
                          ? "İnceleme altında"
                          : ad.resolutionStatus === "ADOPTED"
                            ? "Sahiplendirildi 🎉"
                            : "Yayından kaldırıldı"}
                    </span>
                  </div>
                  <h3 className="mt-1 font-bold text-[#0F172A] dark:text-[#F1F5F9]">{ad.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
                    {getSpeciesLabel(ad.species)} · {getBreedLabel(ad.breed)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                    <MapPin size={13} />
                    {getAdLocation(ad)} · {getRelativeDate(ad.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
                <Link
                  href={getAdDetailPath(ad)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
                >
                  <Eye size={16} />
                  Görüntüle
                </Link>

                {ad.active ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolveAdopted(ad)}
                      disabled={resolvingId === ad.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3.5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    >
                      <PartyPopper size={16} />
                      Sahiplendirildi olarak işaretle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ad)}
                      disabled={deletingId === ad.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                      Yayından kaldır
                    </button>
                  </>
                ) : ad.suspended ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                    title="İlanınız yönetici incelemesinde. İnceleme bitene kadar yeniden yayınlanamaz."
                  >
                    <ShieldAlert size={16} />
                    İnceleme altında
                  </span>
                ) : ad.resolutionStatus === "ADOPTED" ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                    title="Bu ilan mutlu sonla kapandı."
                  >
                    <PartyPopper size={16} />
                    Sahiplendirildi
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRepublish(ad)}
                    disabled={republishingId === ad.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3.5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  >
                    <RotateCcw size={16} />
                    {republishingId === ad.id ? "Yayınlanıyor..." : "Yeniden yayınla"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
