import {
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  TeamBack,
  TeamButton,
  TeamShell,
} from "../components/TeamUI";
import { API_BASE_URL } from "../services/api";

const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || "http://localhost:8000";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

/*
 * This is exactly the JSON structure expected by
 * Spring Boot AdCreateRequest.
 *
 * AI-specific fields are intentionally NOT included here.
 */
interface AdCreateRequest {
  title: string;
  description: string;
  adType: AdType;
  species: Species;
  breed: string;
  colors: PetColor[];
  gender: PetGender;
  ageGroup: AgeGroup;
  coatPattern: CoatPattern;
  collarStatus: PresenceStatus;
  collarColor: PetColor | null;
  collarTagText: string;
  eyeColor: EyeColor;
  earTagStatus: PresenceStatus;
  earNotchStatus: PresenceStatus;
  microchipNumber: string;
  lostDate: string | null;
  distinctiveMarks: string;
  latitude: number;
  longitude: number;
}

/*
 * This matches the actual FastAPI /analyze response
 * from app/main.py.
 */
interface AIAnalysis {
  embedding: number[];
  labels: string[];
  species: string;
  species_confidence: number;
  is_pet: boolean;
  breed: string | null;
  breed_confidence: number;
  pattern: string | null;
  colors: string[];
  model_version: string;
}

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

const normalizeValue = (
  value: string | null | undefined
): string => {
  return (value || "")
    .trim()
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[\s-]+/g, "_");
};

function convertAISpecies(
  value: string
): Species | null {
  const normalized = normalizeValue(value);

  if (
    normalized === "CAT" ||
    normalized === "KEDI"
  ) {
    return "CAT";
  }

  if (
    normalized === "DOG" ||
    normalized === "KOPEK"
  ) {
    return "DOG";
  }

  return null;
}

function convertAIColor(
  value: string
): PetColor | null {
  const normalized = normalizeValue(value);

  const aliases: Record<string, PetColor> = {
    BLACK: "BLACK",
    SIYAH: "BLACK",

    WHITE: "WHITE",
    BEYAZ: "WHITE",

    GRAY: "GRAY",
    GREY: "GRAY",
    GRI: "GRAY",

    BROWN: "BROWN",
    KAHVERENGI: "BROWN",

    ORANGE: "ORANGE",
    TURUNCU: "ORANGE",

    CREAM: "CREAM",
    KREM: "CREAM",

    GOLDEN: "GOLDEN",
    ALTIN: "GOLDEN",

    BEIGE: "BEIGE",
    BEJ: "BEIGE",

    OTHER: "OTHER",
    DIGER: "OTHER",
  };

  return aliases[normalized] ?? null;
}

function convertAIPattern(
  value: string | null
): CoatPattern {
  const normalized = normalizeValue(value);

  const aliases: Record<string, CoatPattern> = {
    SOLID: "SOLID",

    STRIPED: "STRIPED",
    TABBY: "STRIPED",
    CIZGILI: "STRIPED",

    SPOTTED: "SPOTTED",
    SPOTLU: "SPOTTED",

    PATCHED: "PATCHED",

    CALICO: "CALICO",

    TORTOISESHELL: "TORTOISESHELL",
    TORTOISE_SHELL: "TORTOISESHELL",

    OTHER: "OTHER",
  };

  return aliases[normalized] ?? "UNKNOWN";
}

