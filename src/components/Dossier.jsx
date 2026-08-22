function formatTime12h(time24) {
  if (!time24) return { n: "--", u: "--" };
  const [hStr, m] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return { n: String(h), u: `start · ${period}` };
}

export default function Dossier({ event }) {
  if (!event) {
    return (
      <aside className="dossier">
        <div className="headline-copy">
          <div className="headline-eyebrow">No selection</div>
          <div className="headline-title">Pick a pin on the map, or a card below.</div>
        </div>
      </aside>
    );
  }

  const { n, u } = formatTime12h(event.time);

  return (
    <aside className="dossier">
      <div className="headline-stat">
        <div className="stat-disc">
          <span className="n">{n}</span>
          <span className="u">{u}</span>
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
      </div>

      {event.ticketUrl && (
        <a className="ticket-link" href={event.ticketUrl} target="_blank" rel="noreferrer">
          Get tickets
        </a>
      )}
    </aside>
  );
}
