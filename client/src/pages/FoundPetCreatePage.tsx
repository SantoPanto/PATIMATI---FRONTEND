import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation } from "wouter";
import {
  CalendarDays,
  Camera,
  ImagePlus,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Tag,
  Upload,
  X,
} from "lucide-react";

import CreateAdLayout from "../components/CreateAdLayout";
import { request } from "../services/api";
import type { PetColor } from "../services/types";
import { extractInvalidParams, getUserErrorMessage } from "../utils/errorMessage";

const TURKISH_COLOR_TO_ENUM: Record<string, PetColor> = {
  siyah: "BLACK",
  black: "BLACK",
  beyaz: "WHITE",
  white: "WHITE",
  gri: "GRAY",
  gray: "GRAY",
  grey: "GRAY",
  kahverengi: "BROWN",
  kahve: "BROWN",
  brown: "BROWN",
  turuncu: "ORANGE",
  orange: "ORANGE",
  krem: "CREAM",
  cream: "CREAM",
  altın: "GOLDEN",
  altin: "GOLDEN",
  golden: "GOLDEN",
  bej: "BEIGE",
  beige: "BEIGE",
  diğer: "OTHER",
  diger: "OTHER",
  other: "OTHER",
};

function parseColorsFromText(text: string): PetColor[] {
  if (!text || !text.trim()) return [];
  const lower = text.toLowerCase();
  const matched = new Set<PetColor>();
  for (const [key, val] of Object.entries(TURKISH_COLOR_TO_ENUM)) {
    if (lower.includes(key)) {
      matched.add(val);
    }
  }
  return Array.from(matched);
}

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

type Gender = "UNKNOWN" | "MALE" | "FEMALE";
type CollarStatus = "UNKNOWN" | "YES" | "NO";

// FOTOĞRAF SINIRLARI — sunucudan ÖLÇÜLEREK alındı (19.08.2026). Ayrıntılı
// gerekçe ve kaynak satırları AddListingPage.tsx'te; üç oluşturma formu da
// AYNI sunucu kuralına tabi:
//   en az 1    -> AdService.java:84 (@RequestPart required = true)
//   en fazla 3 -> S3ImageStorageServiceImpl.java:64 (etkin @Service)
//   5 MB       -> application.yml spring.servlet.multipart.max-file-size
// Önceden 5 ve 10 MB yazıyordu; ön yüz sunucunun reddedeceği seçimlere izin
// veriyordu. Sunucu sınırı değişirse burası da değişmeli.
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

