import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation } from "wouter";
import {
  Camera,
  HandHeart,
  ImagePlus,
  Loader2,
  MapPin,
  PawPrint,
  Upload,
  X,
} from "lucide-react";

import CreateAdLayout from "../components/CreateAdLayout";
import { request } from "../services/api";
import { ilIlcedenKoordinat } from "../utils/geokod";
import { konumAl, konumHataMesaji } from "../utils/konum";
import { extractInvalidParams, getUserErrorMessage } from "../utils/errorMessage";
import { compressImagesWithinLimit } from "../utils/imageCompression";

// FOTOĞRAF SINIRLARI — `AdoptionCreatePage.tsx`/`AddListingPage.tsx` ile AYNI
// sunucu kuralı (bkz. oradaki gerekçe): en az 1, en fazla 3, 5 MB.
const MIN_IMAGES = 1;
const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const today = new Date().toISOString().split("T")[0];

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

/**
 * Yardıma muhtaç hayvan bildirimi -- "Sade form" (plan onayı): fotoğraf(lar) +
 * başlık + serbest metin açıklama + tür (kedi/köpek) + tarih + konum. Irk,
 * renk, yaş, cinsiyet, tasma, mikroçip YOK -- "3 kedi var, besliyorum" gibi
 * durumlar açıklama metnine yazılır.
 *
 * Sahiplendirme'nin aksine AYRI bir backend ucu YOK: genel
 * `POST /api/ads` (adType: "HELP") kullanılır -- backend zaten breed/gender/
 * ageGroup/coatPattern/eyeColor gibi alanları UNKNOWN/MIXED_OR_UNKNOWN'a
 * varsayıyor (bkz. AdMapper), bu form onları hiç göndermez.
 */
