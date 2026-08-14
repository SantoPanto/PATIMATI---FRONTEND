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

import { TeamBack, TeamShell } from "../components/TeamUI";
import { getPublicAds } from "../services/ads";
import type { AdResponse, AdType } from "../services/types";

type MapFilter = "ALL" | "LOST" | "FOUND";

const BURSA_CENTER: [number, number] = [40.195, 29.06];

function MapController({
  center,
}: {
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);

  return null;
}

function getMarkerType(adType: AdType) {
  if (adType === "LOST") {
    return {
      label: "Kayıp",
      className: "lost",
    };
  }

  if (adType === "FOUND") {
    return {
      label: "Bulunan",
      className: "found",
    };
  }

  return {
    label: "Sahiplendirme",
    className: "adoption",
  };
}

function getSpeciesLabel(species: AdResponse["species"]) {
  return species === "CAT" ? "Kedi" : "Köpek";
}

export default function MapPage() {
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [filter, setFilter] = useState<MapFilter>("ALL");
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

  const mappedAds = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return ads.filter((ad) => {
      /*
       * Adoption ads can exist in the database, but the map's
       * primary purpose is lost/found animals.
       */
      if (
        filter !== "ALL" &&
        ad.adType !== filter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        ad.title
          ?.toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        ad.breed
          ?.toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch) ||
        getSpeciesLabel(ad.species)
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch)
      );
    });
  }, [ads, filter, search]);

  const adsWithCoordinates = useMemo(
    () =>
      mappedAds.filter(
        (ad) =>
          Number.isFinite(ad.latitude) &&
          Number.isFinite(ad.longitude),
      ),
    [mappedAds],
  );

  const center = useMemo<[number, number]>(() => {
    if (selectedAd && selectedAd.latitude != null && selectedAd.longitude != null) {
      return [
        selectedAd.latitude,
        selectedAd.longitude,
      ];
    }

    if (adsWithCoordinates.length > 0 && adsWithCoordinates[0].latitude != null && adsWithCoordinates[0].longitude != null) {
      return [
        adsWithCoordinates[0].latitude,
        adsWithCoordinates[0].longitude,
      ];
    }

    return BURSA_CENTER;
  }, [selectedAd, adsWithCoordinates]);

  return (
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
            center={center}
            zoom={12}
            scrollWheelZoom
            className="real-map"
          >
            <MapController center={center} />

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
                          src={ad.photoUrls[0]}
                          alt={ad.title}
                          className="map-popup__image"
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
  );
}
