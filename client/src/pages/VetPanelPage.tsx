import { Camera, CheckCircle2, Info, Stethoscope } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { ApiError } from "../services/api";
import { getMyClinic, upsertMyClinic } from "../services/vet";

const MAX_FILE_SIZE_MB = 5;

export default function VetPanelPage() {
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

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMyClinic()
      .then((clinic) => {
        if (cancelled || !clinic) {
          return;
        }
        setName(clinic.name);
        setAddress(clinic.address);
        setCity(clinic.city);
        setDistrict(clinic.district ?? "");
        setPhone(clinic.phone);
        setWorkingHours(clinic.workingHours ?? "");
        setExistingPhotoUrl(clinic.photoUrl);
      })
      .catch(() => {
        setErrorMessage("Klinik bilgileri yüklenirken bir hata oluştu.");
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
      setErrorMessage("Klinik adı, adres, il ve telefon zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await upsertMyClinic({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        phone: phone.trim(),
        workingHours: workingHours.trim() || undefined,
        photo: newPhoto ?? undefined,
      });

      setExistingPhotoUrl(updated.photoUrl);
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setSuccessMessage("Klinik bilgi kartınız kaydedildi.");
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

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300";
  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const displayedPhoto = newPhotoPreview ?? existingPhotoUrl;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main className="mx-auto max-w-[800px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#2563EB]">Veteriner Paneli</p>
          <h1 className="mt-1 flex items-center gap-2 text-[32px] font-bold leading-10 text-[#0F172A] dark:text-[#F1F5F9]">
            <Stethoscope size={28} className="text-[#2563EB]" />
            Klinik Bilgi Kartı
          </h1>
          <p className="mt-2 text-base leading-6 text-[#64748B] dark:text-[#94A3B8]">
            Bu kart, "Hizmetler &gt; Veteriner" altındaki herkese açık dizinde görünür.
          </p>
        </div>

        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : (
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
                      alt="Klinik fotoğrafı"
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
              <h2 className="mb-4 text-lg font-bold">Klinik Bilgileri</h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Klinik Adı</label>
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
        )}
      </main>

      <Footer />
    </div>
  );
}