export default function HelpCreatePage() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dateError, setDateError] = useState("");

  const [form, setForm] = useState({
    species: "",
    date: today,
    city: "",
    district: "",
    latitude: "",
    longitude: "",
    title: "",
    description: "",
    acceptResponsibility: false,
    instagramShareConsent: false,
  });

  const updateForm = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const createImageId = (file: File) => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
  };

  const openFilePicker = () => {
    setErrorMessage("");

    if (images.length >= MAX_IMAGES) {
      setErrorMessage(`En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setErrorMessage("");

    const availableSlots = MAX_IMAGES - images.length;
    const validFiles: File[] = [];

    for (const file of files) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setErrorMessage(
          "Yalnızca JPG, PNG veya WEBP formatında fotoğraf yükleyebilirsiniz.",
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`Her fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`);
        continue;
      }

      const alreadyExists = images.some(
        (image) =>
          image.file.name === file.name &&
          image.file.size === file.size &&
          image.file.lastModified === file.lastModified,
      );

      if (alreadyExists) {
        setErrorMessage(`${file.name} zaten yüklenmiş.`);
        continue;
      }

      validFiles.push(file);
    }

    const filesToAdd = validFiles.slice(0, availableSlots);

    if (filesToAdd.length === 0) return;

    try {
      setIsCompressing(true);

      const { accepted, stillTooLarge } = await compressImagesWithinLimit(
        filesToAdd,
        MAX_FILE_SIZE,
      );

      if (stillTooLarge.length > 0) {
        setErrorMessage(
          `${stillTooLarge[0].name} küçültülemedi ve ${MAX_FILE_SIZE_MB} MB sınırının üstünde kaldı; eklenmedi.`,
        );
      }

      const newImages = accepted.map((file) => ({
        id: createImageId(file),
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((current) => [...current, ...newImages]);
    } catch (err) {
      console.error("Fotoğraf sıkıştırma hatası:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.preview);
      }

      return current.filter((image) => image.id !== imageId);
    });
  };

  const handleUseLocation = async () => {
    setErrorMessage("");

    let koordinat;
    try {
      koordinat = await konumAl();
    } catch (hata) {
      setErrorMessage(konumHataMesaji(hata));
      return;
    }

    const coords = { latitude: koordinat.enlem, longitude: koordinat.boylam };

    updateForm("latitude", String(coords.latitude));
    updateForm("longitude", String(coords.longitude));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=tr`,
      );

      const data = await response.json();

      updateForm("city", data.address?.province || data.address?.city || "");

      updateForm(
        "district",
        data.address?.town ||
          data.address?.county ||
          data.address?.municipality ||
          "",
      );
    } catch {
      setErrorMessage("Konum bilgisi şehir adına dönüştürülemedi.");
    }
  };

  const validateForm = (f: typeof form = form) => {
    if (images.length === 0) {
      return "En az 1 fotoğraf yüklemelisiniz.";
    }

    if (!f.species) {
      return "Hayvan türünü seçin.";
    }

    if (!f.date) {
      return "Tarihi seçin.";
    }

    if (f.date > today) {
      return "Gelecekte bir tarih seçilemez.";
    }

    if (!f.city.trim()) {
      return "Şehir bilgisini girin.";
    }

    if (!f.latitude || !f.longitude) {
      return '"Mevcut konumumu kullan" düğmesiyle ya da enlem/boylam alanlarına elle girerek konumu ekleyin.';
    }

    if (!f.title.trim()) {
      return "İlan başlığını girin.";
    }

    if (!f.description.trim()) {
      return "Durumu açıklayan bir metin girin.";
    }

    if (!f.acceptResponsibility) {
      return "İlan bilgilerini doğru verdiğinizi onaylamalısınız.";
    }

    return "";
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setDateError("");

    let gonderilecek = form;

    if ((!form.latitude || !form.longitude) && form.city.trim()) {
      const tahmin = await ilIlcedenKoordinat(form.city, form.district);

      if (tahmin) {
        gonderilecek = {
          ...form,
          latitude: String(tahmin.latitude),
          longitude: String(tahmin.longitude),
        };
        updateForm("latitude", gonderilecek.latitude);
        updateForm("longitude", gonderilecek.longitude);
      }
    }

    const validationError = validateForm(gonderilecek);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    const ad: Record<string, unknown> = {
      title: gonderilecek.title.trim().slice(0, 150),
      description: gonderilecek.description.trim(),
      adType: "HELP",
      species: gonderilecek.species,
      lostDate: gonderilecek.date,
      latitude: Number(gonderilecek.latitude),
      longitude: Number(gonderilecek.longitude),
      city: gonderilecek.city.trim() || undefined,
      district: gonderilecek.district.trim() || undefined,
      isMatchRequired: false,
      instagramShareConsent: gonderilecek.instagramShareConsent,
    };

    const formData = new FormData();

    formData.append(
      "ad",
      new Blob([JSON.stringify(ad)], { type: "application/json" }),
    );

    images.forEach((image) => {
      formData.append("images", image.file);
    });

    try {
      await request("/api/ads", {
        method: "POST",
        requiresAuth: true,
        body: formData,
      });

      navigate("/listings");
    } catch (error) {
      console.error("Yardım ilanı oluşturma hatası:", error);

      const invalidParams = extractInvalidParams(error);
      if (invalidParams) {
        const dateParam = invalidParams.find((p) => {
          const name = p.name || p.field;
          return name === "lostDate";
        });

        if (dateParam) {
          const reason = dateParam.reason || dateParam.message || dateParam.detail;
          setDateError(reason || "Tarih gelecekte bir tarih olamaz veya geçersizdir.");
        }
      }

      setErrorMessage(
        getUserErrorMessage(error, "İlan oluşturulurken bir hata oluştu."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreateAdLayout activeType="help">
      <FormCard
        icon={<Camera size={21} />}
        title="Fotoğraflar"
        description="Gördüğün durumu net gösteren fotoğraf(lar) ekle."
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleImages}
        />

        {images.length === 0 ? (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isCompressing}
            className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center transition hover:border-[#22D3EE] hover:bg-[#ECFEFF] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-cyan-500/10"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CFFAFE] text-[#0E7490] dark:bg-cyan-500/15 dark:text-cyan-400">
              {isCompressing ? (
                <Loader2 size={30} className="animate-spin" />
              ) : (
                <ImagePlus size={30} />
              )}
            </div>

            <strong className="mt-4 text-lg">
              {isCompressing ? "Sıkıştırılıyor..." : "Fotoğraf yükle"}
            </strong>

            <span className="mt-2 text-sm text-[#64748B] dark:text-slate-400">
              En az {MIN_IMAGES} zorunlu · en fazla {MAX_IMAGES} fotoğraf ·
              her biri {MAX_FILE_SIZE_MB} MB · JPG, PNG veya WEBP
            </span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-slate-700"
                >
                  <img
                    src={image.preview}
                    alt={`Yardım fotoğrafı ${index + 1}`}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />

                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-[#0F172A]/80 px-3 py-1 text-xs font-bold text-white">
                      Kapak
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/75 text-white transition hover:bg-[#DC2626]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isCompressing}
                  className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] transition hover:border-[#0E7490] hover:text-[#0E7490] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-cyan-500/10"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 size={25} className="animate-spin text-[#0E7490]" />
                      <span className="mt-2 text-sm font-semibold">Sıkıştırılıyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={25} />
                      <span className="mt-2 text-sm font-semibold">Fotoğraf ekle</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-3 text-sm text-[#64748B] dark:text-slate-400">
              {images.length}/{MAX_IMAGES} fotoğraf yüklendi.
            </p>
          </>
        )}
      </FormCard>

      <FormCard
        icon={<PawPrint size={21} />}
        title="Durum bilgisi"
        description={'Kaç hayvan olduğu, durumu vb. serbestçe açıklamaya yazılabilir (ör. "3 kedi var, besliyorum").'}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tür" required>
            <select
              value={form.species}
              onChange={(e) => updateForm("species", e.target.value)}
              className={inputClass}
            >
              <option value="">Tür seçin</option>
              <option value="CAT">Kedi</option>
              <option value="DOG">Köpek</option>
            </select>
          </Field>

          <Field label="Tarih" required>
            <input
              type="date"
              required
              value={form.date || ""}
              max={today}
              onChange={(e) => {
                setDateError("");
                updateForm("date", e.target.value);
              }}
              className={`${inputClass} ${dateError ? "border-red-500 ring-2 ring-red-200" : ""}`}
            />
            {dateError && (
              <p className="mt-1 text-xs font-semibold text-red-600">{dateError}</p>
            )}
          </Field>
        </div>
      </FormCard>

      <FormCard
        icon={<MapPin size={21} />}
        title="Konum"
        description="Hayvanın görüldüğü bölgeyi belirt."
      >
        <div className="mb-5">
          <button
            type="button"
            onClick={handleUseLocation}
            className="inline-flex items-center gap-2 rounded-xl border border-[#A5F3FC] bg-[#ECFEFF] px-4 py-2.5 text-sm font-bold text-[#0E7490] transition hover:bg-[#CFFAFE] dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/15"
          >
            <MapPin size={17} />
            Mevcut konumumu kullan
          </button>
        </div>

        <div className="mb-5 grid gap-5 sm:grid-cols-2">
          <Field label="Enlem" required>
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={form.latitude}
              onChange={(e) => updateForm("latitude", e.target.value)}
              placeholder="40.195000"
              className={inputClass}
            />
          </Field>

          <Field label="Boylam" required>
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              value={form.longitude}
              onChange={(e) => updateForm("longitude", e.target.value)}
              placeholder="29.060000"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Şehir" required>
            <input
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
              placeholder="Bursa"
              className={inputClass}
            />
          </Field>

          <Field label="İlçe">
            <input
              value={form.district}
              onChange={(e) => updateForm("district", e.target.value)}
              placeholder="Nilüfer"
              className={inputClass}
            />
          </Field>
        </div>
      </FormCard>

      <FormCard
        icon={<HandHeart size={21} />}
        title="İlan detayları"
        description="Diğer hayvanseverlerin görmesini istediğin bilgileri paylaş."
      >
        <Field label="İlan başlığı" required>
          <input
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            placeholder="Örn. Mahallede 3 kedi yardım bekliyor"
            className={inputClass}
          />
        </Field>

        <Field label="Açıklama" required>
          <textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            placeholder='Durumu anlat: kaç hayvan var, ne tür bir yardıma ihtiyaçları var, sen ne yaptın/yapabiliyorsun ("3 kedi var, besliyorum, sizde besler misiniz?" gibi).'
            rows={6}
            className={inputClass}
          />
        </Field>
      </FormCard>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm font-semibold text-[#B91C1C] dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <input
          type="checkbox"
          checked={form.acceptResponsibility}
          onChange={(e) => updateForm("acceptResponsibility", e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#0E7490]"
        />

        <div>
          <strong className="text-sm text-[#0F172A] dark:text-slate-100">
            Bilgilerin doğruluğunu onaylıyorum.
          </strong>

          <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-400">
            İlanda verdiğim bilgilerin doğru olduğunu kabul ediyorum.
          </p>
        </div>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <input
          type="checkbox"
          checked={form.instagramShareConsent}
          onChange={(e) => updateForm("instagramShareConsent", e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#0E7490]"
        />

        <div>
          <strong className="text-sm text-[#0F172A] dark:text-slate-100">
            İlanımın PatiMati Instagram hesabında paylaşılmasına izin veriyorum.
          </strong>

          <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-400">
            İsteğe bağlıdır. İzin verirsen, ekibimiz uygun gördüğünde
            fotoğrafını ve ilan bilgilerini PatiMati'nin Instagram hesabında
            paylaşabilir.
          </p>
        </div>
      </label>

      {images.length < MIN_IMAGES && (
        <p className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <ImagePlus size={17} />
          İlanı yayınlamak için en az {MIN_IMAGES} fotoğraf eklemelisiniz.
        </p>
      )}

      <button
        type="button"
        disabled={isSubmitting || images.length < MIN_IMAGES}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E7490] px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-[#155E75] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
      >
        {isSubmitting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            İlan hazırlanıyor...
          </>
        ) : (
          <>
            <HandHeart size={20} />
            Yardım ilanını yayınla
          </>
        )}
      </button>
    </CreateAdLayout>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0E7490] focus:ring-4 focus:ring-[#A5F3FC]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

type FormCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function FormCard({ icon, title, description, children }: FormCardProps) {
  return (
    <section className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-start gap-4 border-b border-[#F1F5F9] pb-5 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECFEFF] text-[#0E7490] dark:bg-cyan-500/10 dark:text-cyan-400">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold dark:text-slate-50">{title}</h2>

          <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#334155] dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-[#0E7490]">*</span>}
      </span>

      {children}
    </label>
  );
}
