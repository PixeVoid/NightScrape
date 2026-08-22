// Real scraper output from 8 Mumbai venues (Bright Data Scraper Studio),
// normalized by scraper/normalize.mjs from the raw per-collector JSON in
// scraper/*.json. Re-run that script and re-copy the output here after any
// new scraper run — see scraper/venues.md for collector IDs and per-venue notes.
//
// Contract: { id, venue, title, genre, date, time, lat, lng, ticketUrl, status }
// status is "ok" for a usable listing, or "failed" if the scraped entry was
// missing a title/date (shown as a flagged card instead of being hidden).

import rawEvents from "./normalized-events.json";

export const EVENTS = rawEvents;

export const GENRES = [...new Set(EVENTS.filter((e) => e.status === "ok").map((e) => e.genre))].sort();
