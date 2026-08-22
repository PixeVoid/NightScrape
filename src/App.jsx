import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";
import GenreFilter from "./components/GenreFilter";
import Dossier from "./components/Dossier";
import EventRail from "./components/EventRail";
import ThemeToggle from "./components/ThemeToggle";
import { EVENTS, GENRES } from "./data/events";
import "./App.css";

const CITY_NAME = "Mumbai";
const TODAY = new Date().toISOString().slice(0, 10);

function getInitialTheme() {
  try {
    const saved = localStorage.getItem("stagelight-theme");
    if (saved) return saved;
  } catch {
    // ignore storage access errors
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function formatMumbaiTime() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [activeGenres, setActiveGenres] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(() => EVENTS.find((e) => e.status === "ok")?.id ?? null);
  const [mumbaiTime, setMumbaiTime] = useState(formatMumbaiTime);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("stagelight-theme", theme);
    } catch {
      // ignore storage access errors
    }
  }, [theme]);

  useEffect(() => {
    const id = setInterval(() => setMumbaiTime(formatMumbaiTime), 1000);
    return () => clearInterval(id);
  }, []);

  function toggleGenre(genre) {
    if (genre === null) {
      setActiveGenres(new Set());
      return;
    }
    setActiveGenres((prev) => {
      const next = new Set(prev);
      next.has(genre) ? next.delete(genre) : next.add(genre);
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (activeGenres.size === 0) return EVENTS;
    return EVENTS.filter((e) => e.status === "failed" || activeGenres.has(e.genre));
  }, [activeGenres]);

  const selectedEvent = filtered.find((e) => e.id === selectedId) ?? filtered.find((e) => e.status === "ok");

  const liveVenueCount = new Set(EVENTS.filter((e) => e.status === "ok").map((e) => e.venue)).size;
  const totalVenueCount = new Set(EVENTS.map((e) => e.venue)).size;

  const okEvents = filtered.filter((e) => e.status === "ok");
  const hasNoOkResults = activeGenres.size > 0 && okEvents.length === 0;

  return (
    <div className="stage">
      <MapView events={filtered} selectedId={selectedEvent?.id} onSelect={setSelectedId} theme={theme} />

      <header className="topbar fade">
        <div className="brand">
          Night<span>Scrape</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-meta">
            <span>{CITY_NAME}</span>
            <span>&middot;</span>
            <span className="mumbai-clock">{mumbaiTime}</span>
            <span>&middot;</span>
            <span>
              <b>{liveVenueCount}</b> / {totalVenueCount} venues tracked live
            </span>
          </div>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </header>

      <div className="fade fade-2">
        <GenreFilter genres={GENRES} active={activeGenres} onToggle={toggleGenre} totalEvents={EVENTS} />
      </div>

      {hasNoOkResults ? (
        <div className="fade fade-2 empty-state">
          <div className="empty-content">
            <span className="empty-icon" aria-hidden="true">🔍</span>
            <p>No live events match your filter</p>
            <button className="empty-reset" onClick={() => setActiveGenres(new Set())}>
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="fade fade-2">
            <Dossier event={selectedEvent} />
          </div>
          <div className="fade fade-3">
            <EventRail events={filtered} selectedId={selectedEvent?.id} onSelect={setSelectedId} todayStr={TODAY} />
          </div>
        </>
      )}
    </div>
  );
}
