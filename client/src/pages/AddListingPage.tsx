import {
  Camera,
  MapPin,
  PawPrint,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  TeamBack,
  TeamButton,
  TeamShell,
} from "../components/TeamUI";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL ?? "http://localhost:8000";

const MAX_PHOTOS = 5;

type Species = "CAT" | "DOG";

type AdType = "LOST" | "FOUND" | "ADOPTION";

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

type AgeGroup =
  | "UNKNOWN"
  | "BABY"
  | "YOUNG"
  | "ADULT"
  | "SENIOR";

type PetGender =
  | "UNKNOWN"
  | "FEMALE"
  | "MALE";

type CoatPattern =
  | "UNKNOWN"
  | "SOLID"
  | "STRIPED"
  | "SPOTTED"
  | "PATCHED"
  | "CALICO"
  | "TORTOISESHELL"
  | "OTHER";

type PresenceStatus =
  | "UNKNOWN"
  | "YES"
  | "NO";

type EyeColor =
  | "UNKNOWN"
  | "BROWN"
  | "BLUE"
  | "GREEN"
  | "AMBER"
  | "HAZEL"
  | "HETEROCHROMIA"
  | "OTHER";

interface AIAnalysisResponse {
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

const colorLabels: Record<PetColor, string> = {
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

const normalizeAIValue = (value: string | null | undefined) =>
  (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const mapSpecies = (
  value: string | null | undefined
): Species | null => {
  const normalized = normalizeAIValue(value);

  if (
    normalized === "CAT" ||
    normalized === "KEDI" ||
    normalized === "KEDİ"
  ) {
    return "CAT";
  }

  if (
    normalized === "DOG" ||
    normalized === "KOPEK" ||
    normalized === "KÖPEK"
  ) {
    return "DOG";
  }

  return null;
};

const mapColor = (
  value: string
): PetColor | null => {
  const normalized = normalizeAIValue(value);

  const aliases: Record<string, PetColor> = {
    BLACK: "BLACK",
    SIYAH: "BLACK",
    SİYAH: "BLACK",

    WHITE: "WHITE",
    BEYAZ: "WHITE",

    GRAY: "GRAY",
    GREY: "GRAY",
    GRI: "GRAY",
    GRİ: "GRAY",

    BROWN: "BROWN",
    KAHVERENGI: "BROWN",
    KAHVERENGİ: "BROWN",

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
    DİĞER: "OTHER",
  };

  return aliases[normalized] ?? null;
};

const mapPattern = (
  value: string | null | undefined
): CoatPattern => {
  const normalized = normalizeAIValue(value);

  const aliases: Record<string, CoatPattern> = {
    SOLID: "SOLID",
    DÜZ: "SOLID",

    STRIPED: "STRIPED",
    TABBY: "STRIPED",
    CIZGILI: "STRIPED",
    ÇİZGİLİ: "STRIPED",

    SPOTTED: "SPOTTED",
    SPOTLU: "SPOTTED",
    SPOTTED_PATTERN: "SPOTTED",

    PATCHED: "PATCHED",
    PATCHY: "PATCHED",

    CALICO: "CALICO",

    TORTOISESHELL: "TORTOISESHELL",
    TORTOISE_SHELL: "TORTOISESHELL",

    OTHER: "OTHER",
  };

  return aliases[normalized] ?? "UNKNOWN";
};

export default function AddListingPage() {
  const [adType, setAdType] =
    useState<AdType>("ADOPTION");

  const [photos, setPhotos] =
    useState<File[]>([]);

  const [photoPreviews, setPhotoPreviews] =
    useState<string[]>([]);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [species, setSpecies] =
    useState<Species>("CAT");

  const [breed, setBreed] =
    useState("");

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

  const [analyzing, setAnalyzing] =
    useState(false);

  const [aiResult, setAiResult] =
    useState<AIAnalysisResponse | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [photoPreviews]);

  const handlePhotosChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    if (!selectedFiles.length) {
      return;
    }

    const availableSlots =
      MAX_PHOTOS - photos.length;

    const filesToAdd =
      selectedFiles.slice(0, availableSlots);

    if (!filesToAdd.length) {
      setError(
        `En fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`
      );
      return;
    }

    const newPhotos = [
      ...photos,
      ...filesToAdd,
    ];

    const newPreviews = newPhotos.map((file) =>
      URL.createObjectURL(file)
    );

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);

    setError("");
    setSuccess(false);

    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    const nextPhotos = photos.filter(
      (_, photoIndex) => photoIndex !== index
    );

    const nextPreviews = nextPhotos.map((file) =>
      URL.createObjectURL(file)
    );

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotos(nextPhotos);
    setPhotoPreviews(nextPreviews);

    if (index === 0) {
      setAiResult(null);
    }
  };

