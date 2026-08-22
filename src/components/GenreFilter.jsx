export default function GenreFilter({ genres, active, onToggle }) {
  return (
    <nav className="filters">
      <button className={active.size === 0 ? "filter-btn on" : "filter-btn"} onClick={() => onToggle(null)}>
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          className={active.has(genre) ? "filter-btn on" : "filter-btn"}
          onClick={() => onToggle(genre)}
        >
          {genre}
        </button>
      ))}
    </nav>
  );
}
