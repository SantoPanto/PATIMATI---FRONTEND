import React from "react";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function MapPage(): JSX.Element {
  const [lost, setLost] = useState(true);
  const [found, setFound] = useState(true);

  const visibleListings = (petListings ?? []).filter((item) => {
    if (item?.type === "Kayıp" && !lost) return false;
    if (item?.type === "Bulunan" && !found) return false;
    return true;
  });

  return (
    <TeamShell className="map-page">
      <header className="center-header">
        <TeamBack href="/" />
        <h1>Harita</h1>
        <button className="icon-button" aria-label="Filtre">☰</button>
      </header>

      <section className="map-filter">
        <label>
          <MapPin size={16} /> Kayıp Hayvanlar
          <button
            type="button"
            className={`toggle lost ${lost ? "on" : ""}`}
            onClick={() => setLost((s) => !s)}
            aria-pressed={lost}
            aria-label={lost ? "Kayıp hayvanları gizle" : "Kayıp hayvanları göster"}
          />
        </label>
        <label>
          <MapPin size={16} /> Bulunan Hayvanlar
          <button
            type="button"
            className={`toggle found ${found ? "on" : ""}`}
            onClick={() => setFound((s) => !s)}
            aria-pressed={found}
            aria-label={found ? "Bulunan hayvanları gizle" : "Bulunan hayvanları göster"}
          />
        </label>
      </section>

      <section className="map-art">
        <strong>Patimati Haritası</strong>
        {visibleListings.map((item, index) => (
          <div
            key={item.id ?? index}
            className={`map-marker ${index % 2 === 0 ? "marker-one" : "marker-two"}`}
          >
            <MapPin size={18} />
            <span>{item.location}</span>
          </div>
        ))}
      </section>
    </TeamShell>
  );
}
