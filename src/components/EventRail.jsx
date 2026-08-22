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
  const ok = [...events.filter((e) => e.status === "ok")].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const failed = events.filter((e) => e.status === "failed");

  return (
    <div className="rail">
      <div className="rail-count">
        <span>Upcoming lineup</span>
        <span>
          <b>{ok.length}</b> live &middot; <b>{failed.length}</b> unreadable
        </span>
      </div>
      <div className="rail-track">
        {ok.map((e) => (
          <button
            key={e.id}
            className={e.id === selectedId ? "rail-card selected" : "rail-card"}
            onClick={() => onSelect(e.id)}
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
