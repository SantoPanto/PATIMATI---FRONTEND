import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation } from "wouter";
import {
  Camera,
  Heart,
  ImagePlus,
  Loader2,
  MapPin,
  PawPrint,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import CreateAdLayout from "../components/CreateAdLayout";
import AiAutofillCard from "../components/AiAutofillCard";
import { request } from "../services/api";
import { ilIlcedenKoordinat } from "../utils/geokod";
import type { PetColor } from "../services/types";
import { extractInvalidParams, getUserErrorMessage } from "../utils/errorMessage";
import { compressImagesWithinLimit } from "../utils/imageCompression";

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

const COLOR_LABELS: Record<PetColor, string> = {
  BLACK: "Siyah",
  WHITE: "Beyaz",
  GRAY: "Gri",
  BROWN: "Kahverengi",
  ORANGE: "Turuncu",
  CREAM: "Krem",
  GOLDEN: "Altın",
  BEIGE: "Bej",
  OTHER: "Diğer",
};

const AI_COLOR_MAP: Record<string, PetColor> = {
  black: "BLACK",
  white: "WHITE",
  gray: "GRAY",
  grey: "GRAY",
  brown: "BROWN",
  orange: "ORANGE",
  cream: "CREAM",
  golden: "GOLDEN",
  beige: "BEIGE",
};

type AiAnalysis = {
  species?: string;
  is_pet?: boolean;
  breed?: string | null;
  labels?: string[];
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

type Gender = "female" | "male" | "unknown";

/* Backend enum'u: entity/enums/AgeGroup = UNKNOWN | BABY | YOUNG | ADULT | SENIOR */
type AgeGroup = "UNKNOWN" | "BABY" | "YOUNG" | "ADULT" | "SENIOR";

/*
 * Sayfa cinsiyeti kucuk harfle tutuyor, backend PetGender enum'u BUYUK
 * harf bekliyor. Esleme tek yerde dursun diye burada.
 */
const CINSIYET_KARSILIGI: Record<Gender, string> = {
  unknown: "UNKNOWN",
  female: "FEMALE",
  male: "MALE",
};

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

// FOTOĞRAF SINIRLARI — sunucudan ÖLÇÜLEREK alındı (19.08.2026). Ayrıntılı
// gerekçe ve kaynak satırları AddListingPage.tsx'te; üç oluşturma formu da
// AYNI sunucu kuralına tabi:
//   en az 1    -> AdService.java:84 / AdoptionController @RequestPart required
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

export default function AdoptionCreatePage() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dateError, setDateError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");

  const runAiAnalysis = async () => {
    if (images.length === 0) {
      setErrorMessage("AI analizi için önce en az bir fotoğraf yükleyin.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setAnalysisMessage("Fotoğraf AI tarafından analiz ediliyor...");

    try {
      const formData = new FormData();
      formData.append("file", images[0].file);

      const analysis = await request<AiAnalysis>("/api/ai/analyze", {
        method: "POST",
        body: formData,
        requiresAuth: true,
      });

      if (analysis.is_pet === false) {
        setAnalysisMessage("AI bu fotoğrafta hayvan tespit edemedi. Yine de ilanı oluşturabilirsiniz.");
      } else {
        if (analysis.species === "cat" || analysis.species === "CAT") {
          updateForm("species", "CAT");
        } else if (analysis.species === "dog" || analysis.species === "DOG") {
          updateForm("species", "DOG");
        }

        if (analysis.breed && analysis.breed.trim()) {
          updateForm("breed", analysis.breed.trim());
        }

        const etiketten = (onek: string) =>
          (analysis.labels ?? [])
            .filter((e) => e.startsWith(onek))
            .map((e) => e.slice(onek.length).toLowerCase());

        const detectedColors = etiketten("soft:color_")
          .map((ad) => AI_COLOR_MAP[ad])
          .filter((c): c is PetColor => Boolean(c));

        if (detectedColors.length > 0) {
          const uniqueColors = [...new Set(detectedColors)];
          const colorNames = uniqueColors.map((c) => COLOR_LABELS[c]).join(", ");
          updateForm("color", colorNames);
        }

        setAnalysisMessage("AI analizi tamamlandı. Bilgiler forma aktarıldı.");
      }
    } catch (err) {
      console.error("AI analiz hatası:", err);
      setAnalysisMessage("");
      setErrorMessage(getUserErrorMessage(err, "AI analizi sırasında hata oluştu."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "unknown" as Gender,
    /*
     * Backend yasi SERBEST METIN degil AgeGroup enum'u olarak tutuyor
     * (UNKNOWN | BABY | YOUNG | ADULT | SENIOR) ve @NotNull. Alan bu yuzden
     * metin kutusundan acilir listeye cevrildi.
     */
    ageGroup: "UNKNOWN" as AgeGroup,
    color: "",
    date: today,
    city: "",
    district: "",
    /*
     * AdoptionAdCreateRequest latitude/longitude'u @NotNull istiyor.
     * Konum zaten aliniyordu ama yalniz sehir/ilce metnine cevrilip
     * atiliyordu; artik saklaniyor.
     */
    latitude: "",
    longitude: "",
    title: "",
    description: "",
    vaccinated: false,
    neutered: false,
    healthInfo: "",
    adoptionConditions: "",
    acceptResponsibility: false,
  });

  const updateForm = <
    K extends keyof typeof form,
  >(
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

  const handleImages = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setErrorMessage("");

    const availableSlots =
      MAX_IMAGES - images.length;

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

    if (filesToAdd.length === 0) return;

    try {
      setIsCompressing(true);

      // Sıkıştırma SONRASI yeniden ölç (bkz. imageCompression.ts): sıkıştırma
      // başarısız olursa orijinal dosya geri geliyor ve sunucudan 413 alınıyor.
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

      setImages((current) => [
        ...current,
        ...newImages,
      ]);
    } catch (err) {
      console.error("Fotoğraf sıkıştırma hatası:", err);
    } finally {
      setIsCompressing(false);
    }
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
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage(
        "Tarayıcınız konum özelliğini desteklemiyor.",
      );
      return;
    }

    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        /*
         * Koordinati ONCE sakla: ilan icin zorunlu olan bu, sehir
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
        } catch {
          setErrorMessage(
            "Konum bilgisi şehir adına dönüştürülemedi.",
          );
        }
      },
      () => {
        setErrorMessage(
          "Konum alınamadı. Lütfen konum izni verdiğinizden emin olun.",
        );
      },
    );
  };

  /* f parametresi: gönderim anında il/ilçeden türetilen koordinatla
     zenginleşmiş kopya doğrulanabilsin diye (state henüz eskiyken). */
  const validateForm = (f: typeof form = form) => {
    if (images.length === 0) {
      return "En az 1 fotoğraf yüklemelisiniz.";
    }

    if (!f.name.trim()) {
      return "Hayvanın adını girin.";
    }

    if (!f.species) {
      return "Hayvan türünü seçin.";
    }

    /* Backend AdoptionAdCreateRequest'te breed @NotBlank */
    if (!f.breed.trim()) {
      return "Irk/cins bilgisini girin.";
    }

    if (!f.date) {
      return "İlan tarihini seçin.";
    }

    if (f.date > today) {
      return "Gelecekte bir tarih seçilemez.";
    }

    if (!f.city.trim()) {
      return "Şehir bilgisini girin.";
    }

    /*
     * Backend konumu zorunlu tutuyor ve eslestirme mesafeye bakiyor.
     * Sehir/ilce metni koordinat yerine gecmez.
     */
    if (!f.latitude || !f.longitude) {
      return '"Mevcut konumumu kullan" düğmesiyle ya da enlem/boylam alanlarına elle girerek ilanın konumunu ekleyin.';
    }

    if (!f.title.trim()) {
      return "İlan başlığını girin.";
    }

    if (!f.description.trim()) {
      return "İlan açıklamasını girin.";
    }

    if (!f.acceptResponsibility) {
      return "İlan bilgilerini doğru verdiğinizi onaylamalısınız.";
    }

    return "";
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setDateError("");

    /*
     * Koordinat boş ama il/ilçe beyanı varsa ilçe merkezinden yaklaşık
     * doldur (22.08 saha bulgusu: konum izni vermeyen kullanıcı
     * kilitleniyordu). GPS ve elle giriş her zaman önceliklidir — yalnız
     * ikisi de boşken devreye girer; başarısız olursa mevcut doğrulama
     * mesajı yolları gösterir.
     */
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

    /*
     * AdoptionAdCreateRequest'te karsiligi OLMAYAN alanlar:
     * name / city / district / vaccinated / neutered / healthInfo /
     * adoptionConditions. Bunlari gondermek yerine metin alanlarina
     * katiyoruz ki kullanicinin girdigi bilgi kaybolmasin.
     */
    const saglikSatiri = [
      form.vaccinated ? "Aşıları tam" : "",
      form.neutered ? "Kısırlaştırılmış" : "",
      form.healthInfo.trim(),
    ]
      .filter(Boolean)
      .join(" · ");

    const aciklama = [
      form.description.trim(),
      form.name.trim() ? `Adı: ${form.name.trim()}` : "",
      [form.city.trim(), form.district.trim()]
        .filter(Boolean)
        .join(" / ")
        ? `Konum: ${[form.city.trim(), form.district.trim()]
            .filter(Boolean)
            .join(" / ")}`
        : "",
      saglikSatiri ? `Sağlık: ${saglikSatiri}` : "",
      form.adoptionConditions.trim()
        ? `Sahiplendirme şartları: ${form.adoptionConditions.trim()}`
        : "",
      form.color.trim() ? `Renk: ${form.color.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const ad: Record<string, unknown> = {
      title: form.title.trim().slice(0, 150),
      description: aciklama,
      species: form.species,
      breed: form.breed.trim(),
      gender: CINSIYET_KARSILIGI[form.gender],
      ageGroup: form.ageGroup,
      colors: parseColorsFromText(form.color),
      /*
       * coatPattern ve eyeColor DTO'da istege bagli gorunuyor ama
       * ads tablosunda NOT NULL ve AdoptionServiceImpl bunlari null
       * kontrolu yapmadan geciriyor (createAdoptionAd). Gonderilmezse
       * backend 500 donuyor -- olculdu:
       *   gonderilmeyince -> 500 "null value in column coat_pattern"
       *   UNKNOWN verilince -> 201
       * Backend duzelene kadar acikca UNKNOWN gonderiliyor.
       */
      coatPattern: "UNKNOWN",
      eyeColor: "UNKNOWN",
      latitude: Number(gonderilecek.latitude),
      longitude: Number(gonderilecek.longitude),
      /*
       * İl/ilçe beyanı (BE V19): form zaten soruyor; yapılandırılmış alan
       * olarak da gider ki kartlar ham koordinat yerine bunu gösterebilsin.
       * Boşsa alan hiç gönderilmez (undefined, JSON.stringify'da düşer) —
       * sunucu o durumda koordinattan çözmeyi dener.
       */
      city: form.city.trim() || undefined,
      district: form.district.trim() || undefined,
      isMatchRequired: false,
    };

    /*
     * Payload temizligi: date veya lostDate alani bos ("") ise
     * backend'e "" GONDERTILMEZ. Yalnizca doluysa eklenir.
     */
    if (form.date && form.date.trim() !== "") {
      ad.date = form.date;
      ad.lostDate = form.date;
    }

    if (!ad.date || ad.date === "") {
      delete ad.date;
    }
    if (!ad.lostDate || ad.lostDate === "") {
      delete ad.lostDate;
    }

    /*
     * Spring Boot @RequestPart("ad") + @RequestPart("images") bekliyor
     * (images required=true). Kalip AddListingPage'den.
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
      await request("/api/adoptions", {
        method: "POST",
        requiresAuth: true,
        body: formData,
      });

      /*
       * /adoption/:id su an sahte veriyle calisan bir sayfa; oraya
       * yonlendirmek kullaniciyi baskasinin ilanina goturur.
       * Sahiplendirme listesine donuluyor.
       */
      navigate("/adoption");
    } catch (error) {
      console.error("Sahiplendirme ilanı oluşturma hatası:", error);

      const invalidParams = extractInvalidParams(error);
      if (invalidParams) {
        const dateParam = invalidParams.find((p) => {
          const name = p.name || p.field;
          return name === "date" || name === "lostDate";
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
    <CreateAdLayout activeType="adopt">
      <FormCard
              icon={<Camera size={21} />}
              title="Fotoğraflar"
              description="Dostunun net ve güncel fotoğraflarını ekle."
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
                  className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center transition hover:border-[#FB923C] hover:bg-[#FFF7ED] disabled:opacity-50"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFEDD5] text-[#F97316]">
                    {isCompressing ? (
                      <Loader2 size={30} className="animate-spin" />
                    ) : (
                      <ImagePlus size={30} />
                    )}
                  </div>

                  <strong className="mt-4 text-lg">
                    {isCompressing ? "Sıkıştırılıyor..." : "Fotoğraf yükle"}
                  </strong>

                  <span className="mt-2 text-sm text-[#64748B]">
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
                        className="relative overflow-hidden rounded-2xl border border-[#E2E8F0]"
                      >
                        <img
                          src={image.preview}
                          alt={`Sahiplendirme fotoğrafı ${index + 1}`}
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
                        className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] transition hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-50"
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 size={25} className="animate-spin text-[#F97316]" />
                            <span className="mt-2 text-sm font-semibold">Sıkıştırılıyor...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={25} />
                            <span className="mt-2 text-sm font-semibold">
                              Fotoğraf ekle
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-[#64748B]">
                    {images.length}/{MAX_IMAGES} fotoğraf
                    yüklendi.
                  </p>
                </>
              )}

              <AiAutofillCard
                onAnalyze={runAiAnalysis}
                isAnalyzing={isAnalyzing}
                disabled={isSubmitting}
                analysisMessage={analysisMessage}
                hasImages={images.length > 0}
                variant="adoption"
              />
            </FormCard>

            <FormCard
              icon={<PawPrint size={21} />}
              title="Hayvan bilgileri"
              description="Dostunu tanımamıza yardımcı olacak temel bilgileri gir."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Adı" required>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateForm("name", e.target.value)
                    }
                    placeholder="Örn. Pamuk"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tür" required>
                  <select
                    value={form.species}
                    onChange={(e) =>
                      updateForm(
                        "species",
                        e.target.value,
                      )
                    }
                    className={inputClass}
                  >
                    {/*
                      Yalniz CAT ve DOG: backend Species enum'unda
                      BIRD/OTHER YOK ve AdoptionAdCreateRequest bunu
                      ayrica dogruluyor (@AssertTrue "Tür kedi (CAT)
                      veya köpek (DOG) olmalıdır").
                    */}
                    <option value="">Tür seçin</option>
                    <option value="CAT">Kedi</option>
                    <option value="DOG">Köpek</option>
                  </select>
                </Field>

                <Field label="Irk" required>
                  <input
                    value={form.breed}
                    onChange={(e) =>
                      updateForm("breed", e.target.value)
                    }
                    placeholder="Örn. Tekir"
                    className={inputClass}
                  />
                </Field>

                {/*
                  Serbest metin ("2 yaş") yerine acilir liste: backend
                  yasi AgeGroup enum'u olarak tutuyor.
                */}
                <Field label="Yaş grubu">
                  <select
                    value={form.ageGroup}
                    onChange={(e) =>
                      updateForm(
                        "ageGroup",
                        e.target.value as AgeGroup,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="UNKNOWN">
                      Bilinmiyor
                    </option>

                    <option value="BABY">
                      Yavru
                    </option>

                    <option value="YOUNG">
                      Genç
                    </option>

                    <option value="ADULT">
                      Yetişkin
                    </option>

                    <option value="SENIOR">
                      Yaşlı
                    </option>
                  </select>
                </Field>

                <Field label="Cinsiyet">
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      updateForm(
                        "gender",
                        e.target.value as Gender,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="unknown">
                      Bilinmiyor
                    </option>
                    <option value="female">
                      Dişi
                    </option>
                    <option value="male">
                      Erkek
                    </option>
                  </select>
                </Field>

                <Field label="Renk">
                  <input
                    value={form.color}
                    onChange={(e) =>
                      updateForm("color", e.target.value)
                    }
                    placeholder="Örn. Beyaz - turuncu"
                    className={inputClass}
                  />
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
              </div>
            </FormCard>

            <FormCard
              icon={<ShieldCheck size={21} />}
              title="Sağlık durumu"
              description="Yeni sahibinin bilmesi gereken sağlık bilgilerini paylaş."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckBox
                  checked={form.vaccinated}
                  onChange={(value) =>
                    updateForm("vaccinated", value)
                  }
                  title="Aşıları yapıldı"
                  description="Temel aşıları güncel."
                />

                <CheckBox
                  checked={form.neutered}
                  onChange={(value) =>
                    updateForm("neutered", value)
                  }
                  title="Kısırlaştırıldı"
                  description="Kısırlaştırma işlemi yapıldı."
                />
              </div>

              <Field label="Ek sağlık bilgileri">
                <textarea
                  value={form.healthInfo}
                  onChange={(e) =>
                    updateForm(
                      "healthInfo",
                      e.target.value,
                    )
                  }
                  placeholder="Varsa kronik hastalık, ilaç kullanımı veya özel bakım ihtiyacını belirt."
                  rows={4}
                  className={inputClass}
                />
              </Field>
            </FormCard>

            <FormCard
              icon={<MapPin size={21} />}
              title="Konum"
              description="Dostunun bulunduğu veya teslim edilebileceği bölgeyi belirt."
            >
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5 text-sm font-bold text-[#EA580C] transition hover:bg-[#FFEDD5]"
                >
                  <MapPin size={17} />
                  Mevcut konumumu kullan
                </button>
              </div>

              {/* Konum izni kapalıyken form kilitleniyordu (22.08 saha
                  bulgusu): koordinatın tek kaynağı GPS'ti, il/ilçe metni
                  koordinat yerine geçmiyor. Kayıp ve bulundu formlarındaki
                  elle giriş deseninin aynısı. */}
              <div className="mb-5 grid gap-5 sm:grid-cols-2">
                <Field label="Enlem" required>
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    required
                    value={form.latitude}
                    onChange={(e) =>
                      updateForm("latitude", e.target.value)
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
                    onChange={(e) =>
                      updateForm("longitude", e.target.value)
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
                    onChange={(e) =>
                      updateForm("city", e.target.value)
                    }
                    placeholder="Bursa"
                    className={inputClass}
                  />
                </Field>

                <Field label="İlçe">
                  <input
                    value={form.district}
                    onChange={(e) =>
                      updateForm(
                        "district",
                        e.target.value,
                      )
                    }
                    placeholder="Nilüfer"
                    className={inputClass}
                  />
                </Field>
              </div>
            </FormCard>

            <FormCard
              icon={<Heart size={21} />}
              title="İlan detayları"
              description="Yeni yuva adaylarının görmesini istediğin bilgileri paylaş."
            >
              <Field label="İlan başlığı" required>
                <input
                  value={form.title}
                  onChange={(e) =>
                    updateForm("title", e.target.value)
                  }
                  placeholder="Örn. Pamuk için sevgi dolu bir yuva arıyoruz"
                  className={inputClass}
                />
              </Field>

              <Field label="Açıklama" required>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Karakteri, alışkanlıkları, insanlarla ve diğer hayvanlarla ilişkisi hakkında bilgi ver."
                  rows={6}
                  className={inputClass}
                />
              </Field>

              <Field label="Sahiplendirme koşulları">
                <textarea
                  value={form.adoptionConditions}
                  onChange={(e) =>
                    updateForm(
                      "adoptionConditions",
                      e.target.value,
                    )
                  }
                  placeholder="Varsa sahiplendirme için önem verdiğin şartları belirt."
                  rows={4}
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
                onChange={(e) =>
                  updateForm(
                    "acceptResponsibility",
                    e.target.checked,
                  )
                }
                className="mt-1 h-4 w-4 accent-[#F97316]"
              />

              <div>
                <strong className="text-sm text-[#0F172A]">
                  Bilgilerin doğruluğunu onaylıyorum.
                </strong>

                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  İlanda verdiğim bilgilerin doğru olduğunu
                  ve sahiplendirme sürecinde hayvanın
                  güvenliğini önceliklendireceğimi kabul
                  ediyorum.
                </p>
              </div>
            </label>

            {/* Pasif düğmenin SEBEBİ yazılmalı; sebepsiz pasif düğme kullanıcıyı
                formu baştan sona kontrol etmeye zorlar. */}
            {images.length < MIN_IMAGES && (
              <p className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                <ImagePlus size={17} />
                İlanı yayınlamak için en az {MIN_IMAGES} fotoğraf eklemelisiniz.
              </p>
            )}

            <button
              type="button"
              disabled={isSubmitting || images.length < MIN_IMAGES}
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  İlan hazırlanıyor...
                </>
              ) : (
                <>
                  <Heart size={20} />
                  Sahiplendirme ilanını yayınla
                </>
              )}
            </button>
    </CreateAdLayout>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA]/40";

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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
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

      <div className="space-y-5">{children}</div>
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
          <span className="ml-1 text-[#F97316]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

type CheckBoxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
};

function CheckBox({
  checked,
  onChange,
  title,
  description,
}: CheckBoxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition hover:border-[#FDBA74]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 accent-[#F97316]"
      />

      <div>
        <strong className="text-sm">
          {title}
        </strong>

        <p className="mt-1 text-xs leading-5 text-[#64748B]">
          {description}
        </p>
      </div>
    </label>
  );
}