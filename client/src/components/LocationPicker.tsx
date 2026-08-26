import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const VARSAYILAN_MERKEZ: [number, number] = [40.1885, 29.0610]; // Bursa merkezi

interface LocationPickerProps {
  value?: { latitude: number; longitude: number } | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const position: [number, number] = value 
    ? [value.latitude, value.longitude] 
    : VARSAYILAN_MERKEZ;

  return (
    <div style={{ height: "250px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
      <MapContainer
        center={position}
        zoom={value ? 15 : 12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onChange} />
        {value && <Marker position={[value.latitude, value.longitude]} />}
      </MapContainer>
    </div>
  );
}