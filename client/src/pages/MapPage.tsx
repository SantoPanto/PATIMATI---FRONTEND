import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { Filter, MapPin, PawPrint, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import MainLayout from "../components/MainLayout";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { getPublicAds } from "../services/ads";
import { getNearbyPois } from "../services/pois";
import type { AdResponse, PoiResponse, PoiType } from "../services/types";
import { hasKnownBreed } from "../utils/adPresentation";
import { getImageUrl } from "../utils/imageUrl";
import { konumAl } from "../utils/konum";
import {
  adLejantKalemleri,
  getMarkerType,
  getPoiMarkerType,
  HARITA_RENKLERI,
  haritadaGorunur,
  haritaOdagi,
  poiDetailPath,
  poiGorunur,
  poiLejantKalemleri,
  VARSAYILAN_MERKEZ,
  type HaritaFiltresi,
  type HaritaOdagi,
  type PoiFiltresi,
} from "../utils/haritaSunum";

/*
 * "Buradayım" işaretçisi: CircleMarker (SVG/canvas) CSS animasyonunu
 * güvenilir basmıyor, bu yüzden divIcon kullanılıyor — nabız halkası
 * map.css'teki .user-location-pulse keyframe'iyle çiziliyor.
 */
const KONUM_IKONU = L.divIcon({
  className: "",
  html:
    '<div class="user-location-marker">' +
    '<span class="user-location-pulse"></span>' +
    '<span class="user-location-dot"></span>' +
    "</div>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const TUM_POI_TIPLERI: PoiType[] = ["VETERINARY", "PET_SHOP", "SHELTER"];

/*
 * Sitenin kendi ikon setiyle (lucide) aynı çizgiler — emoji yerine (26.08
 * talebi: "hizmet logolarını sitede uyumlu hale getir"). Leaflet divIcon
 * ham HTML aldığı için React bileşeni değil, ikonun kendi SVG path verisi
 * (lucide-react) doğrudan gömülü.
 */
const POI_IKON_SVG: Record<PoiType, string> = {
  VETERINARY:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M11 2v2"></path><path d="M5 2v2"></path>' +
    '<path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path>' +
    '<path d="M8 15a6 6 0 0 0 12 0v-3"></path>' +
    '<circle cx="20" cy="10" r="2"></circle>' +
    "</svg>",
  PET_SHOP:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M16 10a4 4 0 0 1-8 0"></path>' +
    '<path d="M3.103 6.034h17.794"></path>' +
    '<path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path>' +
    "</svg>",
  SHELTER:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>' +
    '<path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>' +
    "</svg>",
};

function poiIkonuOlustur(type: PoiType) {
  const marker = getPoiMarkerType(type);
  return L.divIcon({
    className: "",
    html: `<div class="poi-marker" style="background:${marker.color}">${POI_IKON_SVG[type]}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const POI_IKONLARI: Record<PoiType, L.DivIcon> = {
  VETERINARY: poiIkonuOlustur("VETERINARY"),
  PET_SHOP: poiIkonuOlustur("PET_SHOP"),
  SHELTER: poiIkonuOlustur("SHELTER"),
};

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

/*
 * Yakın hizmet noktaları haritanın O AN GÖSTERDİĞİ alana göre çekilmeli,
 * cihazın ham konumuna göre değil — aksi hâlde ilan sınırına odaklanan
 * harita (ör. tek bir Ankara ilanı) başka bir şehirdeki konum/POI verisini
 * ekrana hiç getirmiyordu (26.08 canlı test: Ankara'ya odaklı haritada
 * Bursa merkezli POI'ler görünmüyordu). moveend her pan/zoom sonunda BİR
 * kez tetiklenir, ek debounce gerekmiyor.
 */
function MapViewTracker({
  onChange,
}: {
  onChange: (center: [number, number], radiusMeters: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const radius = center.distanceTo(map.getBounds().getNorthEast());
      onChange(
        [center.lat, center.lng],
        Math.min(Math.max(radius, 2000), 100000),
      );
    },
  });

  return null;
}

const KONUM_BUTONU_IKONU =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<line x1="12" y1="2" x2="12" y2="5"></line>' +
  '<line x1="12" y1="19" x2="12" y2="22"></line>' +
  '<line x1="2" y1="12" x2="5" y2="12"></line>' +
  '<line x1="19" y1="12" x2="22" y2="12"></line>' +
  '<circle cx="12" cy="12" r="6"></circle>' +
  '<circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>' +
  "</svg>";

/*
 * Yakınlaştırma denetiminin (leaflet-control-zoom) HEMEN ALTINDA "konumuma
 * git" butonu — L.Control olarak eklenir çünkü aynı köşedeki (topleft)
 * leaflet-bar denetimleri DOM sırasına göre otomatik alt alta dizilir; ayrı
 * bir CSS ile konumlandırmaya gerek kalmaz.
 */
function KonumButonu({ konum }: { konum: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    const KonumControl = L.Control.extend({
      onAdd() {
        const button = L.DomUtil.create(
          "button",
          "leaflet-bar-single leaflet-control map-locate-control",
        );
        button.type = "button";
        button.setAttribute("aria-label", "Konumuma git");
        button.title = konum
          ? "Konumuma git"
          : "Konum henüz alınamadı";
        button.disabled = !konum;
        button.innerHTML = KONUM_BUTONU_IKONU;

        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.on(button, "click", () => {
          if (konum) {
            map.setView(konum, 15);
          }
        });

        return button;
      },
    });

    const control = new KonumControl({ position: "topleft" });
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, konum]);

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
  const [konum, setKonum] = useState<[number, number] | null>(null);
  const [poiGorunumu, setPoiGorunumu] = useState<{
    merkez: [number, number];
    yaricap: number;
  }>({ merkez: VARSAYILAN_MERKEZ, yaricap: 20000 });
  const [pois, setPois] = useState<PoiResponse[]>([]);
  const [poiFilter, setPoiFilter] = useState<PoiFiltresi>("ALL");

  useEffect(() => {
    let cancelled = false;

    // Konum isteğe bağlı gösterge: izin verilmezse/alınamazsa harita sessizce
    // konumsuz çalışmaya devam eder, hata kullanıcıyı bloklamaz.
    konumAl()
      .then(({ enlem, boylam }) => {
        if (!cancelled) {
          setKonum([enlem, boylam]);
        }
      })
      .catch(() => {
        // Sessiz geç: konum bu sayfada zorunlu değil.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const [latitude, longitude] = poiGorunumu.merkez;

    getNearbyPois({ latitude, longitude, radius: poiGorunumu.yaricap })
      .then((data) => {
        if (!cancelled) {
          setPois(data);
        }
      })
      .catch((err) => {
        console.error("Yakındaki hizmet noktaları yüklenemedi:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [poiGorunumu]);

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

  const visiblePois = useMemo(
    () =>
      pois.filter(
        (poi): poi is PoiResponse & { latitude: number; longitude: number } =>
          poiGorunur(poi, poiFilter) &&
          Number.isFinite(poi.latitude) &&
          Number.isFinite(poi.longitude),
      ),
    [pois, poiFilter],
  );

  // Sağ alt lejant artık sabit değil, o an açık olan iki süzgece göre üretilir.
  const lejantKalemleri = useMemo(
    () => [...adLejantKalemleri(filter), ...poiLejantKalemleri(poiFilter)],
    [filter, poiFilter],
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
        konum,
      ),
    [selectedAd, noktalar, konum],
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

      <section className="map-filter-row">
        <div className="map-filter map-filter--ads">
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
            className={`map-filter-chip map-tinted-chip ${
              filter === "LOST" ? "active" : ""
            }`}
            onClick={() => setFilter("LOST")}
            style={
              filter === "LOST"
                ? {
                    background: HARITA_RENKLERI.LOST,
                    borderColor: HARITA_RENKLERI.LOST,
                  }
                : {
                    background: `${HARITA_RENKLERI.LOST}1a`,
                    borderColor: `${HARITA_RENKLERI.LOST}40`,
                    color: HARITA_RENKLERI.LOST,
                  }
            }
          >
            <MapPin size={16} />
            Kayıp
          </button>

          <button
            type="button"
            className={`map-filter-chip map-tinted-chip ${
              filter === "FOUND" ? "active" : ""
            }`}
            onClick={() => setFilter("FOUND")}
            style={
              filter === "FOUND"
                ? {
                    background: HARITA_RENKLERI.FOUND,
                    borderColor: HARITA_RENKLERI.FOUND,
                  }
                : {
                    background: `${HARITA_RENKLERI.FOUND}1a`,
                    borderColor: `${HARITA_RENKLERI.FOUND}40`,
                    color: HARITA_RENKLERI.FOUND,
                  }
            }
          >
            <MapPin size={16} />
            Bulunan
          </button>

          <button
            type="button"
            className={`map-filter-chip map-tinted-chip ${
              filter === "ADOPTION" ? "active" : ""
            }`}
            onClick={() => setFilter("ADOPTION")}
            style={
              filter === "ADOPTION"
                ? {
                    background: HARITA_RENKLERI.ADOPTION,
                    borderColor: HARITA_RENKLERI.ADOPTION,
                  }
                : {
                    background: `${HARITA_RENKLERI.ADOPTION}1a`,
                    borderColor: `${HARITA_RENKLERI.ADOPTION}40`,
                    color: HARITA_RENKLERI.ADOPTION,
                  }
            }
          >
            <MapPin size={16} />
            Sahiplendirme
          </button>

          <button
            type="button"
            className={`map-filter-chip map-tinted-chip ${
              filter === "HELP" ? "active" : ""
            }`}
            onClick={() => setFilter("HELP")}
            style={
              filter === "HELP"
                ? {
                    background: HARITA_RENKLERI.HELP,
                    borderColor: HARITA_RENKLERI.HELP,
                  }
                : {
                    background: `${HARITA_RENKLERI.HELP}1a`,
                    borderColor: `${HARITA_RENKLERI.HELP}40`,
                    color: HARITA_RENKLERI.HELP,
                  }
            }
          >
            <MapPin size={16} />
            Yardım
          </button>
        </div>

        <div className="map-filter map-filter--poi">
          <button
            type="button"
            className={`map-filter-chip ${
              poiFilter === "ALL" ? "active" : ""
            }`}
            onClick={() => setPoiFilter("ALL")}
          >
            Tümü
          </button>

          {TUM_POI_TIPLERI.map((type) => {
            const marker = getPoiMarkerType(type);
            const active = poiFilter === type;

            return (
              <button
                key={type}
                type="button"
                className={`map-filter-chip map-tinted-chip ${active ? "active" : ""}`}
                onClick={() => setPoiFilter(type)}
                style={
                  active
                    ? { background: marker.color, borderColor: marker.color }
                    : undefined
                }
              >
                {!active && (
                  <span
                    className="map-poi-chip__dot"
                    style={{ background: marker.color }}
                  />
                )}
                {marker.label}
              </button>
            );
          })}
        </div>
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

        {visiblePois.length > 0 && (
          <div>
            <strong>{visiblePois.length}</strong>
            <span> yakın hizmet noktası</span>
          </div>
        )}

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
            <KonumButonu konum={konum} />
            <MapViewTracker
              onChange={(merkez, yaricap) =>
                setPoiGorunumu({ merkez, yaricap })
              }
            />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {konum && (
              <Marker position={konum} icon={KONUM_IKONU}>
                <Popup>Buradasınız</Popup>
              </Marker>
            )}

            {visiblePois.map((poi) => {
              const marker = getPoiMarkerType(poi.type);

              return (
                <Marker
                  key={`poi-${poi.id}`}
                  position={[poi.latitude, poi.longitude]}
                  icon={POI_IKONLARI[poi.type]}
                >
                  <Popup>
                    <div className="map-popup">
                      {poi.photoUrl && (
                        <img
                          src={poi.photoUrl}
                          alt={poi.name}
                          className="map-popup__image"
                        />
                      )}

                      <div className="map-popup__content">
                        <span
                          className="map-popup__type"
                          style={{ color: marker.color }}
                        >
                          {marker.label}
                        </span>

                        <strong>{poi.name}</strong>

                        {poi.address && <span>{poi.address}</span>}
                        {poi.phone && <span>{poi.phone}</span>}
                        {poi.openingHours && <span>{poi.openingHours}</span>}

                        {poiDetailPath(poi) && (
                          <Link href={poiDetailPath(poi) as string}>
                            Hizmete Git
                          </Link>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

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
                        />
                      )}

                      <div className="map-popup__content">
                        <span className="map-popup__type">
                          {marker.label}
                          {ad.adType === "ADOPTION" && ad.ownerRole === "BARINAK"
                            ? " · Barınak"
                            : ""}
                        </span>

                        <strong>
                          {ad.title}
                        </strong>

                        <span>
                          {getSpeciesLabel(
                            ad.species,
                          )}
                          {hasKnownBreed(ad.breed)
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
            {lejantKalemleri.map((kalem) => (
              <span key={kalem.label}>
                <i style={{ background: kalem.color }} />
                {kalem.label}
              </span>
            ))}
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
              {hasKnownBreed(selectedAd.breed)
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
