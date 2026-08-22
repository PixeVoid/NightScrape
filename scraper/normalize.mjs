// Converts the raw per-collector scraper output in scraper/*.json into the
// app's event contract (src/data/events.js shape). Run: node scraper/normalize.mjs
// Each collector has a different field shape (event_name vs exhibition_name,
// date vs event_date vs exhibition_date, etc) because each site needed its
// own collector — this is the "translation layer" between that and the UI.

import { readFileSync, writeFileSync } from "node:fs";

// Approximate coordinates per venue (none of the scraped data includes lat/lng).
const VENUE_COORDS = {
  "The Habitat": [19.0596, 72.8295],
  "Royal Opera House": [18.9578, 72.8302],
  "TARQ": [18.9354, 72.8347],
  "NCPA": [18.9276, 72.8234],
  "Alliance Française de Bombay": [19.0822, 72.837],
  "Jehangir Art Gallery": [18.9276, 72.832],
  "Art Mumbai": [18.922, 72.8347],
  "Doolally Taproom": [19.0552, 72.8407],
};

function firstNonEmpty(...vals) {
  for (const v of vals) if (v && String(v).trim()) return String(v).trim();
  return null;
}

// Several TARQ fields came back with the whole value duplicated verbatim
// (e.g. "Wasteland | Curated Wasteland | Curated") — a scraper artifact,
// not real data. Collapse "X X" back down to "X" when that's exactly what happened.
function dedupeRepeatedText(s) {
  if (!s) return s;
  const str = String(s).trim();
  const half = str.length / 2;
  if (Number.isInteger(half)) {
    const a = str.slice(0, half).trim();
    const b = str.slice(half).trim();
    if (a && a === b) return a;
  }
  return str;
}

const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

// Very rough date parser for the wildly inconsistent date strings scraped —
// three formats seen in practice: "DD Month YYYY" (NCPA/TARQ), "Month DD, YYYY"
// (Jehangir/Art Mumbai), and "DD/MM/YY" (Alliance Française). Returns an ISO
// date if it can find one, otherwise null (kept as "unknown date" rather than guessed).
function extractDate(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c);

    // "DD Month YYYY" — e.g. "27 August 2026"
    let m = s.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{4})/i);
    if (m) return `${m[3]}-${MONTHS[m[2].toLowerCase().slice(0, 3)]}-${m[1].padStart(2, "0")}`;

    // "Month DD, YYYY" — e.g. "August 17, 2026"
    m = s.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})/i);
    if (m) return `${m[3]}-${MONTHS[m[1].toLowerCase().slice(0, 3)]}-${m[2].padStart(2, "0")}`;

    // "DD/MM/YY" — e.g. "01/08/26"
    m = s.match(/\b(\d{2})\/(\d{2})\/(\d{2})\b/);
    if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
  }
  return null;
}

