import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLocation } from "wouter";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Info,
  Loader2,
  MapPin,
  PawPrint,
  Send,
  Upload,
  X,
} from "lucide-react";

import CreateAdLayout from "../components/CreateAdLayout";
import AiAutofillCard from "../components/AiAutofillCard";
import AiMatchModal from "../components/AiMatchModal";
import { request } from "../services/api";
import type { AdResponse, MatchedAdResponseDTO } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";
import { compressImages } from "../utils/imageCompression";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AdType = "LOST" | "FOUND" | "ADOPTION";
type Species = "CAT" | "DOG";

type PetColor =
  | "BLACK"
  | "WHITE"
  | "GRAY"
  | "BROWN"
  | "ORANGE"
  | "CREAM"
  | "GOLDEN"
  | "BEIGE"
  | "OTHER";

type PetGender = "UNKNOWN" | "FEMALE" | "MALE";

type AgeGroup =
  | "UNKNOWN"
  | "BABY"
  | "YOUNG"
  | "ADULT"
  | "SENIOR";

type CoatPattern =
  | "UNKNOWN"
  | "SOLID"
  | "STRIPED"
  | "SPOTTED"
  | "PATCHED"
  | "CALICO"
  | "TORTOISESHELL"
  | "OTHER";

type PresenceStatus = "UNKNOWN" | "YES" | "NO";

type EyeColor =
  | "UNKNOWN"
  | "BROWN"
  | "BLUE"
  | "GREEN"
  | "AMBER"
  | "HAZEL"
  | "HETEROCHROMIA"
  | "OTHER";

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

