import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Link } from "wouter";
import { Filter, MapPin, PawPrint, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import MainLayout from "../components/MainLayout";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { getPublicAds } from "../services/ads";
import type { AdResponse } from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import {
  getMarkerType,
  haritadaGorunur,
  haritaOdagi,
  VARSAYILAN_MERKEZ,
  type HaritaFiltresi,
  type HaritaOdagi,
} from "../utils/haritaSunum";

function MapController({ odak }: { odak: HaritaOdagi }) {
  const map = useMap();

  useEffect(() => {
    if (odak.tip === "sinir") {
      map.fitBounds(odak.noktalar, { padding: [48, 48], maxZoom: 13 });
      return;
    }

    map.setView(odak.nokta, odak.yakinlik);
  }, [odak, map]);

  return null;
}

function getSpeciesLabel(species: AdResponse["species"]) {
  return species === "CAT" ? "Kedi" : "Köpek";
}

export default function MapPage() {
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [filter, setFilter] = useState<HaritaFiltresi>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPublicAds({
          page: 0,
          size: 100,
        });

        if (cancelled) return;

        setAds(response.content ?? []);
      } catch (err) {
        console.error("Harita ilanları yüklenemedi:", err);

        if (!cancelled) {
          setError(
            "İlanlar haritada yüklenemedi. Lütfen daha sonra tekrar deneyin.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAds();

    return () => {
      cancelled = true;
    };
  }, []);

  // Süzgeç + arama kuralı utils/haritaSunum'da (saf, testli): sahiplendirme
  // işaretçileri çizilip lejantta yer aldığı hâlde süzgeçte seçeneği yoktu.
  const mappedAds = useMemo(
    () => ads.filter((ad) => haritadaGorunur(ad, filter, search)),
    [ads, filter, search],
  );

  const adsWithCoordinates = useMemo(
    () =>
      mappedAds.filter(
        (ad) =>
          Number.isFinite(ad.latitude) &&
          Number.isFinite(ad.longitude),
      ),
    [mappedAds],
  );

  const noktalar = useMemo<[number, number][]>(
    () =>
      adsWithCoordinates.map((ad) => [
        ad.latitude as number,
        ad.longitude as number,
      ]),
    [adsWithCoordinates],
  );

  const odak = useMemo(
    () =>
      haritaOdagi(
        selectedAd &&
          selectedAd.latitude != null &&
          selectedAd.longitude != null
          ? [selectedAd.latitude, selectedAd.longitude]
          : null,
        noktalar,
      ),
    [selectedAd, noktalar],
  );

  return (
    <MainLayout showFooter={true} className="map-page-layout">
      <TeamShell className="map-page">
      <header className="center-header">
        <TeamBack href="/" />

        <h1>Harita</h1>

        <button
          type="button"
          className="icon-button"
          aria-label="Filtreleri aç"
          onClick={() => setShowFilters((value) => !value)}
        >
          {showFilters ? (
            <X size={20} />
          ) : (
            <Filter size={20} />
          )}
        </button>
      </header>

      <section className="map-filter">
        <button
          type="button"
          className={`map-filter-chip ${
            filter === "ALL" ? "active" : ""
          }`}
          onClick={() => setFilter("ALL")}
        >
          <MapPin size={16} />
          Tümü
        </button>

        <button
          type="button"
          className={`map-filter-chip ${
            filter === "LOST" ? "active" : ""
          }`}
          onClick={() => setFilter("LOST")}
        >
          <MapPin size={16} />
          Kayıp
        </button>

        <button
          type="button"
          className={`map-filter-chip ${
            filter === "FOUND" ? "active" : ""
          }`}
          onClick={() => setFilter("FOUND")}
        >
          <MapPin size={16} />
          Bulunan
        </button>

        <button
          type="button"
          className={`map-filter-chip ${
            filter === "ADOPTION" ? "active" : ""
          }`}
          onClick={() => setFilter("ADOPTION")}
        >
          <MapPin size={16} />
          Sahiplendirme
        </button>
      </section>

      {showFilters && (
        <section className="map-search-panel">
          <div className="map-search">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="İlan, ırk veya hayvan ara..."
              aria-label="Haritada ilan ara"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Aramayı temizle"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </section>
      )}

      <section className="map-status">
        <div>
          <strong>
            {adsWithCoordinates.length}
          </strong>

          <span> haritada ilan</span>
        </div>

        {loading && (
          <span>İlanlar yükleniyor...</span>
        )}
      </section>

      {error ? (
        <section className="map-error">
          <PawPrint size={32} />

          <strong>{error}</strong>

          <Link href="/listings">
            İlanları görüntüle
          </Link>
        </section>
      ) : (
        <section className="map-art">
          <MapContainer
            center={VARSAYILAN_MERKEZ}
            zoom={12}
            scrollWheelZoom
            className="real-map"
          >
            <MapController odak={odak} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {adsWithCoordinates.map((ad) => {
              const marker =
                getMarkerType(ad.adType);

              return (
                <CircleMarker
                  key={ad.id}
                  center={[
                    ad.latitude ?? 0,
                    ad.longitude ?? 0,
                  ]}
                  radius={
                    selectedAd?.id === ad.id
                      ? 12
                      : 9
                  }
                  pathOptions={{
                    className: `pet-map-marker pet-map-marker--${marker.className}`,
                    // Renk className'e bırakılmaz: canlıda sınıf SVG path'e
                    // ulaşmıyordu, 20 işaretçi de varsayılan maviydi (22.08).
                    fillColor: marker.fillColor,
                    fillOpacity: 0.9,
                    color: "#ffffff",
                    weight: 3,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedAd(ad);
                    },
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      {ad.photoUrls?.[0] && (
                        <img
                          src={getImageUrl(ad.photoUrls[0])}
                          alt={ad.title}
                          className="map-popup__image"
                          loading="lazy"
                        />
                      )}

                      <div className="map-popup__content">
                        <span className="map-popup__type">
                          {marker.label}
                        </span>

                        <strong>
                          {ad.title}
                        </strong>

                        <span>
                          {getSpeciesLabel(
                            ad.species,
                          )}
                          {ad.breed
                            ? ` • ${ad.breed}`
                            : ""}
                        </span>

                        <Link
                          href={`/pet/${ad.id}`}
                        >
                          İlanı görüntüle
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="map-legend">
            <span>
              <i className="lost" />
              Kayıp
            </span>

            <span>
              <i className="found" />
              Bulunan
            </span>

            {filter === "ALL" && (
              <span>
                <i className="adoption" />
                Sahiplendirme
              </span>
            )}
          </div>

          {!loading &&
            adsWithCoordinates.length === 0 && (
              <div className="map-empty">
                <MapPin size={32} />

                <strong>
                  Bu bölgede haritada gösterilecek
                  ilan bulunamadı.
                </strong>

                <Link href="/listings">
                  Tüm ilanlara bak
                </Link>
              </div>
            )}
        </section>
      )}

      {selectedAd && (
        <section className="map-selected-card">
          <button
            type="button"
            aria-label="Seçimi kapat"
            onClick={() => setSelectedAd(null)}
          >
            <X size={18} />
          </button>

          <div>
            <span>
              {getMarkerType(
                selectedAd.adType,
              ).label}
            </span>

            <strong>{selectedAd.title}</strong>

            <p>
              {getSpeciesLabel(
                selectedAd.species,
              )}
              {selectedAd.breed
                ? ` • ${selectedAd.breed}`
                : ""}
            </p>
          </div>

          <Link
            href={`/pet/${selectedAd.id}`}
          >
            Detay
          </Link>
        </section>
      )}
    </TeamShell>
    </MainLayout>
  );
}