function extractTime(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c);
    const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/);
    if (m) {
      let h = parseInt(m[1], 10);
      if (/pm/i.test(m[3]) && h !== 12) h += 12;
      if (/am/i.test(m[3]) && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${m[2]}`;
    }
  }
  return null;
}

// NCPA is one physical complex with several named halls; the scraper picked
// up hall names as "venue" per event. Keep the hall name in the title context
// but pin all of them at the same NCPA coordinates rather than scattering pins
// across a dozen near-duplicate spots. Reject venue values that are actually
// leaked date/time strings (a real scraper data-quality issue, not a place).
function looksLikeDateOrTime(s) {
  return /\d{1,2}\s*(am|pm)\b/i.test(s) || /\d{4}/.test(s) || s.length > 60;
}

function loadRaw(name) {
  return JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url), "utf8"));
}

function makeEvent({ idPrefix, i, venue, title, genre, date, time, ticketUrl, coords, complete }) {
  // A listing only counts as "ok" if it has a real title AND a real date —
  // the UI shows date/time as the primary sort key, so a title-only or
  // date-only entry isn't usable even if the per-venue block thought it was.
  const usable = complete && !!title && !!date;
  return {
    id: `${idPrefix}${i}`,
    venue,
    title: title || `${venue} — listing`,
    genre: genre || "Other",
    date: date || null,
    time: time || null,
    lat: coords[0],
    lng: coords[1],
    ticketUrl: ticketUrl || null,
    status: usable ? "ok" : "failed",
  };
}

const out = [];

// --- Habitat (BookMyShow-ticketed comedy club) ---
loadRaw("habitat").forEach((e, i) => {
  const complete = !!(e.event_name && e.time);
  out.push(makeEvent({
    idPrefix: "habitat-", i,
    venue: "The Habitat",
    title: e.event_name,
    genre: e.genre || "Comedy",
    date: extractDate(e.date),
    time: extractTime(e.time),
    ticketUrl: e.ticket_link || e.product_page_url,
    coords: VENUE_COORDS["The Habitat"],
    complete,
  }));
});

// --- Royal Opera House ---
loadRaw("royaloperahouse").forEach((e, i) => {
  out.push(makeEvent({
    idPrefix: "roh-", i,
    venue: "Royal Opera House",
    title: e.event_name,
    genre: e.genre || "Theatre",
    date: extractDate(e.date),
    time: extractTime(e.time),
    ticketUrl: e.ticket_link || e.product_page_url,
    coords: VENUE_COORDS["Royal Opera House"],
    complete: !!(e.event_name && e.date),
  }));
});

// --- TARQ (gallery — many past exhibitions, keep only non-past) ---
loadRaw("tarq")
  .filter((e) => !String(e.exhibition_status || "").includes("Past exhibition"))
  .forEach((e, i) => {
    out.push(makeEvent({
      idPrefix: "tarq-", i,
      venue: "TARQ",
      title: dedupeRepeatedText(firstNonEmpty(e.exhibition_name, e.exhibition_subtitle)),
      genre: "Art",
      date: extractDate(dedupeRepeatedText(e.exhibition_date)),
      time: null,
      ticketUrl: e.product_page_url,
      coords: VENUE_COORDS["TARQ"],
      complete: !!e.exhibition_name,
    }));
  });

// --- NCPA (one complex, several halls — pin all at NCPA, hall name kept in title) ---
loadRaw("ncpa").forEach((e, i) => {
  const rawVenue = e.venue && !looksLikeDateOrTime(e.venue) ? e.venue : null;
  const complete = !!(e.event_name && rawVenue);
  const title = rawVenue && rawVenue !== "NCPA" ? `${e.event_name} — ${rawVenue}` : e.event_name;
  out.push(makeEvent({
    idPrefix: "ncpa-", i,
    venue: "NCPA",
    title,
    genre: e.genre || "Performing Arts",
    date: extractDate(e.event_date, e.event_time),
    time: extractTime(e.event_time),
    ticketUrl: e.product_page_url,
    coords: VENUE_COORDS["NCPA"],
    complete,
  }));
});

// --- Alliance Française ---
loadRaw("alliancefrancaise").forEach((e, i) => {
  out.push(makeEvent({
    idPrefix: "af-", i,
    venue: "Alliance Française de Bombay",
    title: e.event_name,
    genre: e.genre || "Culture",
    date: extractDate(e.event_date),
    time: extractTime(e.event_time),
    ticketUrl: e.product_page_url,
    coords: VENUE_COORDS["Alliance Française de Bombay"],
    complete: !!(e.event_name && e.event_date),
  }));
});

// --- Jehangir Art Gallery (one complex, several halls; genre field duplicates title, drop it) ---
loadRaw("jehangir").forEach((e, i) => {
  const hall = e.venue && e.venue !== "Jehangir Art Gallery" ? e.venue : null;
  const title = hall ? `${e.event_name} — ${hall}` : e.event_name;
  out.push(makeEvent({
    idPrefix: "jehangir-", i,
    venue: "Jehangir Art Gallery",
    title,
    genre: "Art",
    date: extractDate(e.date),
    time: null,
    ticketUrl: e.product_page_url,
    coords: VENUE_COORDS["Jehangir Art Gallery"],
    complete: !!(e.event_name && e.date),
  }));
});

// --- Art Mumbai (already filtered to Mumbai-only by Person A) ---
loadRaw("artmumbai").forEach((e, i) => {
  out.push(makeEvent({
    idPrefix: "artmumbai-", i,
    venue: "Art Mumbai",
    title: e.event_name,
    genre: "Art",
    date: extractDate(e.date),
    time: extractTime(e.time),
    ticketUrl: e.product_page_url,
    coords: VENUE_COORDS["Art Mumbai"],
    complete: !!(e.event_name && e.date),
  }));
});

// --- Doolally Taproom: THE SELF-HEAL DEMO VENUE ---
// Real, honest partial fix: most entries only have product_page_url + genre.
// Keep every entry, mark complete only if it has a real title.
loadRaw("doolally").forEach((e, i) => {
  const complete = !!(e.event_name);
  out.push(makeEvent({
    idPrefix: "doolally-", i,
    venue: "Doolally Taproom",
    title: e.event_name,
    genre: e.genre === "🎉 Event" ? "Workshop" : e.genre,
    date: extractDate(e.event_date, e.date),
    time: extractTime(e.event_time, e.time),
    ticketUrl: e.product_page_url,
    coords: VENUE_COORDS["Doolally Taproom"],
    complete,
  }));
});

const ok = out.filter((e) => e.status === "ok");
const failed = out.filter((e) => e.status === "failed");

console.log(`Normalized ${out.length} total: ${ok.length} ok, ${failed.length} failed/incomplete`);
console.log("By venue:", Object.fromEntries(
  [...new Set(out.map((e) => e.venue))].map((v) => [v, out.filter((e) => e.venue === v).length])
));

writeFileSync(new URL("./normalized-events.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("Wrote scraper/normalized-events.json");