type AiAnalysis = {
  embedding?: number[];
  labels?: string[];
  species?: string;
  species_confidence?: number;
  is_pet?: boolean;
  breed?: string | null;
  breed_confidence?: number;
  pattern?: string | null;

  /*
   * DIKKAT: AI burada renk ADI degil, baskin renklerin RGB degerlerini
   * donduruyor (orn. { r: 130, g: 130, b: 130, score: 0.8 }). Renklerin
   * okunabilir adlari `labels` icinde "soft:color_gray" bicimindedir.
   * Tip eskiden string[] yaziyordu; String(nesne) "[object Object]" verdigi
   * icin hicbir renk eslesmiyordu.
   */
  colors?: Array<{
    r: number;
    g: number;
    b: number;
    score: number;
  }>;

  model_version?: string;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

// FOTOĞRAF SINIRLARI — sunucudan ÖLÇÜLEREK alındı, tahmin edilmedi.
// Bu üç sayı ön yüzde uydurulamaz: sunucu zaten uyguluyor, ön yüz yalnızca
// kullanıcıya ÖNCEDEN söylemek için biliyor. Kaynak (19.08.2026):
//   en az 1  -> AdService.java:84  "İlan oluşturmak için en az bir fotoğraf
//               yüklenmelidir" (AdController'da @RequestPart required = true)
//   en fazla 3 -> S3ImageStorageServiceImpl.java:64 (ETKİN @Service sınıfı)
//               "Bir ilana en fazla 3 fotoğraf yüklenebilir"
//   5 MB     -> application.yml  spring.servlet.multipart.max-file-size: 5MB
//
// ⚠ Bu değerler önceden 5 ve 10 MB yazıyordu, yani ön yüz sunucunun
// REDDEDECEĞİ seçimlere izin veriyordu: kullanıcı 4. fotoğrafı ya da 7 MB'lık
// dosyayı sorunsuzca seçiyor, hatayı ancak gönderdikten sonra görüyordu.
// Sunucu sınırı değişirse BURASI DA değişmeli.
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

const SPECIES_LABELS: Record<Species, string> = {
  CAT: "Kedi",
  DOG: "Köpek",
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

const AI_PATTERN_MAP: Record<string, CoatPattern> = {
  solid: "SOLID",
  striped: "STRIPED",
  spotted: "SPOTTED",
  patched: "PATCHED",
  calico: "CALICO",
  tortoiseshell: "TORTOISESHELL",

  /*
   * AI "tabby" diyor ve bu kedilerde en sik gorulen desen; listede karsiligi
   * yoktu, o yuzden tekir kedilerde desen hic dolmuyordu.
   *
   * STRIPED'a baglamak bir yaklastirma (tabby tam olarak "cizgili" demek
   * degil, benekli/alacali alt turleri de var). SORULDU VE KARARA BAGLANDI
   * (SenaF116, 11.08): "tabby cizgili bir desen oldugu icin mevcut enum
   * icinde en dogru karsiligi o. Ileride filtreleme veya veri modeli
   * acisindan ihtiyac olursa ayri bir TABBY secenegi dusunulur."
   * ⇒ Bu satir acik bir soru DEGIL; yeniden tartismaya acmadan once
   *   yukaridaki gerekcenin gecerliligini yitirip yitirmedigine bak.
   */
  tabby: "STRIPED",
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AddListingPage() {
  const [, navigate] = useLocation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------ Images -------------------------------- */

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  /* ------------------------------ Listing ------------------------------- */

  const [adType, setAdType] = useState<AdType>("LOST");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  /* ------------------------------ Animal -------------------------------- */

  const [species, setSpecies] = useState<Species>("CAT");

  const [breed, setBreed] = useState("");

  const [colors, setColors] = useState<PetColor[]>([]);

  const [gender, setGender] =
    useState<PetGender>("UNKNOWN");

  const [ageGroup, setAgeGroup] =
    useState<AgeGroup>("UNKNOWN");

  const [coatPattern, setCoatPattern] =
    useState<CoatPattern>("UNKNOWN");

  const [eyeColor, setEyeColor] =
    useState<EyeColor>("UNKNOWN");

  /* ------------------------------ Collar -------------------------------- */

  const [collarStatus, setCollarStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [collarColor, setCollarColor] =
    useState<PetColor | null>(null);

  const [collarTagText, setCollarTagText] =
    useState("");

  /* ------------------------------ Ear / chip ---------------------------- */

  const [earTagStatus, setEarTagStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [earNotchStatus, setEarNotchStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [microchipNumber, setMicrochipNumber] =
    useState("");

  /* ------------------------------ Date & Info --------------------------- */

  const [lostDate, setLostDate] = useState(today);

  const [distinctiveMarks, setDistinctiveMarks] =
    useState("");

  /* ------------------------------ Location ------------------------------ */

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  /* ------------------------------ UI state ------------------------------ */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisMessage, setAnalysisMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [matches, setMatches] = useState<MatchedAdResponseDTO[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  const createImageId = (file: File) => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
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
          `${file.name} ${MAX_FILE_SIZE_MB} MB'dan büyük. Her fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`,
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

    if (
      validFiles.length > availableSlots
    ) {
      setErrorMessage(
        `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`,
      );
    }

    if (filesToAdd.length === 0) return;

    try {
      setIsCompressing(true);
      const compressedFiles = await compressImages(filesToAdd);
      const newImages = compressedFiles.map((file) => ({
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

  const toggleColor = (color: PetColor) => {
    setColors((current) => {
      if (current.includes(color)) {
        return current.filter(
          (item) => item !== color,
        );
      }

      if (current.length >= 9) {
        setErrorMessage(
          "En fazla 9 renk seçebilirsiniz.",
        );
        return current;
      }

      return [...current, color];
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Geolocation                                                            */
  /* ---------------------------------------------------------------------- */

  const getLocation = () => {
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage(
        "Tarayıcınız konum özelliğini desteklemiyor.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(
          coords.latitude.toFixed(6),
        );

        setLongitude(
          coords.longitude.toFixed(6),
        );
      },
      () => {
        setErrorMessage(
          "Konum alınamadı. Lütfen tarayıcınızdan konum iznini etkinleştirin.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  /* ---------------------------------------------------------------------- */
  /* AI analysis                                                            */
  /* ---------------------------------------------------------------------- */

  /*
   * AI servisine DOĞRUDAN gidilmez; istek backend üzerinden geçer (A1).
   *
   * Eskiden burada `fetch("http://localhost:8000/analyze")` vardı: adres kodun
   * içine gömülüydü ve istek kimliksizdi. İki sonucu vardı — AI servisi
   * internete açık olmak ZORUNDAYDI (uçlarına kimlik konsa bu ekran kırılırdı,
   * entegrasyon sözleşmesi §10 ise AI'nın iç ağda kalmasını söylüyor) ve giriş
   * yapmamış biri de modeli çalıştırabiliyordu.
   *
   * Merkezi API servisi JWT'yi Authorization başlığına otomatik ekler ve
   * FormData gövdesinde Content-Type'a dokunmaz (sınır dizgisini tarayıcı
   * yazar). Hata durumunda ApiError fırlatır; çağıran zaten `.message`
   * okuyor, bu yüzden buradaki elle hata çözümlemesi de gereksizleşti.
   */
  const analyzeImage = async (file: File) => {
    const formData = new FormData();

    formData.append("file", file);

    return await request<AiAnalysis>(
      "/api/ai/analyze",
      {
        method: "POST",
        body: formData,
        requiresAuth: true,
      },
    );
  };

  const applyAiAnalysis = (
    analysis: AiAnalysis,
  ) => {
    if (
      analysis.species === "cat" ||
      analysis.species === "CAT"
    ) {
      setSpecies("CAT");
    } else if (
      analysis.species === "dog" ||
      analysis.species === "DOG"
    ) {
      setSpecies("DOG");
    }

    if (
      analysis.breed &&
      analysis.breed.trim()
    ) {
      setBreed(analysis.breed);
    }

    if (
      analysis.pattern &&
      AI_PATTERN_MAP[
        analysis.pattern.toLowerCase()
      ]
    ) {
      setCoatPattern(
        AI_PATTERN_MAP[
          analysis.pattern.toLowerCase()
        ],
      );
    }

    /*
     * Renkler `colors` alanindan DEGIL `labels`tan okunuyor.
     * `colors` baskin renklerin RGB degerlerini tasiyor; okunabilir adlar
     * etiketlerde "soft:color_gray" bicimindedir. Eskiden RGB nesnesi
     * String()'e verildigi icin "[object Object]" cikiyor ve hicbir renk
     * eslesmiyordu.
     */
    const etiketten = (onek: string) =>
      (analysis.labels ?? [])
        .filter((etiket) =>
          etiket.startsWith(onek),
        )
        .map((etiket) =>
          etiket
            .slice(onek.length)
            .toLowerCase(),
        );

    const detectedColors = etiketten(
      "soft:color_",
    )
      .map((ad) => AI_COLOR_MAP[ad])
      .filter(
        (color): color is PetColor =>
          Boolean(color),
      );

    if (detectedColors.length > 0) {
      setColors([
        ...new Set(detectedColors),
      ]);
    }

    // Goz rengi (eye_color)
    const eyeColors = etiketten("hard:eye_color_");
    if (eyeColors.length > 0 && eyeColors[0] !== "unknown") {
      const eyeMap: Record<string, EyeColor> = {
        brown: "BROWN",
        blue: "BLUE",
        green: "GREEN",
        amber: "AMBER",
        hazel: "HAZEL",
        heterochromia: "HETEROCHROMIA",
      };
      if (eyeMap[eyeColors[0]]) {
        setEyeColor(eyeMap[eyeColors[0]]);
      }
    }

    // Tasma (collar)
    const collar = etiketten("bonus:collar_");
    if (collar.length > 0) {
      if (collar[0] === "collar") {
        setCollarStatus("YES");
      } else if (collar[0] === "no_collar") {
        setCollarStatus("NO");
      }
    }

    // Kulak Kupesi (ear_tag)
    const earTag = etiketten("bonus:ear_tag_");
    if (earTag.length > 0) {
      if (earTag[0] === "ear_tag") {
        setEarTagStatus("YES");
      } else if (earTag[0] === "no_ear_tag") {
        setEarTagStatus("NO");
      }
    }
  };

  const runAiAnalysis = async () => {
    if (images.length === 0) {
      setErrorMessage(
        "AI analizi için önce en az bir fotoğraf yükleyin.",
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setAnalysisMessage(
      "Fotoğraf AI tarafından analiz ediliyor...",
    );

    try {
      const analysis = await analyzeImage(images[0].file);

      if (analysis.is_pet === false) {
        setAnalysisMessage(
          "AI bu fotoğrafta hayvan tespit edemedi. Yine de ilanı oluşturabilirsiniz.",
        );
      } else {
        applyAiAnalysis(analysis);
        setAnalysisMessage(
          "AI analizi tamamlandı. Olası eşleşmeler aranıyor...",
        );

        // Fetch matches concurrently
        try {
          const formData = new FormData();
          formData.append("listingType", adType);
          images.forEach((img) => formData.append("images", img.file));

          // Konum girildiyse gönder: pop-up adayları asenkron eşleştirmeyle
          // aynı 25 km süzgecinden geçer ve konum cezası uygulanır (B8).
          // Boşsa göndermiyoruz — backend konumsuz yolu koruyor (analiz
          // düğmesine konum girilmeden basılabiliyor).
          if (latitude.trim() && longitude.trim()) {
            formData.append("latitude", latitude.trim());
            formData.append("longitude", longitude.trim());
          }

          const matchesData = await request<MatchedAdResponseDTO[]>("/api/ai-match", {
            method: "POST",
            body: formData,
            requiresAuth: true,
          });

          if (matchesData && matchesData.length > 0) {
            setMatches(matchesData);
            setShowMatchModal(true);
          }
        } catch (matchError) {
          console.error("Eşleştirme hatası:", matchError);
        } finally {
          setIsAnalyzing(false);
          setAnalysisMessage("");
        }
      }
    } catch (error) {
      console.error("AI analiz hatası:", error);
      setAnalysisMessage("");

      setErrorMessage(
        getUserErrorMessage(error, "AI analizi sırasında hata oluştu."),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
    /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */

  const validateForm = () => {
    if (images.length === 0) {
      return "En az bir fotoğraf yüklemelisiniz.";
    }

    if (!title.trim()) {
      return "İlan başlığı zorunludur.";
    }

    if (!description.trim()) {
      return "Açıklama zorunludur.";
    }

    if (!species) {
      return "Hayvan türünü seçiniz.";
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!latitude.trim() || !longitude.trim()) {
      return "Konum bilgisi zorunludur.";
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return "Geçerli bir enlem değeri giriniz.";
    }

    if (
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      return "Geçerli bir boylam değeri giriniz.";
    }

    if (!lostDate || lostDate.trim() === "") {
      return "Tarih bilgisi zorunludur.";
    }

    if (lostDate > today) {
      return "Gelecekte bir tarih seçilemez.";
    }

    return null;
  };

  /* ---------------------------------------------------------------------- */
  /* Create listing                                                         */
  /* ---------------------------------------------------------------------- */

  const submitListing = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setAnalysisMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * This object follows AdCreateRequest from Spring Boot.
       *
       * IMPORTANT:
       * AI fields such as embedding, labels, model_version,
       * ai_species, etc. are NOT sent here because Spring's
       * AdCreateRequest does not accept them.
       */
      const ad: Record<string, unknown> = {
        title: title.trim(),

        description: description.trim(),

        adType,

        species,

        breed: breed.trim(),

        colors: Array.isArray(colors) ? colors : [],

        gender,

        ageGroup,

        coatPattern,

        collarStatus,

        collarColor,

        collarTagText:
          collarTagText.trim(),

        eyeColor,

        earTagStatus,

        earNotchStatus,

        microchipNumber:
          microchipNumber
            .replace(/\s+/g, "")
            .trim(),

        distinctiveMarks:
          distinctiveMarks.trim(),

        latitude: Number(latitude),

        longitude: Number(longitude),

        isMatchRequired: true,
      };

      /*
       * ⚠ Tarih YALNIZ `lostDate` olarak gönderilir. `date` alanı sunucuda
       * `lostDate`'in @JsonAlias'ıdır; ikisi birden gönderilirse Jackson aynı
       * record bileşenine ikinci kez yazmaya çalışır, geri düşecek bir setter
       * bulamaz ve isteğin TAMAMINI reddeder:
       *
       *   No fallback setter/field defined for creator property 'lostDate'
       *   (through reference chain: AdCreateRequest["date"])
       *
       * Ölçüldü (21.08, canlı): POST /api/ads iki denemede de 500 döndü ve
       * hiç ilan oluşmadı. Takma ad sunucuda KALIYOR — yalnız `date` gönderen
       * eski bir istemci varsa o çalışmaya devam eder; kıran şey ikisini
       * BİRLİKTE göndermekti.
       */
      if (lostDate && lostDate.trim() !== "") {
        ad.lostDate = lostDate;
      }

      if (!ad.lostDate || ad.lostDate === "") {
        delete ad.lostDate;
      }

      /*
       * Spring Boot expects:
       *
       * @RequestPart("ad") AdCreateRequest
       * @RequestPart("images") List<MultipartFile>
       *
       * Therefore the JSON must be sent as a Blob.
       */
      const formData = new FormData();

      formData.append(
        "ad",
        new Blob(
          [JSON.stringify(ad)],
          {
            type: "application/json",
          },
        ),
      );

      images.forEach((image) => {
        formData.append(
          "images",
          image.file,
        );
      });

      /*
       * Merkezi API servisi JWT'yi Authorization başlığına otomatik ekler.
       * FormData kullanıldığı için Content-Type başlığını tarayıcı boundary
       * değeriyle birlikte kendisi oluşturur.
       */
      const url = adType === "ADOPTION" ? "/api/adoptions" : "/api/ads";
      const responseData = await request<AdResponse>(url, {
        method: "POST",
        requiresAuth: true,
        body: formData,
      });

      console.log(
        "PatiMati listing created:",
        responseData,
      );

      /*
       * Release preview object URLs.
       */
      images.forEach((image) => {
        URL.revokeObjectURL(
          image.preview,
        );
      });

      /*
       * Reset everything after successful
       * Spring Boot response.
       */
      setImages([]);

      setTitle("");
      setDescription("");

      setAdType("LOST");

      setSpecies("CAT");
      setBreed("");
      setColors([]);

      setGender("UNKNOWN");
      setAgeGroup("UNKNOWN");
      setCoatPattern("UNKNOWN");
      setEyeColor("UNKNOWN");

      setCollarStatus("UNKNOWN");
      setCollarColor(null);
      setCollarTagText("");

      setEarTagStatus("UNKNOWN");
      setEarNotchStatus("UNKNOWN");

      setMicrochipNumber("");
      setLostDate("");
      setDistinctiveMarks("");

      setLatitude("");
      setLongitude("");

      setAnalysisMessage(
        "İlan başarıyla oluşturuldu.",
      );

      /*
       * Give the user a moment to see the
       * success message before returning.
       */
      window.setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      console.error(
        "Create listing error:",
        error,
      );

      setErrorMessage(
        getUserErrorMessage(error, "İlan oluşturulurken bir hata oluştu."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render helpers                                                         */
  /* ---------------------------------------------------------------------- */

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7c5cff] focus:ring-2 focus:ring-[#7c5cff]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6";

  const disabled =
    isSubmitting || isAnalyzing;

  // ⚠ Fotoğraf koşulu bilerek `disabled`e EKLENMEDİ: o bayrak formdaki bütün
  // girdilerde kullanılıyor (metin alanları, seçim kutuları ve FOTOĞRAF YÜKLEME
  // alanı dâhil). Oraya eklenseydi fotoğrafı olmayan kullanıcı fotoğraf da
  // yükleyemezdi — kilitlenme. Bu yüzden yalnız gönder düğmesine bakan ayrı bir
  // bayrak var.
  const fotografEksik = images.length < MIN_IMAGES;
  const gonderilemez = disabled || fotografEksik;

  /* ---------------------------------------------------------------------- */
  /* JSX                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <CreateAdLayout activeType="lost">
      <form
        onSubmit={submitListing}
        className="space-y-5"
      >
          {/* ---------------------------------------------------------------- */}
          {/* PHOTOS                                                           */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Camera
                    size={20}
                    className="text-[#7c5cff]"
                  />
                  Fotoğraflar
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  <strong className="text-gray-700">
                    En az {MIN_IMAGES} fotoğraf zorunlu.
                  </strong>{" "}
                  En fazla {MAX_IMAGES} fotoğraf, her biri en fazla{" "}
                  {MAX_FILE_SIZE_MB} MB (JPG, PNG veya WEBP).
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {images.length}/{MAX_IMAGES}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImages}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {images.map(
                (image, index) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
                  >
                    <img
                      src={image.preview}
                      alt={`Hayvan fotoğrafı ${
                        index + 1
                      }`}
                      className="h-full w-full object-cover"
                    />

                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                        AI fotoğrafı
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          image.id,
                        )
                      }
                      disabled={disabled}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Fotoğrafı kaldır"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ),
              )}

              {images.length <
                MAX_IMAGES && (
                <button
                  type="button"
                  onClick={
                    openFilePicker
                  }
                  disabled={disabled || isCompressing}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 transition hover:border-[#7c5cff]/50 hover:bg-[#7c5cff]/5 hover:text-[#7c5cff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-[#7c5cff]" />
                      <span className="text-xs font-semibold">Sıkıştırılıyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span className="text-xs font-semibold">Fotoğraf Ekle</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <AiAutofillCard
              onAnalyze={runAiAnalysis}
              isAnalyzing={isAnalyzing}
              disabled={disabled}
              analysisMessage={analysisMessage}
              hasImages={images.length > 0}
              variant="lost"
            />
          </section>

          {/* ---------------------------------------------------------------- */}


          {/* ---------------------------------------------------------------- */}
          {/* BASIC INFORMATION                                                */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <PawPrint
                size={20}
                className="text-[#7c5cff]"
              />
              Temel Bilgiler
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="listing-title"
                  className={labelClass}
                >
                  İlan Başlığı
                </label>

                <input
                  id="listing-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  maxLength={150}
                  required
                  disabled={disabled}
                  placeholder="Örn. Bursa'da kayıp tekir kedi"
                  className={inputClass}
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {title.length}/150
                </p>
              </div>

              <div>
                <label
                  htmlFor="listing-description"
                  className={labelClass}
                >
                  Açıklama
                </label>

                <textarea
                  id="listing-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  maxLength={3000}
                  rows={5}
                  disabled={disabled}
                  placeholder="Hayvan hakkında mümkün olduğunca fazla bilgi verin..."
                  className={`${inputClass} resize-none`}
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {description.length}/3000
                </p>
              </div>
            </div>
          </section>
                    {/* ---------------------------------------------------------------- */}
          {/* ANIMAL INFORMATION                                               */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <PawPrint
                size={20}
                className="text-[#7c5cff]"
              />
              Hayvan Bilgileri
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Species */}
              <div>
                <label
                  htmlFor="species"
                  className={labelClass}
                >
                  Tür
                </label>

                <select
                  id="species"
                  value={species}
                  onChange={(event) =>
                    setSpecies(
                      event.target.value as Species,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  {/*
                    Etiketler SPECIES_LABELS'tan okunuyor: tur adi burada ve
                    sabitte iki ayri yerde yazilirsa biri degistiginde digeri
                    sessizce eski kalir. Sabit zaten bunun icin tanimlanmisti.
                  */}
                  {(
                    Object.keys(
                      SPECIES_LABELS,
                    ) as Species[]
                  ).map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {SPECIES_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Breed */}
              <div>
                <label
                  htmlFor="breed"
                  className={labelClass}
                >
                  Cins
                </label>

                <input
                  id="breed"
                  value={breed}
                  onChange={(event) =>
                    setBreed(
                      event.target.value,
                    )
                  }
                  maxLength={100}
                  disabled={disabled}
                  placeholder="AI tarafından otomatik doldurulur"
                  className={inputClass}
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className={labelClass}
                >
                  Cinsiyet
                </label>

                <select
                  id="gender"
                  value={gender}
                  onChange={(event) =>
                    setGender(
                      event.target.value as PetGender,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="FEMALE">
                    Dişi
                  </option>
                  <option value="MALE">
                    Erkek
                  </option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label
                  htmlFor="age-group"
                  className={labelClass}
                >
                  Yaş Grubu
                </label>

                <select
                  id="age-group"
                  value={ageGroup}
                  onChange={(event) =>
                    setAgeGroup(
                      event.target.value as AgeGroup,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
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
              </div>

              {/* Coat pattern */}
              <div>
                <label
                  htmlFor="coat-pattern"
                  className={labelClass}
                >
                  Tüy Deseni
                </label>

                <select
                  id="coat-pattern"
                  value={coatPattern}
                  onChange={(event) =>
                    setCoatPattern(
                      event.target.value as CoatPattern,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="SOLID">
                    Düz
                  </option>
                  <option value="STRIPED">
                    Çizgili
                  </option>
                  <option value="SPOTTED">
                    Benekli
                  </option>
                  <option value="PATCHED">
                    Parçalı
                  </option>
                  <option value="CALICO">
                    Calico
                  </option>
                  <option value="TORTOISESHELL">
                    Kaplumbağa kabuğu
                  </option>
                  <option value="OTHER">
                    Diğer
                  </option>
                </select>
              </div>

              {/* Eye color */}
              <div>
                <label
                  htmlFor="eye-color"
                  className={labelClass}
                >
                  Göz Rengi
                </label>

                <select
                  id="eye-color"
                  value={eyeColor}
                  onChange={(event) =>
                    setEyeColor(
                      event.target.value as EyeColor,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="BROWN">
                    Kahverengi
                  </option>
                  <option value="BLUE">
                    Mavi
                  </option>
                  <option value="GREEN">
                    Yeşil
                  </option>
                  <option value="AMBER">
                    Kehribar
                  </option>
                  <option value="HAZEL">
                    Ela
                  </option>
                  <option value="HETEROCHROMIA">
                    Heterokromi
                  </option>
                  <option value="OTHER">
                    Diğer
                  </option>
                </select>
              </div>
            </div>

            {/* Colors */}
            <div className="mt-5">
              <p className={labelClass}>
                Renkler
              </p>

              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(
                    COLOR_LABELS,
                  ) as PetColor[]
                ).map((color) => {
                  const selected =
                    colors.includes(color);

                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        toggleColor(
                          color,
                        )
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-[#7c5cff] bg-[#7c5cff] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#7c5cff]/50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {COLOR_LABELS[color]}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                En fazla 9 renk seçebilirsiniz.
              </p>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* ADDITIONAL INFORMATION                                            */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <Info
                size={20}
                className="text-[#7c5cff]"
              />
              Ek Bilgiler
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Collar */}
              <div>
                <label
                  htmlFor="collar-status"
                  className={labelClass}
                >
                  Tasma
                </label>

                <select
                  id="collar-status"
                  value={collarStatus}
                  onChange={(event) =>
                    setCollarStatus(
                      event.target.value as PresenceStatus,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="YES">
                    Var
                  </option>
                  <option value="NO">
                    Yok
                  </option>
                </select>
              </div>

              {/* Collar color */}
              <div>
                <label
                  htmlFor="collar-color"
                  className={labelClass}
                >
                  Tasma Rengi
                </label>

                <select
                  id="collar-color"
                  value={collarColor ?? ""}
                  onChange={(event) =>
                    setCollarColor(
                      event.target.value
                        ? (event.target.value as PetColor)
                        : null,
                    )
                  }
                  disabled={
                    disabled ||
                    collarStatus !==
                      "YES"
                  }
                  className={inputClass}
                >
                  <option value="">
                    Belirtilmemiş
                  </option>

                  {(
                    Object.keys(
                      COLOR_LABELS,
                    ) as PetColor[]
                  ).map((color) => (
                    <option
                      key={color}
                      value={color}
                    >
                      {
                        COLOR_LABELS[
                          color
                        ]
                      }
                    </option>
                  ))}
                </select>
              </div>

              {/* Collar tag */}
              <div>
                <label
                  htmlFor="collar-tag"
                  className={labelClass}
                >
                  Tasma Etiketi
                </label>

                <input
                  id="collar-tag"
                  value={collarTagText}
                  onChange={(event) =>
                    setCollarTagText(
                      event.target.value,
                    )
                  }
                  maxLength={255}
                  disabled={
                    disabled ||
                    collarStatus !==
                      "YES"
                  }
                  placeholder="Etiket üzerindeki yazı"
                  className={inputClass}
                />
              </div>

              {/* Ear tag */}
              <div>
                <label
                  htmlFor="ear-tag"
                  className={labelClass}
                >
                  Kulak Küpesi
                </label>

                <select
                  id="ear-tag"
                  value={earTagStatus}
                  onChange={(event) =>
                    setEarTagStatus(
                      event.target.value as PresenceStatus,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="YES">
                    Var
                  </option>
                  <option value="NO">
                    Yok
                  </option>
                </select>
              </div>

              {/* Ear notch */}
              <div>
                <label
                  htmlFor="ear-notch"
                  className={labelClass}
                >
                  Kulak Çentiği
                </label>

                <select
                  id="ear-notch"
                  value={earNotchStatus}
                  onChange={(event) =>
                    setEarNotchStatus(
                      event.target.value as PresenceStatus,
                    )
                  }
                  disabled={disabled}
                  className={inputClass}
                >
                  <option value="UNKNOWN">
                    Belirtilmemiş
                  </option>
                  <option value="YES">
                    Var
                  </option>
                  <option value="NO">
                    Yok
                  </option>
                </select>
              </div>

              {/* Microchip */}
              <div>
                <label
                  htmlFor="microchip"
                  className={labelClass}
                >
                  Mikroçip Numarası
                </label>

                <input
                  id="microchip"
                  value={microchipNumber}
                  onChange={(event) =>
                    setMicrochipNumber(
                      event.target.value,
                    )
                  }
                  maxLength={32}
                  disabled={disabled}
                  placeholder="Varsa mikroçip numarası"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="distinctive-marks"
                className={labelClass}
              >
                Ayırt Edici Özellikler
              </label>

              <textarea
                id="distinctive-marks"
                value={distinctiveMarks}
                onChange={(event) =>
                  setDistinctiveMarks(
                    event.target.value,
                  )
                }
                maxLength={1000}
                rows={4}
                disabled={disabled}
                placeholder="Örn. sol kulağında çentik, boynunda beyaz leke..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* DATE SECTION (RENDERED FOR ALL AD TYPES: LOST, FOUND, ADOPTION)  */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <CalendarDays
                size={20}
                className="text-[#7c5cff]"
              />
              {adType === "LOST"
                ? "Kayıp Bilgileri"
                : adType === "FOUND"
                  ? "Bulunma Bilgileri"
                  : "İlan / Sahiplendirme Tarihi"}
            </h2>

            <div>
              <label
                htmlFor="lost-date"
                className={labelClass}
              >
                {adType === "LOST"
                  ? "Kayıp Tarihi"
                  : adType === "FOUND"
                    ? "Bulunma Tarihi"
                    : "İlan Tarihi"}
              </label>

              <input
                id="lost-date"
                type="date"
                value={lostDate || ""}
                max={today}
                onChange={(event) =>
                  setLostDate(
                    event.target.value,
                  )
                }
                disabled={disabled}
                required
                className={inputClass}
              />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* LOCATION                                                          */}
          {/* ---------------------------------------------------------------- */}

          <section className={cardClass}>
            <div className="mb-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin
                  size={20}
                  className="text-[#7c5cff]"
                />
                Konum
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                İlan için konum bilgisi zorunludur.
              </p>
            </div>

            <button
              type="button"
              onClick={getLocation}
              disabled={disabled}
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-[#7c5cff]/50 hover:text-[#7c5cff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MapPin size={18} />
              Konumumu Al
            </button>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="latitude"
                  className={labelClass}
                >
                  Enlem
                </label>

                <input
                  id="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(event) =>
                    setLatitude(
                      event.target.value,
                    )
                  }
                  required
                  disabled={disabled}
                  placeholder="40.195000"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className={labelClass}
                >
                  Boylam
                </label>

                <input
                  id="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(event) =>
                    setLongitude(
                      event.target.value,
                    )
                  }
                  required
                  disabled={disabled}
                  placeholder="29.060000"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* ERRORS                                                            */}
          {/* ---------------------------------------------------------------- */}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <Info
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* SUBMIT                                                            */}
          {/* ---------------------------------------------------------------- */}

          {/* Pasif düğmenin SEBEBİ yazılmalı: sebepsiz pasif düğme, kullanıcıyı
              formu baştan sona kontrol etmeye zorlar. */}
          {fotografEksik && (
            <p className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              <Camera size={17} />
              İlanı yayınlamak için en az {MIN_IMAGES} fotoğraf eklemelisiniz.
            </p>
          )}

          <button
            type="submit"
            disabled={gonderilemez}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7c5cff] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={21}
                  className="animate-spin"
                />
                İlan oluşturuluyor...
              </>
            ) : (
              <>
                <Send size={21} />
                İlanı Yayınla
                <ChevronRight
                  size={19}
                />
              </>
            )}
          </button>
        </form>

        <AiMatchModal
          isOpen={showMatchModal}
          matches={matches}
          onClose={() => setShowMatchModal(false)}
        />
    </CreateAdLayout>
  );
}
