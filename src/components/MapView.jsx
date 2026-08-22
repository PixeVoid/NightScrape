import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function pinIcon(kind, count) {
  const className = kind === "active" ? "pin-marker active" : kind === "dead" ? "pin-marker dead" : "pin-marker";
  const size = kind === "active" ? 38 : 20;
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
    if (event?.lat != null && event?.lng != null) {
      map.flyTo([event.lat, event.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [map, event?.venue]);
  return null;
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function computeWebLines(venues) {
  const pts = [];
  const seen = new Set();
  for (const v of venues) {
    if (v.lat == null || v.lng == null || seen.has(v.venue)) continue;
    seen.add(v.venue);
    pts.push([v.lat, v.lng, v.venue]);
  }
  if (pts.length < 2) return [];

  const n = pts.length;
  const added = new Set();
  const result = [];
  const dmat = Array.from({ length: n }, () => new Float64Array(n));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(pts[i], pts[j]);
      dmat[i][j] = d;
      dmat[j][i] = d;
    }
  }

  function addLine(i, j) {
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (added.has(key)) return;
    added.add(key);
    result.push({
      positions: [[pts[i][0], pts[i][1]], [pts[j][0], pts[j][1]]],
      venueA: pts[i][2],
      venueB: pts[j][2],
      distance: dmat[i][j],
    });
  }

  // 2 nearest per venue
  for (let i = 0; i < n; i++) {
    const sorted = Array.from({ length: n }, (_, j) => j)
      .filter(j => j !== i)
      .sort((a, b) => dmat[i][a] - dmat[i][b]);
    addLine(i, sorted[0]);
    if (sorted.length > 1) addLine(i, sorted[1]);
  }

  // MST for connectivity
  const inMst = new Uint8Array(n);
  inMst[0] = 1;
  for (let step = 1; step < n; step++) {
    let bi = -1, bj = -1, bd = Infinity;
    for (let i = 0; i < n; i++) {
      if (!inMst[i]) continue;
      for (let j = 0; j < n; j++) {
        if (inMst[j]) continue;
        if (dmat[i][j] < bd) { bd = dmat[i][j]; bi = i; bj = j; }
      }
    }
    if (bj >= 0) { addLine(bi, bj); inMst[bj] = 1; }
  }

  return result;
}

function VenueWeb({ venues, selectedVenue, theme }) {
  const webLines = useMemo(() => computeWebLines(venues), [venues]);
  const isDark = theme === "dark";
  // Force re-render on map move so polylines reposition correctly
  const [, setTick] = useState(0);
  useMapEvents({ moveend: () => setTick(t => t + 1), zoomend: () => setTick(t => t + 1) });

  const maxDist = useMemo(
    () => webLines.length === 0 ? 1 : Math.max(...webLines.map(l => l.distance)),
    [webLines]
  );

  return (
    <>
      {webLines.map((line, i) => {
        const isActive = selectedVenue &&
          (line.venueA === selectedVenue.venue || line.venueB === selectedVenue.venue);
        const ratio = line.distance / maxDist;
        const weight = isActive ? 2.5 : 0.8 + (1 - ratio) * 1.2;
        const opacity = isActive ? 0.7 : 0.25 + (1 - ratio) * 0.25;
        return (
          <Polyline
            key={`w${i}`}
            positions={line.positions}
            pathOptions={{
              color: isDark ? "#ff4b2b" : "#e8431f",
              weight,
              opacity,
              dashArray: isActive ? null : "6 4",
              lineCap: "round",
              interactive: false,
            }}
          />
        );
      })}
    </>
  );
}

function groupByVenue(events) {
  const byVenue = new Map();
  for (const e of events) {
    if (e.lat == null || e.lng == null) continue;
    let g = byVenue.get(e.venue);
    if (!g) { g = { venue: e.venue, lat: e.lat, lng: e.lng, events: [] }; byVenue.set(e.venue, g); }
    g.events.push(e);
  }
  return [...byVenue.values()].map(g => {
    const ok = g.events.filter(e => e.status === "ok").sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
    return { ...g, primary: ok[0] ?? g.events[0], okCount: ok.length, isDead: ok.length === 0 };
  });
}

export default function MapView({ events, selectedId, onSelect, theme }) {
  const venues = useMemo(() => groupByVenue(events), [events]);
  const center = useMemo(() => {
    if (!venues.length) return [19.076, 72.8777];
    let lat = 0, lng = 0;
    for (const v of venues) { lat += v.lat; lng += v.lng; }
    return [lat / venues.length, lng / venues.length];
  }, [venues]);
  const selectedEvent = events.find(e => e.id === selectedId);
  const selectedVenue = venues.find(v => v.venue === selectedEvent?.venue);

  return (
    <div className="map-layer">
      <MapContainer className="leaflet-map" center={center} zoom={12} zoomControl={false} scrollWheelZoom>
        <ThemeTiles theme={theme} />
        <FlyToSelection event={selectedVenue} />
        <VenueWeb venues={venues} selectedVenue={selectedVenue} theme={theme} />
        {venues.map(v => {
          const isActive = v.venue === selectedEvent?.venue;
          return (
            <Marker
              key={v.venue}
              position={[v.lat, v.lng]}
              icon={v.isDead ? pinIcon("dead", v.events.length) : pinIcon(isActive ? "active" : "normal", v.okCount)}
              interactive={!v.isDead}
              eventHandlers={v.isDead ? undefined : { click: () => onSelect(v.primary.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
