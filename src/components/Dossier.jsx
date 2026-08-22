import { useRef, useEffect, useState } from "react";

function formatTime12h(time24) {
  if (!time24) return { n: "--", period: null };
  const [hStr, m] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { n: `${h}:${m}`, period };
}

function getRelativeTime(dateStr, time24) {
  if (!dateStr || !time24) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = time24.split(":").map(Number);
  const eventTime = new Date(y, mo - 1, d, h, mi);
  const now = new Date();
  const diffMs = eventTime - now;
  if (diffMs <= 0) return "Started";
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function Dossier({ event }) {
  const dossierRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const el = dossierRef.current;
    if (!el) return;
    const checkOverflow = () => {
      setShowScrollHint(el.scrollHeight > el.clientHeight);
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    el.addEventListener("scroll", checkOverflow);
    return () => { ro.disconnect(); el.removeEventListener("scroll", checkOverflow); };
  }, []);

  if (!event) {
    return (
      <aside className="dossier" ref={dossierRef}>
        <div className="headline-copy">
          <div className="headline-eyebrow">No selection</div>
          <div className="headline-title">Pick a pin on the map, or a card below.</div>
        </div>
      </aside>
    );
  }

  const { n, period } = formatTime12h(event.time);
  const relative = getRelativeTime(event.date, event.time);

  return (
    <aside className="dossier" ref={dossierRef}>
      <div className="headline-stat">
        <div className="stat-disc">
          <span className="n">
            {n}
            {period && <span className="ampm">{period}</span>}
          </span>
          <span className="u">Start</span>
        </div>
        <div className="headline-copy">
          <div className="headline-eyebrow">Selected venue</div>
          <div className="headline-title">{event.title}</div>
        </div>
      </div>

      <div className="dossier-rows">
        <div className="drow">
          <span className="k">Venue</span>
          <span className="v">{event.venue}</span>
        </div>
        <div className="drow">
          <span className="k">Genre</span>
          <span className="v">{event.genre}</span>
        </div>
        <div className="drow">
          <span className="k">Entry</span>
          <span className="v">{event.entry ?? "—"}</span>
        </div>
        <div className="drow">
          <span className="k">Distance</span>
          <span className="v">{event.distanceKm != null ? `${event.distanceKm} km` : "—"}</span>
        </div>
        <div className="drow">
          <span className="k">Sets</span>
          <span className="v">{event.sets ?? "—"}</span>
        </div>
        <div className="drow">
          <span className="k">Status</span>
          <span className="v red">Confirmed</span>
        </div>
        {relative && (
          <div className="drow countdown">
            <span className="k">Starts in</span>
            <span className="v red">{relative}</span>
          </div>
        )}
      </div>

      {event.ticketUrl && (
        <a className="ticket-link" href={event.ticketUrl} target="_blank" rel="noreferrer">
          Get tickets
        </a>
      )}

      {showScrollHint && (
        <div className="dossier-scroll-hint" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </aside>
  );
}