export default function FoundPetCreatePage() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationLoading, setIsLocationLoading] =
    useState(false);

  const [form, setForm] = useState({
    species: "",
    breed: "",
    gender: "UNKNOWN" as Gender,
    color: "",
    foundDate: today,
    city: "",
    district: "",
    locationDescription: "",
    /*
     * Backend AdCreateRequest latitude/longitude'u @NotNull istiyor.
     * Konum zaten aliniyordu ama yalniz adres metnine cevrilip
     * atiliyordu; artik saklaniyor.
     */
    latitude: "",
    longitude: "",
    collarStatus: "UNKNOWN" as CollarStatus,
    collarColor: "",
    collarTagText: "",
    distinctiveMarks: "",
    condition: "",
    description: "",
    acceptResponsibility: false,
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
      setErrorMessage(
        `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`,
      );
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImages = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
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
        setErrorMessage(
          `Her fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`,
        );
        continue;
      }

      const alreadyExists = images.some(
        (image) =>
          image.file.name === file.name &&
          image.file.size === file.size &&
          image.file.lastModified ===
            file.lastModified,
      );

      if (alreadyExists) {
        setErrorMessage(
          `${file.name} zaten yüklenmiş.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    const filesToAdd = validFiles.slice(
      0,
      availableSlots,
    );

    const newImages: SelectedImage[] =
      filesToAdd.map((file) => ({
        id: createImageId(file),
        file,
        preview: URL.createObjectURL(file),
      }));

    setImages((current) => [
      ...current,
      ...newImages,
    ]);
  };

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const target = current.find(
        (image) => image.id === imageId,
      );

      if (target) {
        URL.revokeObjectURL(target.preview);
      }

      return current.filter(
        (image) => image.id !== imageId,
      );
    });

    setErrorMessage("");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage(
        "Tarayıcınız konum özelliğini desteklemiyor.",
      );
      return;
    }

    setErrorMessage("");
    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        /*
         * Koordinati ONCE sakla: ilan icin zorunlu olan bu, adres
         * metni degil. Nominatim'e ulasilamasa bile ilan acilabilsin.
         */
        updateForm(
          "latitude",
          String(coords.latitude),
        );

        updateForm(
          "longitude",
          String(coords.longitude),
        );

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=tr`,
          );

          if (!response.ok) {
            throw new Error(
              "Konum bilgisi alınamadı.",
            );
          }

          const data = await response.json();

          updateForm(
            "city",
            data.address?.province ||
              data.address?.city ||
              "",
          );

          updateForm(
            "district",
            data.address?.town ||
              data.address?.county ||
              data.address?.municipality ||
              "",
          );

          updateForm(
            "locationDescription",
            data.display_name || "",
          );
        } catch {
          setErrorMessage(
            "Konum şehir bilgisine dönüştürülemedi.",
          );
        } finally {
          setIsLocationLoading(false);
        }
      },
      () => {
        setIsLocationLoading(false);

        setErrorMessage(
          "Konum alınamadı. Tarayıcıdan konum izni verdiğinizden emin olun.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  const validateForm = () => {
    if (images.length < MIN_IMAGES) {
      return "En az 1 fotoğraf yüklemelisiniz.";
    }

    if (!form.species) {
      return "Hayvan türünü seçin.";
    }

    if (!form.foundDate) {
      return "Hayvanı bulduğunuz tarihi seçin.";
    }

    if (!form.city.trim()) {
      return "Şehir bilgisini girin.";
    }

    if (!form.district.trim()) {
      return "İlçe bilgisini girin.";
    }

    /*
     * Backend konumu zorunlu tutuyor ve eslestirme mesafeye bakiyor.
     * Sehir/ilce metni koordinat yerine gecmez.
     */
    if (!form.latitude || !form.longitude) {
      return '"Mevcut konumumu kullan" düğmesiyle ya da enlem/boylam alanlarına elle girerek hayvanı bulduğunuz konumu ekleyin.';
    }

    if (!form.description.trim()) {
      return "Hayvan hakkında kısa bir açıklama girin.";
    }

    if (!form.acceptResponsibility) {
      return "İlan bilgilerinin doğru olduğunu onaylamalısınız.";
    }

    return "";
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    /*
     * Backend AdCreateRequest bekliyor. Sayfanin topladigi bazi alanlarin
     * (city / district / locationDescription / condition / foundDate)
     * backend'de karsiligi YOK; onlari gondermek yerine metin alanlarina
     * katiyoruz ki kullanicinin yazdigi bilgi kaybolmasin.
     *
     * foundDate -> lostDate DEGIL: lostDate yalniz LOST ilanlar icin
     * anlamli. Bulunma tarihi aciklamaya yaziliyor.
     */
    const konumSatiri = [
      form.city.trim(),
      form.district.trim(),
      form.locationDescription.trim(),
    ]
      .filter(Boolean)
      .join(" / ");

    const aciklama = [
      form.description.trim(),
      form.foundDate
        ? `Bulunma tarihi: ${form.foundDate}`
        : "",
      konumSatiri ? `Bulunduğu yer: ${konumSatiri}` : "",
      form.condition.trim()
        ? `Genel durum: ${form.condition.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const baslik = `Bulundu: ${
      form.breed.trim() ||
      (form.species === "CAT" ? "Kedi" : "Köpek")
    } — ${form.city.trim() || "konum belirtilmedi"}`;

    const ad: Record<string, unknown> = {
      /*
       * title backend'de @NotBlank ama formda boyle bir alan yok;
       * tur + konumdan turetiliyor (150 karakter siniri var).
       */
      title: baslik.slice(0, 150),
      description: aciklama,
      adType: "FOUND",
      species: form.species,
      breed: form.breed.trim(),
      gender: form.gender,
      colors: parseColorsFromText(form.color),
      collarStatus: form.collarStatus,
      collarTagText: form.collarTagText.trim(),
      distinctiveMarks: [
        form.distinctiveMarks.trim(),
        form.color.trim() ? `Renk: ${form.color.trim()}` : "",
        form.collarColor.trim()
          ? `Tasma rengi: ${form.collarColor.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      /*
       * İl/ilçe beyanı (BE V19): form zaten soruyor; yapılandırılmış alan
       * olarak da gider ki kartlar ham koordinat yerine bunu gösterebilsin.
       * Boşsa alan hiç gönderilmez (undefined, JSON.stringify'da düşer) —
       * sunucu o durumda koordinattan çözmeyi dener.
       */
      city: form.city.trim() || undefined,
      district: form.district.trim() || undefined,
    };

    /*
     * Payload temizligi: date veya lostDate alani bos ("") ise
     * backend'e "" GONDERTILMEZ. Yalnizca doluysa eklenir.
     */
    if (form.foundDate && form.foundDate.trim() !== "") {
      ad.date = form.foundDate;
      ad.lostDate = form.foundDate;
    }

    if (!ad.date || ad.date === "") {
      delete ad.date;
    }
    if (!ad.lostDate || ad.lostDate === "") {
      delete ad.lostDate;
    }

    /*
     * Spring Boot @RequestPart("ad") + @RequestPart("images") bekliyor,
     * yani JSON bir Blob olarak gonderilmeli. Kalip AddListingPage'den
     * (orada tarayicida uctan uca dogrulandi).
     */
    const formData = new FormData();

    formData.append(
      "ad",
      new Blob([JSON.stringify(ad)], {
        type: "application/json",
      }),
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

      /*
       * /pet/:id ve /listings su an ekrani olmayan iskelet sayfalar.
       * Kullaniciyi bos bir sayfaya birakmamak icin ana sayfaya
       * donuluyor -- AddListingPage de ayni sebeple boyle yapiyor.
       */
      navigate("/");
    } catch (error) {
      console.error("Buldum ilanı oluşturma hatası:", error);

      const invalidParams = extractInvalidParams(error);
      if (invalidParams) {
        const dateParam = invalidParams.find((p) => {
          const name = p.name || p.field;
          return name === "date" || name === "lostDate" || name === "foundDate";
        });

        if (dateParam) {
          const reason = dateParam.reason || dateParam.message || dateParam.detail;
          setDateError(reason || "Tarih alanı boş bırakılamaz veya gelecekte bir tarih olamaz.");
        }
      }

      setErrorMessage(
        getUserErrorMessage(
          error,
          "İlan oluşturulurken beklenmeyen bir hata oluştu.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreateAdLayout activeType="found">
      <FormCard
        icon={<Camera size={21} />}
        title="Fotoğraflar"
        description="Bulduğun hayvanın net ve mümkünse farklı açılardan fotoğraflarını ekle."
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
            className="flex min-h-[230px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center transition hover:border-[#60A5FA] hover:bg-[#EFF6FF]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
              <ImagePlus size={30} />
            </div>

            <strong className="mt-4 text-lg">
              Fotoğraf yükle
            </strong>

            <span className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">
              Bulduğun hayvanı tanımaya yardımcı olacak
              en fazla 5 fotoğraf yükleyebilirsin.
            </span>

            <span className="mt-4 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#64748B]">
              En az {MIN_IMAGES} zorunlu · en fazla {MAX_IMAGES} fotoğraf ·
              JPG, PNG veya WEBP · her biri {MAX_FILE_SIZE_MB} MB
            </span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9]"
                >
                  <img
                    src={image.preview}
                    alt={`Bulunan hayvan fotoğrafı ${
                      index + 1
                    }`}
                    className="h-40 w-full object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-[#0F172A]/80 px-3 py-1 text-xs font-bold text-white">
                      Kapak
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(image.id)
                    }
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/75 text-white transition hover:bg-[#DC2626]"
                    aria-label={`${index + 1}. fotoğrafı kaldır`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] transition hover:border-[#60A5FA] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                >
                  <Upload size={25} />

                  <span className="mt-2 text-sm font-semibold">
                    Fotoğraf ekle
                  </span>
                </button>
              )}
            </div>

            <p className="mt-3 text-sm text-[#64748B]">
              {images.length}/{MAX_IMAGES} fotoğraf
              yüklendi.
            </p>
          </>
        )}
      </FormCard>

      <FormCard
        icon={<PawPrint size={21} />}
        title="Hayvan bilgileri"
        description="Bildiğin özellikleri gir. Emin olmadığın alanları boş bırakabilirsin."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tür" required>
            <select
              value={form.species}
              onChange={(event) =>
                updateForm(
                  "species",
                  event.target.value,
                )
              }
              className={inputClass}
            >
              <option value="">Tür seç</option>
              <option value="CAT">Kedi</option>
              <option value="DOG">Köpek</option>
            </select>
          </Field>

          <Field label="Irk">
            <input
              value={form.breed}
              onChange={(event) =>
                updateForm(
                  "breed",
                  event.target.value,
                )
              }
              placeholder="Örn. Golden Retriever"
              className={inputClass}
            />
          </Field>

          <Field label="Cinsiyet">
            <select
              value={form.gender}
              onChange={(event) =>
                updateForm(
                  "gender",
                  event.target.value as Gender,
                )
              }
              className={inputClass}
            >
              <option value="UNKNOWN">
                Bilinmiyor
              </option>

              <option value="FEMALE">
                Dişi
              </option>

              <option value="MALE">
                Erkek
              </option>
            </select>
          </Field>

          <Field label="Renk">
            <input
              value={form.color}
              onChange={(event) =>
                updateForm(
                  "color",
                  event.target.value,
                )
              }
              placeholder="Örn. Beyaz - kahverengi"
              className={inputClass}
            />
          </Field>
        </div>
      </FormCard>

      <FormCard
        icon={<CalendarDays size={21} />}
        title="Ne zaman ve nerede buldun?"
        description="Konum ve tarih bilgisi doğru eşleşme için oldukça önemli."
      >
        <Field label="Bulunma tarihi" required>
          <input
            type="date"
            required
            value={form.foundDate || ""}
            max={today}
            onChange={(event) => {
              setDateError("");
              updateForm(
                "foundDate",
                event.target.value,
              );
            }}
            className={`${inputClass} ${
              dateError
                ? "border-red-500 ring-2 ring-red-200"
                : ""
            }`}
          />
          {dateError && (
            <p className="mt-1 text-xs font-semibold text-red-600">
              {dateError}
            </p>
          )}
        </Field>

        <div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocationLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-sm font-bold text-[#2563EB] transition hover:bg-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MapPin size={17} />

            {isLocationLoading
              ? "Konum alınıyor..."
              : "Mevcut konumumu kullan"}
          </button>
        </div>

        {/* B2: Hayvan başka yerde bulunup ilan sonra (ör. evde) açılabiliyor;
            yalnız "mevcut konum" olsaydı ilan, bulunan yerin değil ilan açılan
            yerin koordinatını taşırdı — 25 km'lik eşleştirme yarıçapı kayardı.
            Kayıp formundaki elle giriş deseninin aynısı. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Enlem" required>
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={form.latitude}
              onChange={(event) =>
                updateForm(
                  "latitude",
                  event.target.value,
                )
              }
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
              onChange={(event) =>
                updateForm(
                  "longitude",
                  event.target.value,
                )
              }
              placeholder="29.060000"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Şehir" required>
            <input
              value={form.city}
              onChange={(event) =>
                updateForm(
                  "city",
                  event.target.value,
                )
              }
              placeholder="Bursa"
              className={inputClass}
            />
          </Field>

          <Field label="İlçe" required>
            <input
              value={form.district}
              onChange={(event) =>
                updateForm(
                  "district",
                  event.target.value,
                )
              }
              placeholder="Nilüfer"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Bulunduğu yerin açıklaması">
          <input
            value={form.locationDescription}
            onChange={(event) =>
              updateForm(
                "locationDescription",
                event.target.value,
              )
            }
            placeholder="Örn. Üniversite metro çıkışının karşısındaki park"
            className={inputClass}
          />
        </Field>
      </FormCard>

      <FormCard
        icon={<Tag size={21} />}
        title="Ayırt edici özellikler"
        description="Tasma, renk ve belirgin işaretler sahibinin hayvanını tanımasına yardımcı olur."
      >
        <Field label="Tasma durumu">
          <select
            value={form.collarStatus}
            onChange={(event) =>
              updateForm(
                "collarStatus",
                event.target
                  .value as CollarStatus,
              )
            }
            className={inputClass}
          >
            <option value="UNKNOWN">
              Bilinmiyor
            </option>

            <option value="YES">
              Tasma var
            </option>

            <option value="NO">
              Tasma yok
            </option>
          </select>
        </Field>

        {form.collarStatus === "YES" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tasma rengi">
              <input
                value={form.collarColor}
                onChange={(event) =>
                  updateForm(
                    "collarColor",
                    event.target.value,
                  )
                }
                placeholder="Örn. Kırmızı"
                className={inputClass}
              />
            </Field>

            <Field label="Tasma üzerindeki yazı">
              <input
                value={form.collarTagText}
                onChange={(event) =>
                  updateForm(
                    "collarTagText",
                    event.target.value,
                  )
                }
                placeholder="İsim veya numara varsa"
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label="Belirgin iz / leke">
          <textarea
            value={form.distinctiveMarks}
            onChange={(event) =>
              updateForm(
                "distinctiveMarks",
                event.target.value,
              )
            }
            rows={4}
            placeholder="Örn. Sol kulağında küçük siyah leke, kuyruğunun ucu beyaz."
            className={inputClass}
          />
        </Field>
      </FormCard>

      <FormCard
        icon={<ShieldCheck size={21} />}
        title="Genel durum"
        description="Hayvanın bulunduğu andaki fiziksel durumunu kısaca belirt."
      >
        <Field label="Sağlık / fiziksel durum">
          <textarea
            value={form.condition}
            onChange={(event) =>
              updateForm(
                "condition",
                event.target.value,
              )
            }
            rows={4}
            placeholder="Örn. Sağlıklı görünüyor, sağ ön ayağında hafif yaralanma var."
            className={inputClass}
          />
        </Field>

        <Field label="Ek açıklama" required>
          <textarea
            value={form.description}
            onChange={(event) =>
              updateForm(
                "description",
                event.target.value,
              )
            }
            rows={6}
            placeholder="Hayvanın davranışı, nerede bulunduğu ve sahibinin bilmesi gereken diğer detayları yaz."
            className={inputClass}
          />
        </Field>
      </FormCard>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm font-semibold text-[#B91C1C]"
        >
          {errorMessage}
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <input
          type="checkbox"
          checked={form.acceptResponsibility}
          onChange={(event) =>
            updateForm(
              "acceptResponsibility",
              event.target.checked,
            )
          }
          className="mt-1 h-4 w-4 accent-[#2563EB]"
        />

        <div>
          <strong className="text-sm text-[#0F172A]">
            Bilgilerin doğru olduğunu
            onaylıyorum.
          </strong>

          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            Bu hayvanı bulduğumu ve ilan
            bilgilerinin bildiğim kadarıyla doğru
            olduğunu kabul ediyorum.
          </p>
        </div>
      </label>

      {images.length < MIN_IMAGES && (
        <p className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <ImagePlus size={17} />
          İlanı yayınlamak için en az {MIN_IMAGES} fotoğraf eklemelisiniz.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || images.length < MIN_IMAGES}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            İlan hazırlanıyor...
          </>
        ) : (
          <>
            <Search size={20} />
            Buldum ilanını yayınla
          </>
        )}
      </button>
    </CreateAdLayout>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#BFDBFE]/40";

type FormCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function FormCard({
  icon,
  title,
  description,
  children,
}: FormCardProps) {
  return (
    <section className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-4 border-b border-[#F1F5F9] pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {children}
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({
  label,
  required,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#334155]">
        {label}

        {required && (
          <span className="ml-1 text-[#2563EB]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}