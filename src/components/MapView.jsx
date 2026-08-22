import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function pinIcon(kind) {
  const className = kind === "active" ? "pin-marker active" : kind === "dead" ? "pin-marker dead" : "pin-marker";
  const size = kind === "active" ? 20 : 16;
  return L.divIcon({
    html: `<span class="${className}"></span>`,
    className: "pin-icon-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ThemeTiles({ theme }) {
  return <TileLayer attribution={ATTRIBUTION} url={theme === "light" ? LIGHT_TILES : DARK_TILES} />;
}

function FlyToSelection({ event }) {
  const map = useMap();
  useEffect(() => {
    if (event && event.lat != null && event.lng != null) {
      map.flyTo([event.lat, event.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [map, event?.id]);
  return null;
}

export default function MapView({ events, selectedId, onSelect, theme }) {
  const withCoords = events.filter((e) => e.lat != null && e.lng != null);
  const center = useMemo(() => {
    if (withCoords.length === 0) return [19.076, 72.8777];
    const lat = withCoords.reduce((sum, e) => sum + e.lat, 0) / withCoords.length;
    const lng = withCoords.reduce((sum, e) => sum + e.lng, 0) / withCoords.length;
    return [lat, lng];
  }, [withCoords]);

  const selected = events.find((e) => e.id === selectedId);
  const activeIcon = useMemo(() => pinIcon("active"), []);
  const normalIcon = useMemo(() => pinIcon("normal"), []);
  const deadIcon = useMemo(() => pinIcon("dead"), []);

  return (
    <div className="map-layer">
      <MapContainer
        className="leaflet-map"
        center={center}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom
      >
        <ThemeTiles theme={theme} />
        <FlyToSelection event={selected} />

        {events.map((e) => {
          if (e.lat == null || e.lng == null) return null;
          if (e.status === "failed") {
            return <Marker key={e.id} position={[e.lat, e.lng]} icon={deadIcon} interactive={false} />;
          }
          const isActive = e.id === selectedId;
          return (
            <Marker
              key={e.id}
              position={[e.lat, e.lng]}
              icon={isActive ? activeIcon : normalIcon}
              eventHandlers={{ click: () => onSelect(e.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
