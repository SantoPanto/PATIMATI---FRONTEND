import {
  Camera,
  MapPin,
  PawPrint,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";

import {
  TeamBack,
  TeamButton,
  TeamShell,
} from "../components/TeamUI";

import { postListing } from "../services/api";

const AI_URL = "http://localhost:8000";

interface AIResult {
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

  const [status, setStatus] =
    useState("Sahiplendirme");

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [photoName, setPhotoName] =
    useState("");

  const [type, setType] =
    useState("Kedi");

  const [breed, setBreed] =
    useState("");

  const [age, setAge] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loadingAI, setLoadingAI] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [aiResult, setAiResult] =
    useState<AIResult | null>(null);

  async function analyzeImage(file: File) {

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      `${AI_URL}/analyze`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        "AI couldn't analyze the image."
      );
    }

    return await response.json();

  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0];

    if (!file) return;

    setPhoto(file);
    setPhotoName(file.name);

    setLoadingAI(true);
    setError("");

    try {

      const result: AIResult =
        await analyzeImage(file);

      setAiResult(result);

      switch (
        result.species.toLowerCase()
      ) {

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

      const generatedDescription =
        [
          result.species,
          result.breed,
          ...(result.colors ?? []),
          result.pattern,
        ]
          .filter(Boolean)
          .join(", ");

      if (generatedDescription) {
        setDescription(
          generatedDescription
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        "AI analysis failed."
      );

      setAiResult(null);

    } finally {

      setLoadingAI(false);

    }
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {

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

      // Basic information

      formData.append(
        "status",
        status
      );

      formData.append(
        "type",
        type
      );

      formData.append(
        "breed",
        breed
      );

      formData.append(
        "age",
        age
      );

      formData.append(
        "gender",
        gender
      );

      formData.append(
        "location",
        location
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "photo",
        photo
      );

      // AI metadata

      if (aiResult) {

        formData.append(
          "embedding",
          JSON.stringify(
            aiResult.embedding
          )
        );

        formData.append(
          "labels",
          JSON.stringify(
            aiResult.labels
          )
        );

        formData.append(
          "species",
          aiResult.species
        );

        formData.append(
          "species_confidence",
          aiResult.species_confidence.toString()
        );

        formData.append(
          "breed_confidence",
          aiResult.breed_confidence.toString()
        );

        formData.append(
          "colors",
          JSON.stringify(
            aiResult.colors
          )
        );

        formData.append(
          "pattern",
          aiResult.pattern ?? ""
        );

        formData.append(
          "model_version",
          aiResult.model_version
        );

        formData.append(
          "is_pet",
          String(aiResult.is_pet)
        );

      }

      await postListing(
        formData
      );

      setSuccess(true);

      setPhoto(null);
      setPhotoName("");

      setStatus(
        "Sahiplendirme"
      );

      setType(
        "Kedi"
      );

      setBreed("");

      setAge("");

      setGender("");

      setLocation("");

      setDescription("");

      setAiResult(null);

    }
    catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Gönderim sırasında hata oluştu."

      );

    }
    finally {

      setSubmitting(false);

    }

  }

  return (

    <TeamShell className="screen">

      <header className="center-header">

        <TeamBack href="/" />

        <h1>
          Yeni İlan Ekle
        </h1>

      </header>

      <form
        onSubmit={handleSubmit}
      >

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

          <Camera
            size={50}
          />

          <strong>

            {photoName ||

              "Fotoğraf Ekle"}

          </strong>

          <span>

            {loadingAI

              ? "🧠 AI fotoğrafı analiz ediyor..."

              : photoName

              ? "Fotoğraf seçildi"

              : "En az 1, en fazla 5"}

          </span>

        </label>

        {

          aiResult && (

            <section className="form-card">

              <h2>

                🤖 AI Analizi

              </h2>

              <p>

                <strong>

                  Tür:

                </strong>

                {" "}

                {aiResult.species}

              </p>

              <p>

                <strong>

                  Cins:

                </strong>

                {" "}

                {aiResult.breed ??

                  "Bilinmiyor"}

              </p>

              <p>

                <strong>

                  Güven:

                </strong>

                {" "}

                {(
                  aiResult.species_confidence *
                  100
                ).toFixed(1)}%

              </p>

            </section>

          )

        }

        <section className="form-card">

          <h2>

            <PawPrint
              size={18}
            />

            {" "}

            Hayvan Bilgileri

          </h2>
                    <label className="form-row">

            <span>Tür</span>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loadingAI}
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
              onChange={(e) => setBreed(e.target.value)}
              disabled={loadingAI}
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
              onChange={(e) => setAge(e.target.value)}
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
              onChange={(e) => setGender(e.target.value)}
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
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                placeholder="Konum giriniz"
                required
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
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              maxLength={1000}
              placeholder="Açıklama giriniz..."
            />

          </label>

        </section>

        <TeamButton
          type="submit"
          full
          disabled={
            submitting ||
            loadingAI
          }
        >

          <Send size={21} />

          {" "}

          {loadingAI
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
  }