  const analyzeFirstPhoto = async () => {
    if (!photos.length) {
      setError("Önce en az bir fotoğraf seçiniz.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess(false);

    try {
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

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Fotoğraf AI tarafından analiz edilemedi."
        );
      }

      const result =
        (await response.json()) as AIAnalysisResponse;

      setAiResult(result);

      const detectedSpecies =
        mapSpecies(result.species);

      if (detectedSpecies) {
        setSpecies(detectedSpecies);
      } else if (!result.is_pet) {
        throw new Error(
          "Fotoğrafta kedi veya köpek tespit edilemedi. Lütfen uygun bir hayvan fotoğrafı seçiniz."
        );
      }

      if (result.breed) {
        setBreed(result.breed);
      }

      const detectedColors = (
        result.colors ?? []
      )
        .map(mapColor)
        .filter(
          (color): color is PetColor =>
            color !== null
        );

      setColors(
        Array.from(
          new Set(detectedColors)
        )
      );

      setCoatPattern(
        mapPattern(result.pattern)
      );

      if (!title.trim()) {
        const detectedName =
          result.breed
            ? `${result.breed} İlanı`
            : detectedSpecies === "CAT"
            ? "Kedi İlanı"
            : detectedSpecies === "DOG"
            ? "Köpek İlanı"
            : "";

        if (detectedName) {
          setTitle(detectedName);
        }
      }

    } catch (analysisError) {
      console.error(
        "AI analysis error:",
        analysisError
      );

      setAiResult(null);

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Fotoğraf analiz edilemedi."
      );
    } finally {
      setAnalyzing(false);
    }
  };
    const getCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Tarayıcınız konum bilgisini desteklemiyor."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude.toFixed(6)
        );

        setLongitude(
          position.coords.longitude.toFixed(6)
        );

        setError("");
      },
      (locationError) => {
        console.error(
          "Location error:",
          locationError
        );

        setError(
          "Konum alınamadı. Lütfen konum iznini verin veya koordinatları manuel girin."
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
    setColors((currentColors) => {
      if (currentColors.includes(color)) {
        return currentColors.filter(
          (item) => item !== color
        );
      }

      return [
        ...currentColors,
        color,
      ];
    });
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!title.trim()) {
      setError("Başlık alanı zorunludur.");
      return;
    }

    if (!photos.length) {
      setError(
        "Lütfen en az bir fotoğraf yükleyin."
      );
      return;
    }

    if (!latitude.trim() ||
        !longitude.trim()) {
      setError(
        "Konum bilgisi zorunludur. 'Konumumu Kullan' butonunu kullanabilir veya koordinatları girebilirsiniz."
      );
      return;
    }

    const latitudeNumber =
      Number(latitude);

    const longitudeNumber =
      Number(longitude);

    if (
      !Number.isFinite(latitudeNumber) ||
      latitudeNumber < -90 ||
      latitudeNumber > 90
    ) {
      setError(
        "Geçerli bir enlem değeri giriniz."
      );
      return;
    }

    if (
      !Number.isFinite(longitudeNumber) ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      setError(
        "Geçerli bir boylam değeri giriniz."
      );
      return;
    }

    if (
      adType === "LOST" &&
      !lostDate
    ) {
      setError(
        "Kayıp ilanları için kayıp tarihi gereklidir."
      );
      return;
    }

    setSubmitting(true);

    try {
      const ad: AdCreateRequest = {
        title: title.trim(),

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
            .replace(/\s/g, "")
            .trim(),

        lostDate:
          adType === "LOST"
            ? lostDate
            : null,

        distinctiveMarks:
          distinctiveMarks.trim(),

        latitude:
          latitudeNumber,

        longitude:
          longitudeNumber,
      };

      const formData =
        new FormData();

      formData.append(
        "ad",
        new Blob(
          [JSON.stringify(ad)],
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
          new URL(
            "/api/ads",
            API_BASE_URL
          ).toString(),
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "İlan oluşturulamadı."
        );
      }

      await response.json();

      setSuccess(true);

      setPhotos([]);

      photoPreviews.forEach(
        (url) =>
          URL.revokeObjectURL(url)
      );

      setPhotoPreviews([]);

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

      setAiResult(null);

    } catch (submissionError) {
      console.error(
        "Listing submission error:",
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

  return (
    <TeamShell
      className="screen"
    >
      <header className="center-header">
        <TeamBack href="/" />

        <h1>
          Yeni İlan Ekle
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
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
              id="listing-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={
                handlePhotosChange
              }
              disabled={
                photos.length >=
                MAX_PHOTOS ||
                analyzing ||
                submitting
              }
            />

            <Camera size={50} />

            <strong>
              Fotoğraf Ekle
            </strong>

            <span>
              {photos.length > 0
                ? `${photos.length}/${MAX_PHOTOS} fotoğraf seçildi`
                : "1-5 fotoğraf seçebilirsiniz"}
            </span>
          </label>

          {photoPreviews.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {photoPreviews.map(
                (
                  preview,
                  index
                ) => (
                  <div
                    key={`${preview}-${index}`}
                    style={{
                      position:
                        "relative",
                    }}
                  >
                    <img
                      src={preview}
                      alt={`Fotoğraf ${
                        index + 1
                      }`}
                      style={{
                        width: "100%",
                        aspectRatio:
                          "1 / 1",
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
                      aria-label={`Fotoğraf ${
                        index + 1
                      } sil`}
                      style={{
                        position:
                          "absolute",
                        top: "6px",
                        right: "6px",
                        width: "30px",
                        height: "30px",
                        borderRadius:
                          "50%",
                        border: "none",
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
                        size={16}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {photos.length > 0 && (
            <TeamButton
              type="button"
              variant="outline"
              full
              disabled={
                analyzing ||
                submitting
              }
              onClick={
                analyzeFirstPhoto
              }
            >
              <PawPrint
                size={18}
              />

              {analyzing
                ? "AI Fotoğrafı Analiz Ediyor..."
                : "Fotoğrafı AI ile Analiz Et"}
            </TeamButton>
          )}
        </section>

        {aiResult && (
          <section className="form-card">
            <h2>
              🤖 AI Analizi
            </h2>

            <p>
              <strong>
                Hayvan:
              </strong>{" "}
              {aiResult.species ===
              "cat"
                ? "Kedi"
                : aiResult.species ===
                  "dog"
                ? "Köpek"
                : aiResult.species}
            </p>

            {aiResult.breed && (
              <p>
                <strong>
                  Cins:
                </strong>{" "}
                {aiResult.breed}
              </p>
            )}

            {aiResult.colors.length >
              0 && (
              <p>
                <strong>
                  Renk:
                </strong>{" "}
                {colors.length > 0
                  ? colors
                      .map(
                        (color) =>
                          colorLabels[
                            color
                          ]
                      )
                      .join(", ")
                  : aiResult.colors.join(
                      ", "
                    )}
              </p>
            )}

            {aiResult.pattern && (
              <p>
                <strong>
                  Desen:
                </strong>{" "}
                {aiResult.pattern}
              </p>
            )}

            <p>
              <strong>
                Güven:
              </strong>{" "}
              {(
                aiResult.species_confidence *
                100
              ).toFixed(1)}
              %
            </p>

            {!aiResult.is_pet && (
              <p className="form-error">
                AI bu fotoğrafta
                kedi veya köpek
                tespit edemedi.
              </p>
            )}
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

          <label
            className="block-label"
          >
            Başlık

            <div className="input">
              <input
                required
                maxLength={150}
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="Örn. Tekir kedi sahiplendirilecek"
              />
            </div>
          </label>

          <label
            className="block-label"
          >
            İlan Türü

            <select
              value={adType}
              onChange={(e) =>
                setAdType(
                  e.target
                    .value as AdType
                )
              }
            >
              <option value="ADOPTION">
                Sahiplendirme
              </option>

              <option value="LOST">
                Kayıp
              </option>

              <option value="FOUND">
                Bulunan
              </option>
            </select>
          </label>

          <label
            className="block-label"
          >
            Açıklama

            <textarea
              maxLength={3000}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="İlan hakkında açıklama giriniz..."
            />
          </label>
        </section>
                <section className="form-card">
          <h2>
            <PawPrint size={18} />
            {" "}
            Hayvan Bilgileri
          </h2>

          <label className="form-row">
            <span>Tür</span>

            <select
              value={species}
              onChange={(e) =>
                setSpecies(
                  e.target.value as Species
                )
              }
            >
              <option value="CAT">
                Kedi
              </option>

              <option value="DOG">
                Köpek
              </option>
            </select>
          </label>

          <label className="form-row">
            <span>Cins</span>

            <input
              value={breed}
              onChange={(e) =>
                setBreed(e.target.value)
              }
              maxLength={100}
              placeholder="Cins"
            />
          </label>

          <label className="form-row">
            <span>Yaş Grubu</span>

            <select
              value={ageGroup}
              onChange={(e) =>
                setAgeGroup(
                  e.target.value as AgeGroup
                )
              }
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
          </label>

          <label className="form-row">
            <span>Cinsiyet</span>

            <select
              value={gender}
              onChange={(e) =>
                setGender(
                  e.target.value as PetGender
                )
              }
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
          </label>

          <label className="form-row">
            <span>Desen</span>

            <select
              value={coatPattern}
              onChange={(e) =>
                setCoatPattern(
                  e.target.value as CoatPattern
                )
              }
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
                Tortoiseshell
              </option>

              <option value="OTHER">
                Diğer
              </option>
            </select>
          </label>

          <div className="block-label">
            Renkler

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
                  colorLabels
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
                    padding:
                      "8px 12px",
                    borderRadius:
                      "999px",
                    border:
                      "1px solid currentColor",
                    cursor:
                      "pointer",
                  }}
                >
                  {colorLabels[color]}
                </button>
              ))}
            </div>
          </div>

          <label className="form-row">
            <span>Göz Rengi</span>

            <select
              value={eyeColor}
              onChange={(e) =>
                setEyeColor(
                  e.target.value as EyeColor
                )
              }
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
          </label>
        </section>

        <section className="form-card">
          <h2>
            <ShieldCheck size={18} />
            {" "}
            Ek Bilgiler
          </h2>

          <label className="form-row">
            <span>Tasma</span>

            <select
              value={collarStatus}
              onChange={(e) =>
                setCollarStatus(
                  e.target
                    .value as PresenceStatus
                )
              }
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
          </label>

          {collarStatus === "YES" && (
            <>
              <label className="form-row">
                <span>Tasma Rengi</span>

                <select
                  value={
                    collarColor ?? ""
                  }
                  onChange={(e) =>
                    setCollarColor(
                      e.target.value
                        ? e.target
                            .value as PetColor
                        : null
                    )
                  }
                >
                  <option value="">
                    Belirtilmemiş
                  </option>

                  {(
                    Object.keys(
                      colorLabels
                    ) as PetColor[]
                  ).map((color) => (
                    <option
                      key={color}
                      value={color}
                    >
                      {colorLabels[color]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block-label">
                Tasma Etiketi

                <input
                  value={collarTagText}
                  onChange={(e) =>
                    setCollarTagText(
                      e.target.value
                    )
                  }
                  maxLength={255}
                  placeholder="Etiket üzerindeki yazı"
                />
              </label>
            </>
          )}

          <label className="form-row">
            <span>Kulak Küpesi</span>

            <select
              value={earTagStatus}
              onChange={(e) =>
                setEarTagStatus(
                  e.target
                    .value as PresenceStatus
                )
              }
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
          </label>

          <label className="form-row">
            <span>Kulak Çentiği</span>

            <select
              value={earNotchStatus}
              onChange={(e) =>
                setEarNotchStatus(
                  e.target
                    .value as PresenceStatus
                )
              }
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
          </label>

          <label className="block-label">
            Mikroçip Numarası

            <input
              value={microchipNumber}
              onChange={(e) =>
                setMicrochipNumber(
                  e.target.value
                )
              }
              maxLength={32}
              placeholder="Mikroçip numarası"
            />
          </label>

          <label className="block-label">
            Ayırt Edici Özellikler

            <textarea
              value={distinctiveMarks}
              onChange={(e) =>
                setDistinctiveMarks(
                  e.target.value
                )
              }
              maxLength={1000}
              placeholder="Örneğin: sol kulağında küçük bir çentik..."
            />
          </label>
        </section>

        {adType === "LOST" && (
          <section className="form-card">
            <h2>
              <Search size={18} />
              {" "}
              Kayıp Bilgileri
            </h2>

            <label className="block-label">
              Kayıp Tarihi

              <input
                type="date"
                value={lostDate}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) =>
                  setLostDate(
                    e.target.value
                  )
                }
              />
            </label>
          </section>
        )}

        <section className="form-card">
          <h2>
            <MapPin size={18} />
            {" "}
            Konum
          </h2>

          <TeamButton
            type="button"
            variant="outline"
            full
            disabled={submitting}
            onClick={
              getCurrentLocation
            }
          >
            <MapPin size={18} />
            {" "}
            Konumumu Kullan
          </TeamButton>

          <label className="form-row">
            <span>Enlem</span>

            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={latitude}
              onChange={(e) =>
                setLatitude(
                  e.target.value
                )
              }
              placeholder="Örn. 40.195000"
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
              onChange={(e) =>
                setLongitude(
                  e.target.value
                )
              }
              placeholder="Örn. 29.060000"
              required
            />
          </label>
        </section>

        <TeamButton
          type="submit"
          full
          disabled={
            submitting ||
            analyzing
          }
        >
          <Send size={21} />

          {" "}

          {submitting
            ? "İlan Yayınlanıyor..."
            : "İlanı Yayınla"}
        </TeamButton>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {success && (
          <p className="success-message">
            İlan başarıyla oluşturuldu.
          </p>
        )}
      </form>
    </TeamShell>
  );
}
