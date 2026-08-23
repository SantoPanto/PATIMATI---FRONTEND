import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Locate, MapPin } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";
import { isValidCoordinates } from "../services/location";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { konumAl, konumHataMesaji } from "../utils/konum";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Default center: Kocaeli / Istanbul region coordinates
const DEFAULT_CENTER: [number, number] = [40.8528, 29.8815];

type MapPickerProps = {
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
};

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (e?.latlng) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && !isNaN(lat) && typeof lng === "number" && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false,
}: MapPickerProps) {
  const validCoordinates =
    isValidCoordinates(latitude, longitude) &&
    typeof longitude === "number"
      ? { latitude, longitude }
      : null;
  const hasCoordinates = validCoordinates !== null;
  const validLat = validCoordinates?.latitude ?? null;
  const validLng = validCoordinates?.longitude ?? null;

  const center: [number, number] = hasCoordinates
    ? [validCoordinates.latitude, validCoordinates.longitude]
    : DEFAULT_CENTER;

  const [isLocating, setIsLocating] = useState(false);

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);

    /*
     * Ortak yardımcı (utils/konum.ts): buradaki eski kod hata kodlarını
     * ayırıyordu ama zaman aşımında sadece "tekrar deneyin" diyordu.
     * Yardımcı, kapalı alanda çalışan ağ tabanlı konumla ikinci bir
     * deneme yapıyor.
     */
    let konum;
    try {
      konum = await konumAl();
    } catch (hata) {
      console.error("Konum alınamadı:", hata);
      setIsLocating(false);
      alert(konumHataMesaji(hata));
      return;
    }

    setIsLocating(false);

    if (!isValidCoordinates(konum.enlem, konum.boylam)) {
      alert("Tarayıcı geçerli bir konum koordinatı döndürmedi.");
      return;
    }

    if (onChange) {
      onChange(konum.enlem, konum.boylam);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-[#0F172A] dark:text-slate-100">
          <MapPin size={16} className="text-[#F97316]" />
          {readOnly ? "Profil Konumu" : "Konum Seç (Haritaya Tıklayın)"}
        </span>

        {!readOnly && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Locate size={14} />
            {isLocating ? "Konum alınıyor..." : "Mevcut Konumumu Al"}
          </button>
        )}
      </div>

      <ErrorBoundary
        title="Harita yüklenemedi."
        fallback={
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <MapPin size={32} className="text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {hasCoordinates
                ? `Konum: ${validLat?.toFixed(4)}, ${validLng?.toFixed(4)}`
                : "Konum seçilmedi."}
            </p>
          </div>
        }
      >
        <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#CBD5E1] shadow-inner dark:border-slate-700">
          <MapContainer
            center={center}
            zoom={hasCoordinates ? 14 : 10}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validCoordinates && (
              <Marker
                position={[validCoordinates.latitude, validCoordinates.longitude]}
              />
            )}
            {validCoordinates && (
              <RecenterMap
                lat={validCoordinates.latitude}
                lng={validCoordinates.longitude}
              />
            )}

            {!readOnly && onChange && (
              <ClickHandler
                onSelect={(lat, lng) => {
                  onChange(lat, lng);
                }}
              />
            )}
          </MapContainer>
        </div>
      </ErrorBoundary>

      {hasCoordinates ? (
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Seçilen Koordinat:{" "}
          <span className="font-medium text-[#0F172A] dark:text-slate-100">
            {validLat?.toFixed(6)}, {validLng?.toFixed(6)}
          </span>
        </p>
      ) : (
        !readOnly && (
          <p className="text-xs text-[#94A3B8] dark:text-slate-500">
            Haritada bir noktaya tıklayarak enlem ve boylam bilginizi belirleyin.
          </p>
        )
      )}
    </div>
  );
}
