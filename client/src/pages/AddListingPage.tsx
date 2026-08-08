import { Camera, MapPin, PawPrint, Search, Send, ShieldCheck } from "lucide-react";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";

type AdType = "LOST" | "FOUND" | "ADOPTION";
type Species = "CAT" | "DOG" | "BIRD" | "OTHER";

export default function AddListingPage() {
  const [type, setType] = useState<AdType>("ADOPTION");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [species, setSpecies] = useState<Species | "">("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview("");
    }
  }

  // Map Turkish UI values to backend enums
  function mapAdType(t: string): AdType {
    if (t === "Sahiplendirme" || t === "ADOPTION" || t === "Sahiplenme") return "ADOPTION";
    if (t === "Bulundu" || t === "FOUND") return "FOUND";
    if (t === "Kayıp" || t === "LOST") return "LOST";
    return "ADOPTION";
  }

  function mapSpecies(s: string): Species {
    const low = s.toLowerCase();
    if (low.includes("kedi") || low.includes("cat")) return "CAT";
    if (low.includes("köpek") || low.includes("kopek") || low.includes("dog")) return "DOG";
    if (low.includes("kuş") || low.includes("kus") || low.includes("bird")) return "BIRD";
    return "OTHER";
  }

  async function uploadImageIfConfigured(file: File): Promise<string | null> {
    // kept for backward compatibility but NOT used by default integration
    const uploadUrl = process.env.REACT_APP_IMAGE_UPLOAD_URL;
    if (!uploadUrl) return null;

    const fd = new FormData();
    fd.append("file", file);

    const headers: Record<string, string> = {};
    const apiKey = process.env.REACT_APP_IMAGE_UPLOAD_KEY;
    if (apiKey) headers["x-api-key"] = apiKey;

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn("Image upload failed:", text);
        return null;
      }
      const json = await res.json();
      const url = json?.url || json?.data?.url || json?.data?.display_url || json?.data?.link || json?.display_url || json?.data?.image || null;
      return url ?? null;
    } catch (e) {
      console.warn("Image upload error:", e);
      return null;
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Location handling: accept "lat, lng" or browser geolocation fallback
      let lat: number | null = null;
      let lng: number | null = null;

      const coordsMatch = location.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
      if (coordsMatch) {
        lat = parseFloat(coordsMatch[1]);
        lng = parseFloat(coordsMatch[2]);
      }

      if (lat == null || lng == null) {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition((p) => resolve(p), () => resolve(null), { timeout: 5000 });
          });

          if (pos) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        }
      }

      if (lat == null || lng == null) {
        throw new Error("Konum bilgisi gerekli: tarayıcı konumu alınamadı ve konum alanı koordinat içermiyor.");
      }

      // Require at least one photo because backend enforces it
      if (!photoFile) {
        throw new Error("Lütfen en az bir fotoğraf yükleyin (backend gereksinimi).");
      }

      // Map species and validate it (backend only supports CAT or DOG)
      const mappedSpecies = species ? mapSpecies(species) : "OTHER";
      if (mappedSpecies !== "CAT" && mappedSpecies !== "DOG") {
        throw new Error("Lütfen türü 'Kedi' veya 'Köpek' olarak girin (örn. 'Kedi' veya 'Köpek').");
      }

      const adPayload: any = {
        title: title || `${species || "Hayvan"} ilanı`,
        description: description || "",
        adType: mapAdType(type),
        species: mappedSpecies,
        breed: breed || null,
        // latitude/longitude must be present in the AdCreateRequest
        latitude: lat,
        longitude: lng,
      };

      // Build multipart/form-data request with part 'ad' (JSON) and files 'images'
      const fd = new FormData();
      const adBlob = new Blob([JSON.stringify(adPayload)], { type: "application/json" });
      fd.append("ad", adBlob);
      fd.append("images", photoFile, photoFile.name);

      const apiBase = process.env.REACT_APP_API_URL ?? "";
      const url = `${apiBase}/api/ads`;

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: fd,
      });

      if (res.status === 201) {
        setPublished(true);
      } else {
        // Backend returns ProblemDetail or plain text
        let text: string;
        try {
          const json = await res.json();
          // If validation errors exist, show a compact message
          if (json?.message) {
            text = typeof json.message === 'string' ? json.message : JSON.stringify(json.message);
            if (json?.validationErrors) {
              text += '\n' + Object.entries(json.validationErrors).map(([k, v]) => `${k}: ${v}`).join('\n');
            }
          } else {
            text = JSON.stringify(json);
          }
        } catch (err) {
          text = await res.text();
        }
        throw new Error(text || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack />
        <h1>Yeni İlan Ekle</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <label className="upload">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <Camera size={50} />
          <strong>{photoPreview ? "Fotoğraf hazır" : "Fotoğraf Ekle"}</strong>
        </label>

        {photoPreview && (
          <div className="photo-preview">
            <img src={photoPreview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
          </div>
        )}

        <section className="form-card">
          <h2>
            <PawPrint /> Hayvan Bilgileri
          </h2>

          <label className="block-label">
            Tür
            <div className="input">
              <input required value={species} onChange={(e) => setSpecies(e.currentTarget.value)} placeholder="Kedi / Köpek" />
            </div>
          </label>

          <label className="block-label">
            Cins
            <div className="input">
              <input value={breed} onChange={(e) => setBreed(e.currentTarget.value)} placeholder="Seçiniz" />
            </div>
          </label>

          <label className="block-label">
            Yaş
            <div className="input">
              <input value={age} onChange={(e) => setAge(e.currentTarget.value)} placeholder="Seçiniz" />
            </div>
          </label>

          <label className="block-label">
            Cinsiyet
            <div className="input">
              <input value={gender} onChange={(e) => setGender(e.currentTarget.value)} placeholder="Erkek / Dişi" />
            </div>
          </label>
        </section>

        <section className="form-card">
          <h2>
            <ShieldCheck /> Durum
          </h2>
          <div className="segments">
            <button type="button" className={type === "ADOPTION" ? "active" : ""} onClick={() => setType("ADOPTION")}>
              Sahiplendirme
            </button>
            <button type="button" className={type === "FOUND" ? "active" : ""} onClick={() => setType("FOUND")}>Bulundu</button>
            <button type="button" className={type === "LOST" ? "active" : ""} onClick={() => setType("LOST")}>Kayıp</button>
          </div>
        </section>

        <section className="form-card">
          <label className="block-label">
            Konum
            <div className="input">
              <input required value={location} onChange={(e) => setLocation(e.currentTarget.value)} placeholder="Konum giriniz (veya 'lat, lng')" />
              <MapPin />
            </div>
          </label>

          <label className="block-label">
            Açıklama
            <div className="input">
              <input value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder="İlan açıklaması" />
            </div>
          </label>
        </section>

        <TeamButton type="submit" full disabled={loading}>
          <Send size={21} /> {loading ? "Yayınlanıyor..." : "İlanı Yayınla"}
        </TeamButton>

        {published && <p className="success">İlan taslağı hazırlandı. Gönderildi.</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </TeamShell>
  );
}
