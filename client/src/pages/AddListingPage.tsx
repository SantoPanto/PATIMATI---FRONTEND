import { Camera, MapPin, PawPrint, Search, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";
import { postListing } from "../services/api";

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoName(file?.name ?? "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!location.trim() || !description.trim()) {
      setError("Konum ve açıklama alanları zorunludur.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("breed", breed);
      formData.append("age", age);
      formData.append("gender", gender);
      formData.append("status", status);
      formData.append("location", location);
      formData.append("description", description);
      if (photo) {
        formData.append("photo", photo);
      }

      await postListing(formData);
      setSuccess(true);
      setPhoto(null);
      setPhotoName("");
      setType("Kedi");
      setBreed("");
      setAge("");
      setGender("");
      setLocation("");
      setDescription("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Gönderim sırasında bir hata oluştu.");
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
        <label className="upload" htmlFor="listing-photo">
          <input id="listing-photo" type="file" accept="image/*" onChange={handleFileChange} />
          <Camera size={50} />
          <strong>{photoName || "Fotoğraf Ekle"}</strong>
          <span>{photoName ? "Fotoğraf seçildi" : "En az 1, en fazla 5"}</span>
        </label>

        <section className="form-card">
          <h2><PawPrint size={18} /> Hayvan Bilgileri</h2>
          <label className="form-row">
            <span>Tür</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="Kedi">Kedi</option>
              <option value="Köpek">Köpek</option>
              <option value="Diğer">Diğer</option>
            </select>
          </label>
          <label className="form-row">
            <span>Cins</span>
            <select value={breed} onChange={(event) => setBreed(event.target.value)}>
              <option value="" disabled>Seçiniz</option>
              <option>Tekir</option>
              <option>Golden</option>
              <option>Melez</option>
            </select>
          </label>
          <label className="form-row">
            <span>Yaş</span>
            <select value={age} onChange={(event) => setAge(event.target.value)}>
              <option value="" disabled>Seçiniz</option>
              <option>0-1 yaş</option>
              <option>1-3 yaş</option>
              <option>3+ yaş</option>
            </select>
          </label>
          <label className="form-row">
            <span>Cinsiyet</span>
            <select value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="" disabled>Erkek / Dişi</option>
              <option>Erkek</option>
              <option>Dişi</option>
            </select>
          </label>
        </section>

        <section className="form-card">
          <h2><ShieldCheck size={18} /> Durum</h2>
          <div className="segments">
            <button type="button" className={status === "Sahiplendirme" ? "active" : ""} onClick={() => setStatus("Sahiplendirme")}> 
              <PawPrint size={16} /> Sahiplendirme
            </button>
            <button type="button" className={status !== "Sahiplendirme" ? "active" : ""} onClick={() => setStatus("Kayıp/Bulunan")}> 
              <Search size={16} /> Kayıp/Bulunan
            </button>
          </div>
        </section>

        <section className="form-card">
          <label className="block-label" htmlFor="listing-location">
            Konum
            <div className="input">
              <input id="listing-location" required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Konum giriniz" />
              <MapPin size={18} />
            </div>
          </label>
          <label className="block-label" htmlFor="listing-description">
            Açıklama
            <textarea id="listing-description" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Açıklama giriniz..." />
          </label>
        </section>

        <TeamButton type="submit" full disabled={submitting}>
          <Send size={21} /> {submitting ? "Gönderiliyor..." : "İlanı Yayınla"}
        </TeamButton>

        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="success-message">İlan başarıyla gönderildi.</p> : null}
      </form>
    </TeamShell>
  );
}
