import { Camera, MapPin, PawPrint, Search, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";
import { postListing } from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

export default function AddListingPage() {
  const [status, setStatus] = useState("Sahiplendirme");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");

  const [type, setType] = useState("Kedi");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<AIAnalysisResponse | null>(null);

  const analyzeImage = async (
    file: File
  ): Promise<AIAnalysisResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("AI analysis failed.");
    }

    return await response.json();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhoto(file);
    setPhotoName(file.name);

    setError("");
    setAnalyzing(true);

    try {
      const result = await analyzeImage(file);

      setAiData(result);

      switch (result.species.toLowerCase()) {
        case "cat":
          setType("Kedi");
          break;

        case "dog":
          setType("Köpek");
          break;

        default:
          setType("Diğer");
      }

      if (result.breed) {
        setBreed(result.breed);
      }

      const autoDescription = [
        result.species,
        result.breed,
        ...(result.colors || []),
        result.pattern,
      ]
        .filter(Boolean)
        .join(", ");

      if (autoDescription.length > 0) {
        setDescription(autoDescription);
      }
    } catch (err) {
      console.error(err);
      setAiData(null);
      setError("Fotoğraf analiz edilemedi.");
    } finally {
      setAnalyzing(false);
    }
  };
    const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!photo) {
      setError("Lütfen bir fotoğraf seçiniz.");
      return;
    }

    if (!location.trim()) {
      setError("Konum alanı zorunludur.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // Basic listing information
      formData.append("status", status);
      formData.append("type", type);
      formData.append("breed", breed);
      formData.append("age", age);
      formData.append("gender", gender);
      formData.append("location", location);
      formData.append("description", description);

      formData.append("photo", photo);

      // AI metadata
      if (aiData) {
        formData.append(
          "embedding",
          JSON.stringify(aiData.embedding)
        );

        formData.append(
          "labels",
          JSON.stringify(aiData.labels)
        );

        formData.append(
          "species",
          aiData.species
        );

        formData.append(
          "species_confidence",
          aiData.species_confidence.toString()
        );

        formData.append(
          "breed_confidence",
          aiData.breed_confidence.toString()
        );

        formData.append(
          "colors",
          JSON.stringify(aiData.colors)
        );

        formData.append(
          "pattern",
          aiData.pattern ?? ""
        );

        formData.append(
          "model_version",
          aiData.model_version
        );

        formData.append(
          "is_pet",
          String(aiData.is_pet)
        );
      }

      await postListing(formData);

      setSuccess(true);

      // Reset everything
      setPhoto(null);
      setPhotoName("");

      setStatus("Sahiplendirme");

      setType("Kedi");
      setBreed("");
      setAge("");
      setGender("");

      setLocation("");
      setDescription("");

      setAiData(null);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Gönderim sırasında hata oluştu."
      );

    } finally {

      setSubmitting(false);

    }
  };

  return (
    <TeamShell className="screen">

      <header className="center-header">
        <TeamBack href="/" />
        <h1>Yeni İlan Ekle</h1>
      </header>

      <form onSubmit={handleSubmit}>

        <label
          className="upload"
          htmlFor="listing-photo"
        >

          <input
            id="listing-photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <Camera size={50} />

          <strong>
            {photoName || "Fotoğraf Ekle"}
          </strong>

          <span>
            {analyzing
              ? "🧠 AI fotoğrafı analiz ediyor..."
              : photoName
              ? "Fotoğraf seçildi"
              : "En az 1, en fazla 5"}
          </span>

        </label>

        {aiData && (
          <section className="form-card">

            <h2>🤖 AI Analizi</h2>

            <p>
              <strong>Tür:</strong> {aiData.species}
            </p>

            <p>
              <strong>Cins:</strong>{" "}
              {aiData.breed ?? "Bilinmiyor"}
            </p>

            <p>
              <strong>Renkler:</strong>{" "}
              {aiData.colors.join(", ")}
            </p>

            <p>
              <strong>Pattern:</strong>{" "}
              {aiData.pattern ?? "-"}
            </p>

            <p>
              <strong>Güven:</strong>{" "}
              {(aiData.species_confidence * 100).toFixed(1)}%
            </p>

          </section>
        )}

        <section className="form-card">

          <h2>
            <PawPrint size={18} />
            {" "}
            Hayvan Bilgileri
          </h2>
                    <label className="form-row">
            <span>Tür</span>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              disabled={analyzing}
            >
              <option value="Kedi">Kedi</option>
              <option value="Köpek">Köpek</option>
              <option value="Diğer">Diğer</option>
            </select>
          </label>

          <label className="form-row">
            <span>Cins</span>

            <select
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              disabled={analyzing}
            >
              <option value="">Seçiniz</option>

              <option>Tekir</option>
              <option>Golden</option>
              <option>Melez</option>
            </select>
          </label>

          <label className="form-row">
            <span>Yaş</span>

            <select
              value={age}
              onChange={(event) => setAge(event.target.value)}
            >
              <option value="">Seçiniz</option>

              <option>0-1 yaş</option>
              <option>1-3 yaş</option>
              <option>3+ yaş</option>
            </select>
          </label>

          <label className="form-row">
            <span>Cinsiyet</span>

            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Erkek / Dişi</option>

              <option>Erkek</option>
              <option>Dişi</option>
            </select>
          </label>

        </section>

        <section className="form-card">

          <h2>
            <ShieldCheck size={18} />
            {" "}
            Durum
          </h2>

          <div className="segments">

            <button
              type="button"
              className={
                status === "Sahiplendirme"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatus("Sahiplendirme")
              }
            >
              <PawPrint size={16} />
              {" "}
              Sahiplendirme
            </button>

            <button
              type="button"
              className={
                status === "Kayıp/Bulunan"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatus("Kayıp/Bulunan")
              }
            >
              <Search size={16} />
              {" "}
              Kayıp / Bulunan
            </button>

          </div>

        </section>

        <section className="form-card">

          <label
            className="block-label"
            htmlFor="listing-location"
          >

            Konum

            <div className="input">

              <input
                id="listing-location"
                required
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Konum giriniz"
              />

              <MapPin size={18} />

            </div>

          </label>

          <label
            className="block-label"
            htmlFor="listing-description"
          >

            Açıklama

            <textarea
              id="listing-description"
              maxLength={1000}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Açıklama giriniz..."
            />

          </label>

        </section>

        <TeamButton
          type="submit"
          full
          disabled={submitting || analyzing}
        >

          <Send size={21} />

          {analyzing
            ? "AI Analiz Ediyor..."
            : submitting
            ? "Gönderiliyor..."
            : "İlanı Yayınla"}

        </TeamButton>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {success && (
          <p className="success-message">
            İlan başarıyla gönderildi.
          </p>
        )}

      </form>

    </TeamShell>
  );
}