export default function AddListingPage() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [adType, setAdType] =
    useState<AdType>("ADOPTION");

  const [species, setSpecies] =
    useState<Species>("CAT");

  const [breed, setBreed] = useState("");

  const [colors, setColors] =
    useState<PetColor[]>([]);

  const [gender, setGender] =
    useState<PetGender>("UNKNOWN");

  const [ageGroup, setAgeGroup] =
    useState<AgeGroup>("UNKNOWN");

  const [coatPattern, setCoatPattern] =
    useState<CoatPattern>("UNKNOWN");

  const [collarStatus, setCollarStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [collarColor, setCollarColor] =
    useState<PetColor | null>(null);

  const [collarTagText, setCollarTagText] =
    useState("");

  const [eyeColor, setEyeColor] =
    useState<EyeColor>("UNKNOWN");

  const [earTagStatus, setEarTagStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [earNotchStatus, setEarNotchStatus] =
    useState<PresenceStatus>("UNKNOWN");

  const [microchipNumber, setMicrochipNumber] =
    useState("");

  const [lostDate, setLostDate] =
    useState("");

  const [distinctiveMarks, setDistinctiveMarks] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [aiAnalysis, setAiAnalysis] =
    useState<AIAnalysis | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [previews]);

  const resetMessages = () => {
    setError("");
    setSuccess(false);
  };

  const handlePhotoSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    resetMessages();

    const selected =
      Array.from(event.target.files ?? []);

    if (!selected.length) {
      return;
    }

    const invalidType = selected.find(
      (file) =>
        !file.type.startsWith("image/")
    );

    if (invalidType) {
      setError(
        "Sadece görüntü dosyaları yükleyebilirsiniz."
      );
      event.target.value = "";
      return;
    }

    const tooLarge = selected.find(
      (file) =>
        file.size > MAX_FILE_SIZE
    );

    if (tooLarge) {
      setError(
        `"${tooLarge.name}" 10 MB'dan büyük.`
      );
      event.target.value = "";
      return;
    }

    const remaining =
      MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      setError(
        `En fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`
      );
      event.target.value = "";
      return;
    }

    const filesToAdd =
      selected.slice(0, remaining);

    const newPhotos = [
      ...photos,
      ...filesToAdd,
    ];

    const newPreviews =
      newPhotos.map((file) =>
        URL.createObjectURL(file)
      );

    previews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotos(newPhotos);
    setPreviews(newPreviews);

    /*
     * Changing the first image means the previous
     * AI result may no longer describe the image.
     */
    setAiAnalysis(null);

    if (
      selected.length > remaining
    ) {
      setError(
        `En fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`
      );
    }

    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    resetMessages();

    const nextPhotos =
      photos.filter(
        (_, photoIndex) =>
          photoIndex !== index
      );

    const nextPreviews =
      nextPhotos.map((file) =>
        URL.createObjectURL(file)
      );

    previews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotos(nextPhotos);
    setPreviews(nextPreviews);

    /*
     * If the first image was removed, the AI result
     * is no longer guaranteed to describe the new
     * first image.
     */
    if (index === 0) {
      setAiAnalysis(null);
    }
  };
    const analyzePhotoWithAI = async () => {
    resetMessages();

    if (!photos.length) {
      setError(
        "Önce en az bir fotoğraf yükleyin."
      );
      return;
    }

    setAnalyzing(true);

    try {
      /*
       * FastAPI /analyze currently accepts exactly
       * one UploadFile named "file".
       *
       * Therefore we analyze the first selected
       * image. All selected images will still be
       * sent to Spring Boot when the listing is
       * published.
       */
      const formData = new FormData();

      formData.append(
        "file",
        photos[0]
      );

      const response = await fetch(
        `${AI_BASE_URL}/analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Fotoğraf AI tarafından analiz edilemedi."
        );
      }

      const result =
        data as AIAnalysis;

      setAiAnalysis(result);

      /*
       * The backend AdCreateRequest only accepts
       * CAT or DOG. UNKNOWN must never be submitted.
       */
      const detectedSpecies =
        convertAISpecies(
          result.species
        );

      if (!result.is_pet) {
        setError(
          "AI bu fotoğrafta kedi veya köpek tespit edemedi. Lütfen hayvanın net göründüğü bir fotoğraf yükleyin."
        );
      }

      if (detectedSpecies) {
        setSpecies(
          detectedSpecies
        );
      }

      /*
       * AI breed is only a suggestion.
       * The user can change it afterwards.
       */
      if (result.breed) {
        setBreed(
          result.breed
        );
      }

      /*
       * AI colors → backend PetColor enum.
       * Unknown AI color values are simply ignored
       * instead of sending invalid enum values.
       */
      const detectedColors =
        Array.from(
          new Set(
            (result.colors || [])
              .map(convertAIColor)
              .filter(
                (
                  color
                ): color is PetColor =>
                  color !== null
              )
          )
        );

      setColors(
        detectedColors
      );

      /*
       * AI pattern → CoatPattern enum.
       */
      setCoatPattern(
        convertAIPattern(
          result.pattern
        )
      );

      /*
       * If the user hasn't entered a title yet,
       * create a useful initial title.
       */
      if (!title.trim()) {
        if (result.breed) {
          setTitle(
            `${result.breed} İlanı`
          );
        } else if (
          detectedSpecies === "CAT"
        ) {
          setTitle(
            "Kedi İlanı"
          );
        } else if (
          detectedSpecies === "DOG"
        ) {
          setTitle(
            "Köpek İlanı"
          );
        }
      }
    } catch (analysisError) {
      console.error(
        "AI analysis failed:",
        analysisError
      );

      setAiAnalysis(null);

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "AI analizi sırasında bir hata oluştu."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const getLocation = () => {
    resetMessages();

    if (!navigator.geolocation) {
      setError(
        "Tarayıcınız konum bilgisini desteklemiyor."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude.toFixed(
            6
          )
        );

        setLongitude(
          position.coords.longitude.toFixed(
            6
          )
        );
      },
      (locationError) => {
        console.error(
          "Geolocation error:",
          locationError
        );

        setError(
          "Konum alınamadı. Tarayıcıdan konum izni vermeniz gerekiyor."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const toggleColor = (
    color: PetColor
  ) => {
    setColors(
      (currentColors) => {
        if (
          currentColors.includes(
            color
          )
        ) {
          return currentColors.filter(
            (item) =>
              item !== color
          );
        }

        return [
          ...currentColors,
          color,
        ];
      }
    );
  };

  const validateCoordinates =
    () => {
      const lat =
        Number(latitude);

      const lng =
        Number(longitude);

      if (
        !latitude.trim() ||
        !longitude.trim()
      ) {
        setError(
          "Konum bilgisi zorunludur."
        );
        return null;
      }

      if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
      ) {
        setError(
          "Geçerli bir enlem değeri giriniz."
        );
        return null;
      }

      if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        setError(
          "Geçerli bir boylam değeri giriniz."
        );
        return null;
      }

      return {
        latitude: lat,
        longitude: lng,
      };
    };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    resetMessages();

    if (!photos.length) {
      setError(
        "İlan için en az bir fotoğraf gereklidir."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Başlık alanı zorunludur."
      );
      return;
    }

    /*
     * Spring Boot validates species as CAT/DOG.
     */
    if (
      species !== "CAT" &&
      species !== "DOG"
    ) {
      setError(
        "Lütfen kedi veya köpek seçiniz."
      );
      return;
    }

    if (
      adType === "LOST" &&
      !lostDate
    ) {
      setError(
        "Kayıp ilanı için kayıp tarihi gereklidir."
      );
      return;
    }

    const coordinates =
      validateCoordinates();

    if (!coordinates) {
      return;
    }

    setSubmitting(true);

    try {
      const ad: AdCreateRequest = {
        title:
          title.trim(),

        description:
          description.trim(),

        adType,

        species,

        breed:
          breed.trim(),

        colors,

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

        lostDate:
          adType === "LOST"
            ? lostDate
            : null,

        distinctiveMarks:
          distinctiveMarks.trim(),

        latitude:
          coordinates.latitude,

        longitude:
          coordinates.longitude,
      };

      /*
       * IMPORTANT:
       *
       * Spring Boot expects:
       *
       * @RequestPart("ad")
       * @RequestPart("images")
       *
       * Therefore "ad" must be a JSON Blob and
       * every image must use the "images" field.
       */
      const formData =
        new FormData();

      formData.append(
        "ad",
        new Blob(
          [
            JSON.stringify(
              ad
            ),
          ],
          {
            type:
              "application/json",
          }
        )
      );

      photos.forEach(
        (photo) => {
          formData.append(
            "images",
            photo
          );
        }
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/ads`,
          {
            method: "POST",
            body: formData,
            credentials:
              "include",
          }
        );

      const responseData =
        await response
          .json()
          .catch(
            () => null
          );

      if (!response.ok) {
        const backendMessage =
          responseData?.message ||
          responseData?.error ||
          responseData?.detail;

        throw new Error(
          backendMessage ||
            "İlan oluşturulamadı."
        );
      }

      /*
       * Backend returns 201 Created with AdResponse.
       */
      console.log(
        "Created listing:",
        responseData
      );

      setSuccess(true);

      /*
       * Reset the form after successful creation.
       */
      previews.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      setPhotos([]);
      setPreviews([]);

      setTitle("");
      setDescription("");

      setAdType(
        "ADOPTION"
      );

      setSpecies("CAT");
      setBreed("");
      setColors([]);

      setGender(
        "UNKNOWN"
      );

      setAgeGroup(
        "UNKNOWN"
      );

      setCoatPattern(
        "UNKNOWN"
      );

      setCollarStatus(
        "UNKNOWN"
      );

      setCollarColor(null);
      setCollarTagText("");

      setEyeColor(
        "UNKNOWN"
      );

      setEarTagStatus(
        "UNKNOWN"
      );

      setEarNotchStatus(
        "UNKNOWN"
      );

      setMicrochipNumber("");
      setLostDate("");
      setDistinctiveMarks("");

      setLatitude("");
      setLongitude("");

      setAiAnalysis(null);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    } catch (submissionError) {
      console.error(
        "Listing creation failed:",
        submissionError
      );

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "İlan gönderilirken bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canAnalyze =
    photos.length > 0 &&
    !analyzing &&
    !submitting;

  const canSubmit =
    photos.length > 0 &&
    !submitting &&
    !analyzing;

  return (
    <TeamShell
      className="screen"
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <TeamBack href="/" />

        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Yeni İlan Ekle
          </h1>

          <p
            style={{
              margin:
                "4px 0 0",
              opacity: 0.7,
            }}
          >
            Fotoğraf yükleyin,
            AI bilgileri
            otomatik doldursun.
          </p>
        </div>
      </header>

      <form
        onSubmit={
          handleSubmit
        }
      >
        <section className="form-card">
          <h2>
            <Camera size={18} />
            {" "}
            Fotoğraflar
          </h2>

          <label
            className="upload"
            htmlFor="listing-photos"
          >
            <input
              ref={
                fileInputRef
              }
              id="listing-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={
                handlePhotoSelection
              }
              disabled={
                photos.length >=
                  MAX_PHOTOS ||
                analyzing ||
                submitting
              }
            />

            <Camera
              size={48}
            />

            <strong>
              Fotoğraf Ekle
            </strong>

            <span>
              {photos.length ===
              0
                ? "1-5 fotoğraf seçebilirsiniz"
                : `${photos.length}/${MAX_PHOTOS} fotoğraf seçildi`}
            </span>
          </label>

          {previews.length >
            0 && (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "10px",
                marginTop:
                  "16px",
              }}
            >
              {previews.map(
                (
                  preview,
                  index
                ) => (
                  <div
                    key={
                      preview
                    }
                    style={{
                      position:
                        "relative",
                    }}
                  >
                    <img
                      src={
                        preview
                      }
                      alt={`İlan fotoğrafı ${
                        index +
                        1
                      }`}
                      style={{
                        display:
                          "block",
                        width:
                          "100%",
                        aspectRatio:
                          "1",
                        objectFit:
                          "cover",
                        borderRadius:
                          "12px",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(
                          index
                        )
                      }
                      disabled={
                        analyzing ||
                        submitting
                      }
                      aria-label="Fotoğrafı kaldır"
                      style={{
                        position:
                          "absolute",
                        top:
                          "6px",
                        right:
                          "6px",
                        width:
                          "30px",
                        height:
                          "30px",
                        padding: 0,
                        border:
                          "none",
                        borderRadius:
                          "50%",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        cursor:
                          "pointer",
                      }}
                    >
                      <X
                        size={
                          16
                        }
                      />
                    </button>

                    {index ===
                      0 && (
                      <span
                        style={{
                          position:
                            "absolute",
                          left:
                            "6px",
                          bottom:
                            "6px",
                          padding:
                            "4px 7px",
                          borderRadius:
                            "6px",
                          background:
                            "rgba(0,0,0,.65)",
                          color:
                            "white",
                          fontSize:
                            "11px",
                        }}
                      >
                        AI fotoğrafı
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {photos.length >
            0 && (
            <div
              style={{
                marginTop:
                  "16px",
              }}
            >
              <TeamButton
                type="button"
                variant="outline"
                full
                disabled={
                  !canAnalyze
                }
                onClick={
                  analyzePhotoWithAI
                }
              >
                {analyzing ? (
                  <>
                    <Loader2
                      size={
                        18
                      }
                      className="spin"
                    />
                    {" "}
                    AI analiz ediyor...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={
                        18
                      }
                    />
                    {" "}
                    Fotoğrafı AI ile Analiz Et
                  </>
                )}
              </TeamButton>
            </div>
          )}

          <p
            style={{
              marginTop:
                "10px",
              fontSize:
                "13px",
              opacity:
                0.65,
            }}
          >
            AI şu anda ilk
            seçtiğiniz fotoğrafı
            analiz eder. Tüm
            fotoğraflar ilan
            oluşturulurken
            sunucuya gönderilir.
          </p>
        </section>

        {aiAnalysis && (
          <section className="form-card">
            <h2>
              <Sparkles
                size={18}
              />
              {" "}
              AI Analizi
            </h2>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "8px",
                marginBottom:
                  "12px",
              }}
            >
              <CheckCircle2
                size={20}
              />

              <strong>
                Fotoğraf analiz
                edildi
              </strong>
            </div>

            <div
              style={{
                display:
                  "grid",
                gap: "8px",
              }}
            >
              <p>
                <strong>
                  Tür:
                </strong>{" "}
                {convertAISpecies(
                  aiAnalysis.species
                ) ===
                "CAT"
                  ? "Kedi"
                  : convertAISpecies(
                      aiAnalysis.species
                    ) ===
                    "DOG"
                  ? "Köpek"
                  : aiAnalysis.species}
              </p>

              {aiAnalysis.breed && (
                <p>
                  <strong>
                    Cins:
                  </strong>{" "}
                  {
                    aiAnalysis.breed
                  }
                </p>
              )}

              {aiAnalysis.colors
                .length >
                0 && (
                <p>
                  <strong>
                    Renk:
                  </strong>{" "}
                  {aiAnalysis.colors.join(
                    ", "
                  )}
                </p>
              )}

              {aiAnalysis.pattern && (
                <p>
                  <strong>
                    Desen:
                  </strong>{" "}
                  {
                    aiAnalysis.pattern
                  }
                </p>
              )}

              <p>
                <strong>
                  Tür güveni:
                </strong>{" "}
                {(
                  aiAnalysis.species_confidence *
                  100
                ).toFixed(
                  1
                )}
                %
              </p>

              {aiAnalysis.breed && (
                <p>
                  <strong>
                    Cins güveni:
                  </strong>{" "}
                  {(
                    aiAnalysis.breed_confidence *
                    100
                  ).toFixed(
                    1
                  )}
                  %
                </p>
              )}
            </div>

            {!aiAnalysis.is_pet && (
              <p className="form-error">
                AI bu fotoğrafta
                kedi veya köpek
                tespit edemedi.
              </p>
            )}

            <p
              style={{
                marginBottom: 0,
                fontSize:
                  "12px",
                opacity:
                  0.6,
              }}
            >
              AI tarafından
              doldurulan alanları
              aşağıdaki formdan
              değiştirebilirsiniz.
            </p>
          </section>
        )}

        <section className="form-card">
          <h2>
            <PawPrint
              size={18}
            />
            {" "}
            İlan Bilgileri
          </h2>
                    <label className="block-label">
            Başlık
            <div className="input">
              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                maxLength={150}
                required
                placeholder="İlan başlığı"
              />
            </div>
          </label>

          <label className="block-label">
            Açıklama
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              maxLength={3000}
              placeholder="Hayvan hakkında bilgi veriniz..."
              rows={5}
            />
          </label>
        </section>

        <section className="form-card">
          <h2>
            <ShieldCheck size={18} /> İlan Türü
          </h2>

          <div className="segments">
            <button
              type="button"
              className={
                adType === "ADOPTION" ? "active" : ""
              }
              onClick={() => setAdType("ADOPTION")}
            >
              <PawPrint size={16} />
              Sahiplendirme
            </button>

            <button
              type="button"
              className={
                adType === "LOST" ? "active" : ""
              }
              onClick={() => setAdType("LOST")}
            >
              Kayıp
            </button>

            <button
              type="button"
              className={
                adType === "FOUND" ? "active" : ""
              }
              onClick={() => setAdType("FOUND")}
            >
              Bulundu
            </button>
          </div>
        </section>

        <section className="form-card">
          <h2>
            <PawPrint size={18} /> Hayvan Bilgileri
          </h2>

          <label className="form-row">
            <span>Tür</span>

            <select
              value={species}
              onChange={(event) =>
                setSpecies(
                  event.target.value as Species
                )
              }
            >
              <option value="CAT">Kedi</option>
              <option value="DOG">Köpek</option>
            </select>
          </label>

          <label className="form-row">
            <span>Cins</span>

            <input
              value={breed}
              onChange={(event) =>
                setBreed(event.target.value)
              }
              maxLength={100}
              placeholder="Örn. Tekir, Golden..."
            />
          </label>

          <label className="form-row">
            <span>Cinsiyet</span>

            <select
              value={gender}
              onChange={(event) =>
                setGender(
                  event.target.value as PetGender
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="FEMALE">Dişi</option>
              <option value="MALE">Erkek</option>
            </select>
          </label>

          <label className="form-row">
            <span>Yaş Grubu</span>

            <select
              value={ageGroup}
              onChange={(event) =>
                setAgeGroup(
                  event.target.value as AgeGroup
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="BABY">Yavru</option>
              <option value="YOUNG">Genç</option>
              <option value="ADULT">Yetişkin</option>
              <option value="SENIOR">Yaşlı</option>
            </select>
          </label>

          <label className="form-row">
            <span>Tüy Deseni</span>

            <select
              value={coatPattern}
              onChange={(event) =>
                setCoatPattern(
                  event.target.value as CoatPattern
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="SOLID">Düz</option>
              <option value="STRIPED">Çizgili</option>
              <option value="SPOTTED">Benekli</option>
              <option value="PATCHED">Parçalı</option>
              <option value="CALICO">Calico</option>
              <option value="TORTOISESHELL">
                Kaplumbağa kabuğu
              </option>
              <option value="OTHER">Diğer</option>
            </select>
          </label>

          <div className="block-label">
            <span>Renkler</span>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {(
                Object.keys(
                  COLOR_LABELS
                ) as PetColor[]
              ).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    toggleColor(color)
                  }
                  className={
                    colors.includes(color)
                      ? "active"
                      : ""
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid currentColor",
                    cursor: "pointer",
                  }}
                >
                  {COLOR_LABELS[color]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="form-card">
          <h2>Ek Bilgiler</h2>

          <label className="form-row">
            <span>Tasma</span>

            <select
              value={collarStatus}
              onChange={(event) =>
                setCollarStatus(
                  event.target.value as PresenceStatus
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="YES">Var</option>
              <option value="NO">Yok</option>
            </select>
          </label>

          {collarStatus === "YES" && (
            <>
              <label className="form-row">
                <span>Tasma Rengi</span>

                <select
                  value={collarColor ?? ""}
                  onChange={(event) =>
                    setCollarColor(
                      event.target.value
                        ? (event.target.value as PetColor)
                        : null
                    )
                  }
                >
                  <option value="">
                    Belirtilmemiş
                  </option>

                  {(
                    Object.keys(
                      COLOR_LABELS
                    ) as PetColor[]
                  ).map((color) => (
                    <option
                      key={color}
                      value={color}
                    >
                      {COLOR_LABELS[color]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-row">
                <span>Tasma Etiketi</span>

                <input
                  value={collarTagText}
                  onChange={(event) =>
                    setCollarTagText(
                      event.target.value
                    )
                  }
                  maxLength={255}
                  placeholder="Etiket üzerindeki yazı"
                />
              </label>
            </>
          )}

          <label className="form-row">
            <span>Göz Rengi</span>

            <select
              value={eyeColor}
              onChange={(event) =>
                setEyeColor(
                  event.target.value as EyeColor
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="BROWN">Kahverengi</option>
              <option value="BLUE">Mavi</option>
              <option value="GREEN">Yeşil</option>
              <option value="AMBER">Kehribar</option>
              <option value="HAZEL">Ela</option>
              <option value="HETEROCHROMIA">
                Heterokromi
              </option>
              <option value="OTHER">Diğer</option>
            </select>
          </label>

          <label className="form-row">
            <span>Kulak Küpesi</span>

            <select
              value={earTagStatus}
              onChange={(event) =>
                setEarTagStatus(
                  event.target.value as PresenceStatus
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="YES">Var</option>
              <option value="NO">Yok</option>
            </select>
          </label>

          <label className="form-row">
            <span>Kulak Çentiği</span>

            <select
              value={earNotchStatus}
              onChange={(event) =>
                setEarNotchStatus(
                  event.target.value as PresenceStatus
                )
              }
            >
              <option value="UNKNOWN">
                Belirtilmemiş
              </option>
              <option value="YES">Var</option>
              <option value="NO">Yok</option>
            </select>
          </label>

          <label className="form-row">
            <span>Mikroçip Numarası</span>

            <input
              value={microchipNumber}
              onChange={(event) =>
                setMicrochipNumber(
                  event.target.value
                )
              }
              maxLength={32}
              placeholder="Varsa mikroçip numarası"
            />
          </label>

          <label className="block-label">
            Ayırt Edici Özellikler

            <textarea
              value={distinctiveMarks}
              onChange={(event) =>
                setDistinctiveMarks(
                  event.target.value
                )
              }
              maxLength={1000}
              rows={4}
              placeholder="Örn. sol kulağında çentik, boynunda beyaz leke..."
            />
          </label>
        </section>

        {adType === "LOST" && (
          <section className="form-card">
            <h2>Kayıp Bilgileri</h2>

            <label className="form-row">
              <span>Kayıp Tarihi</span>

              <input
                type="date"
                value={lostDate}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(event) =>
                  setLostDate(
                    event.target.value
                  )
                }
              />
            </label>
          </section>
        )}

        <section className="form-card">
          <h2>
            <MapPin size={18} /> Konum
          </h2>

          <p
            style={{
              marginTop: 0,
              opacity: 0.7,
              fontSize: "13px",
            }}
          >
            İlanın konumunu haritadan almak için
            aşağıdaki butona basabilirsiniz.
          </p>

          <TeamButton
            type="button"
            variant="outline"
            onClick={getLocation}
            disabled={
              submitting ||
              analyzing
            }
          >
            <MapPin size={18} />
            Konumumu Al
          </TeamButton>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            <label className="form-row">
              <span>Enlem</span>

              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(event) =>
                  setLatitude(
                    event.target.value
                  )
                }
                placeholder="40.195000"
                required
              />
            </label>

            <label className="form-row">
              <span>Boylam</span>

              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(event) =>
                  setLongitude(
                    event.target.value
                  )
                }
                placeholder="29.060000"
                required
              />
            </label>
          </div>
        </section>

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="success-message"
            role="status"
          >
            İlan başarıyla oluşturuldu.
          </p>
        )}

        <TeamButton
          type="submit"
          full
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2
                size={20}
                className="spin"
              />
              İlan oluşturuluyor...
            </>
          ) : (
            <>
              <Send size={20} />
              İlanı Yayınla
            </>
          )}
        </TeamButton>
      </form>
    </TeamShell>
  );
}
