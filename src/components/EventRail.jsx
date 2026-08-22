import { useEffect, useRef, useState, useMemo } from "react";

function formatWhen(date, time, todayStr) {
  if (!date) return "Date TBA";

  const clock = (() => {
    if (!time) return null;
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${period}`;
  })();

  const [y, mo, d] = date.split("-").map(Number);
  const [ty, tmo, td] = todayStr.split("-").map(Number);
  const dayDiff = Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(ty, tmo - 1, td)) / 86400000);

  const dayLabel =
    dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return clock ? `${dayLabel}, ${clock}` : dayLabel;
}

export default function EventRail({ events, selectedId, onSelect, todayStr }) {
  const trackRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("this-month");

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const ok = useMemo(() => {
    const [ty, tmo, td] = todayStr.split("-").map(Number);
    const today = new Date(ty, tmo - 1, td);
    const startOfMonth = new Date(ty, tmo - 1, 1);
    const endOfMonth = new Date(ty, tmo, 0);
    const threeMonthsAgo = new Date(ty, tmo - 4, td);
    const threeMonthsAhead = new Date(ty, tmo + 2, td);

    return events
      .filter((e) => e.status === "ok" && e.date)
      .filter((e) => {
        const [y, mo, d] = e.date.split("-").map(Number);
        const ev = new Date(y, mo - 1, d);
        switch (dateRange) {
          case "last-3m": return ev >= threeMonthsAgo && ev < today;
          case "today": return ev.getFullYear() === ty && ev.getMonth() === tmo - 1 && ev.getDate() === td;
          case "this-month": return ev >= startOfMonth && ev <= endOfMonth;
          case "upcoming-3m": return ev > today && ev <= threeMonthsAhead;
          case "later": return ev > threeMonthsAhead;
          default: return true;
        }
      })
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  }, [events, dateRange, todayStr]);
  const failed = useMemo(() => events.filter((e) => e.status === "failed"), [events]);

  const filteredOk = useMemo(() => {
    if (!searchQuery.trim()) return ok;
    const q = searchQuery.toLowerCase();
    return ok.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.genre.toLowerCase().includes(q)
    );
  }, [ok, searchQuery]);

  const ranges = [
    { id: "last-3m", label: "Last 3 months" },
    { id: "today", label: "Today" },
    { id: "this-month", label: "This month" },
    { id: "upcoming-3m", label: "Upcoming 3 months" },
    { id: "later", label: "Later" },
  ];

  return (
    <div className="rail">
      <div className="rail-header">
        <div className="rail-count">
          <span>Upcoming lineup</span>
          <span>
            <b className="live-count">{filteredOk.length}</b> live &middot; <b className="failed-count">{failed.length}</b> unreadable
          </span>
        </div>
        <div className="rail-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lineup"
          />
        </div>
      </div>
      <div className="rail-pills">
        {ranges.map((r) => (
          <button
            key={r.id}
            className={`rail-pill ${dateRange === r.id ? "on" : ""}`}
            onClick={() => setDateRange(r.id)}
            aria-pressed={dateRange === r.id}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="rail-track" ref={trackRef}>
        {filteredOk.map((e, index) => (
          <button
            key={e.id}
            className={e.id === selectedId ? "rail-card selected" : "rail-card"}
            onClick={() => onSelect(e.id)}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="rail-time">{formatWhen(e.date, e.time, todayStr)}</div>
            <div className="rail-title">{e.title}</div>
            <div className="rail-venue">{e.venue}</div>
          </button>
        ))}
        {failed.map((e) => (
          <div key={e.id} className="rail-card dead">
            <div className="rail-time">Unavailable</div>
            <div className="rail-title">{e.venue}</div>
            <div className="rail-venue">Listing unreadable — rechecking</div>
          </div>
        ))}
      </div>
    </div>
  );
}
