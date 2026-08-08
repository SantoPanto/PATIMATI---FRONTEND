import { Camera, MapPin, PawPrint, Search, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";

export default function AddListingPage() {
  const [type, setType] = useState("Sahiplendirme");
  const [photo, setPhoto] = useState("");
  const [published, setPublished] = useState(false);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/" />
        <h1>Yeni İlan Ekle</h1>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); setPublished(true); }}>
        <label className="upload">
          <input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0]?.name ?? "")} />
          <Camera size={50} />
          <strong>{photo || "Fotoğraf Ekle"}</strong>
          <span>{photo ? "Fotoğraf seçildi" : "En az 1, en fazla 5"}</span>
        </label>

        <section className="form-card">
          <h2><PawPrint size={18} /> Hayvan Bilgileri</h2>
          <label className="form-row">
            <span>Tür</span>
            <select defaultValue="">
              <option value="" disabled>Kedi / Köpek</option>
              <option>Kedi</option>
              <option>Köpek</option>
              <option>Diğer</option>
            </select>
          </label>
          <label className="form-row">
            <span>Cins</span>
            <select defaultValue="">
              <option value="" disabled>Seçiniz</option>
              <option>Tekir</option>
              <option>Golden</option>
              <option>Melez</option>
            </select>
          </label>
          <label className="form-row">
            <span>Yaş</span>
            <select defaultValue="">
              <option value="" disabled>Seçiniz</option>
              <option>0-1 yaş</option>
              <option>1-3 yaş</option>
              <option>3+ yaş</option>
            </select>
          </label>
          <label className="form-row">
            <span>Cinsiyet</span>
            <select defaultValue="">
              <option value="" disabled>Erkek / Dişi</option>
              <option>Erkek</option>
              <option>Dişi</option>
            </select>
          </label>
        </section>

        <section className="form-card">
          <h2><ShieldCheck size={18} /> Durum</h2>
          <div className="segments">
            <button type="button" className={type === "Sahiplendirme" ? "active" : ""} onClick={() => setType("Sahiplendirme")}>
              <PawPrint size={16} /> Sahiplendirme
            </button>
            <button type="button" className={type !== "Sahiplendirme" ? "active" : ""} onClick={() => setType("Kayıp/Bulunan")}>
              <Search size={16} /> Kayıp/Bulunan
            </button>
          </div>
        </section>

        <section className="form-card">
          <label className="block-label">
            Konum
            <div className="input">
              <input required placeholder="Konum giriniz" />
              <MapPin size={18} />
            </div>
          </label>
          <label className="block-label">
            Açıklama
            <textarea maxLength={1000} placeholder="Açıklama giriniz..." />
          </label>
        </section>

        <TeamButton type="submit" full>
          <Send size={21} /> İlanı Yayınla
        </TeamButton>

        {published ? <p className="success-message">İlan taslağı hazırlandı. API bağlandığında yayınlama isteği buradan gönderilecek.</p> : null}
      </form>
    </TeamShell>
  );
}
