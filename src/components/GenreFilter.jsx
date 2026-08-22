import { useState } from "react";

const VISIBLE_GENRES = 5;

export default function GenreFilter({ genres, active, onToggle, totalEvents }) {
  const [expanded, setExpanded] = useState(false);

  const counts = totalEvents.reduce((acc, e) => {
    if (e.status === "ok") acc[e.genre] = (acc[e.genre] || 0) + 1;
    return acc;
  }, {});

  const visibleGenres = expanded ? genres : genres.slice(0, VISIBLE_GENRES);
  const hasMore = genres.length > VISIBLE_GENRES;
  const hiddenCount = genres.length - VISIBLE_GENRES;

  return (
    <nav className="filters" role="group" aria-label="Filter by genre">
      <button
        className={`filter-chip ${active.size === 0 ? "on" : ""}`}
        onClick={() => onToggle(null)}
        aria-pressed={active.size === 0}
      >
        All
        <span className="chip-count">
          {totalEvents.filter((e) => e.status === "ok").length}
        </span>
      </button>

      {visibleGenres.map((genre) => (
        <button
          key={genre}
          className={`filter-chip ${active.has(genre) ? "on" : ""}`}
          onClick={() => onToggle(genre)}
          aria-pressed={active.has(genre)}
        >
          {genre}
          <span className="chip-count">{counts[genre] || 0}</span>
        </button>
      ))}

      {hasMore && (
        <button
          className="filter-chip more-btn"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="genre-list"
        >
          {expanded ? `Less (−${hiddenCount})` : `More (+${hiddenCount})`}
        </button>
      )}
    </nav>
  );
}
