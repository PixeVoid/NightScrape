function formatTime(date, time, todayStr) {
  if (!time) return "Unavailable";
  const [h, m] = time.split(":");
  let hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const clock = `${hour}:${m} ${period}`;
  return date === todayStr ? clock : `Tomorrow, ${clock}`;
}

export default function EventRail({ events, selectedId, onSelect, todayStr }) {
  const ok = events.filter((e) => e.status === "ok");
  const failed = events.filter((e) => e.status === "failed");

  return (
    <div className="rail">
      <div className="rail-count">
        <span>Tonight's lineup</span>
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
            <div className="rail-time">{formatTime(e.date, e.time, todayStr)}</div>
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
