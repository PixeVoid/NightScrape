import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function pinIcon(kind, count) {
  const className = kind === "active" ? "pin-marker active" : kind === "dead" ? "pin-marker dead" : "pin-marker";
  const size = kind === "active" ? 26 : 20;
  const label = count > 1 ? `<span class="pin-count">${count}</span>` : "";
  return L.divIcon({
    html: `<span class="${className}">${label}</span>`,
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

// One pin per venue, not per event — a venue with 40 events would otherwise
// render 40 overlapping markers stacked on the same spot. The pin shows the
// event count; clicking selects that venue's soonest "ok" event.
function groupByVenue(events) {
  const byVenue = new Map();
  for (const e of events) {
    if (e.lat == null || e.lng == null) continue;
    const key = e.venue;
    if (!byVenue.has(key)) byVenue.set(key, { venue: key, lat: e.lat, lng: e.lng, events: [] });
    byVenue.get(key).events.push(e);
  }
  return [...byVenue.values()].map((group) => {
    const ok = group.events.filter((e) => e.status === "ok").sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
    return { ...group, primary: ok[0] ?? group.events[0], okCount: ok.length, isDead: ok.length === 0 };
  });
}

export default function MapView({ events, selectedId, onSelect, theme }) {
  const venues = useMemo(() => groupByVenue(events), [events]);

  const center = useMemo(() => {
    if (venues.length === 0) return [19.076, 72.8777];
    const lat = venues.reduce((sum, v) => sum + v.lat, 0) / venues.length;
    const lng = venues.reduce((sum, v) => sum + v.lng, 0) / venues.length;
    return [lat, lng];
  }, [venues]);

  const selectedEvent = events.find((e) => e.id === selectedId);
  const selectedVenue = venues.find((v) => v.venue === selectedEvent?.venue);

  return (
    <div className="map-layer">
      <MapContainer className="leaflet-map" center={center} zoom={12} zoomControl={false} scrollWheelZoom>
        <ThemeTiles theme={theme} />
        <FlyToSelection event={selectedVenue} />

        {venues.map((v) => {
          const isActive = v.venue === selectedEvent?.venue;
          const icon = v.isDead
            ? pinIcon("dead", v.events.length)
            : pinIcon(isActive ? "active" : "normal", v.okCount);
          return (
            <Marker
              key={v.venue}
              position={[v.lat, v.lng]}
              icon={icon}
              interactive={!v.isDead}
              eventHandlers={v.isDead ? undefined : { click: () => onSelect(v.primary.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
