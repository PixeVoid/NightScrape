export default function ThemeToggle({ theme, onChange }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        className={theme === "light" ? "active" : ""}
        aria-label="Light mode"
        onClick={() => onChange("light")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
        </svg>
      </button>
      <button
        className={theme === "dark" ? "active" : ""}
        aria-label="Dark mode"
        onClick={() => onChange("dark")}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.7 14.9A9 9 0 1 1 9.1 3.3a7.2 7.2 0 0 0 11.6 11.6z" />
        </svg>
      </button>
    </div>
  );
}
