import { MapPin } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function MapPage() {
  const [lost, setLost] = useState(true);
  const [found, setFound] = useState(true);

  return <TeamShell className="map-page">
    <header className="center-header"><TeamBack /><h1>Harita</h1><button className="icon-button" aria-label="Filtre">☰</button></header>
    <section className="map-filter">
      <label><MapPin />Kayıp Hayvanlar <button type="button" className={lost ? "toggle on lost" : "toggle lost"} onClick={() => setLost(!lost)} /></label>
      <label><MapPin />Bulunan Hayvanlar <button type="button" className={found ? "toggle on found" : "toggle found"} onClick={() => setFound(!found)} /></label>
    </section>
    <section className="map-art"><div className="empty"><MapPin size={46} /><h2>Harita hazırlanıyor</h2><p>İlan konumları API bağlantısından sonra burada gösterilecek.</p></div></section>
  </TeamShell>;
}
