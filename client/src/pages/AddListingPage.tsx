import { Camera, MapPin, PawPrint, Search, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";

export default function AddListingPage() {
  const [type, setType] = useState("Sahiplendirme");
  const [photo, setPhoto] = useState("");
  const [published, setPublished] = useState(false);
  return <TeamShell className="screen">
    <header className="center-header"><TeamBack /><h1>Yeni İlan Ekle</h1></header>
    <form onSubmit={(event) => { event.preventDefault(); setPublished(true); }}>
      <label className="upload"><input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0]?.name ?? "")} /><Camera size={50} /><strong>{photo || "Fotoğraf Ekle"}</strong><span>{photo ? "Fotoğraf seçildi" : "En az 1, en fazla 5"}</span></label>
      <section className="form-card"><h2><PawPrint /> Hayvan Bilgileri</h2>{[["Tür", "Kedi / Köpek"], ["Cins", "Seçiniz"], ["Yaş", "Seçiniz"], ["Cinsiyet", "Erkek / Dişi"]].map(([label, placeholder]) => <label className="form-row" key={label}>{label}<select defaultValue=""><option value="" disabled>{placeholder}</option><option>Kedi</option><option>Köpek</option><option>Diğer</option></select></label>)}</section>
      <section className="form-card"><h2><ShieldCheck /> Durum</h2><div className="segments"><button type="button" className={type === "Sahiplendirme" ? "active" : ""} onClick={() => setType("Sahiplendirme")}><PawPrint /> Sahiplendirme</button><button type="button" className={type !== "Sahiplendirme" ? "active" : ""} onClick={() => setType("Kayıp/Bulunan")}><Search /> Kayıp/Bulunan</button></div></section>
      <section className="form-card"><label className="block-label">Konum <div className="input"><input required placeholder="Konum giriniz" /><MapPin /></div></label><label className="block-label">Açıklama<textarea maxLength={1000} placeholder="Açıklama giriniz..." /></label></section>
      <TeamButton type="submit" full><Send size={21} /> İlanı Yayınla</TeamButton>{published ? <p className="success">İlan taslağı hazırlandı. API bağlandığında yayınlama isteği buradan gönderilecek.</p> : null}
    </form>
  </TeamShell>;
}
