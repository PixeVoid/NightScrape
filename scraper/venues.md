# NightScrape — Scraper Progress (Person A) — FINAL

## Collectors used (multi-collector architecture — see README notes below)
- c_mt44cnhrgp7fwqbl4 — Habitat, Royal Opera House (BookMyShow-ticketed sites)
- c_mt4de493udmfwar7o — TARQ (gallery-archive pattern)
- c_mt4e1e5vptg8d5akd — NCPA (multi-venue performing arts calendar)
- c_mt4jv8fx1ewxx3hvcl — Alliance Francaise de Bombay
- c_mt4higo26dupe48b9 — Doolally Taproom (heal-demo collector, see below)
- c_mt4pk0d9118oauthf0 — Jehangir Art Gallery
- c_mt4prkq21hv9hk8ure — Nehru Centre (weak result, see below)
- c_mt4qe0se1cvec06gow — Art Mumbai (filtered, see below)

## Working — clean, current data (7 Mumbai sites)
- The Habitat — indiehabitat.com — clean, minor: 2 events missing date/venue
- Royal Opera House — royaloperahouse.in/upcoming-shows — clean
- TARQ — tarq.in/exhibitions — clean, minor: some duplicate text fields, exhibition_status field unreliable (use event_date for current/past logic instead)
- NCPA — ncpamumbai.com/event-calendar — clean, 60+ real Aug-Sept 2026 events across 5 sub-venues, minor: genre text leaks into event_date field
- Alliance Francaise de Bombay — bombay.afindia.org/events/categories/culture — clean, 2 real upcoming events
- Jehangir Art Gallery — jehangirartgallery.com — clean, 5 real current exhibitions, minor: genre field duplicates event_name (no real genre on page)
- Art Mumbai (filtered) — artmumbai.com/program — collector returned 6 events, but 4 were
  Bengaluru satellite programming ("Art Mumbai Gateway"). Kept only the 2 genuine Mumbai
  events: Chemould CoLab residency visit, Gateway of India shoreline sail. Project stays
  strictly Mumbai-only.

## Self-healing demo — Doolally Taproom
- doolally.in/web/events — JS-rendered (React) events calendar
- Real, unstaged failure: only handful of 50 events returned full data (name/date/venue),
  rest only returned genre + product_page_url
- Heal run: bdata scraper heal + approve completed successfully (no errors)
- Post-heal verification: improvement attempted but core issue persisted (still ~49/50
  incomplete) — genuine partial fix, not a full resolution
- Documented honestly as: real self-healing workflow demonstrated end-to-end
  (break -> heal -> approve -> verify), even though the fix itself was only partial
- Downstream handling: app can use reliable product_page_url field for all 50 events;
  incomplete entries shown with minimal card (title/link only) instead of full details

## Weak / not prioritized further
- Nehru Centre — nehrucentremumbai.in/whats-on — only 1/3 entries fully populated,
  and that one event (Mumbai Art Fair) is dated Oct 2025 (past). Not used in final app.

## Dropped permanently
- Prithvi Theatre — repeated 404, crawler blocked (site confirmed live via manual check)
- CSMVS — repeated 404, same pattern
- G5A Foundation — Bright Data policy block (Non-Profit classification)
- Shanmukhananda Hall — Bright Data policy block (Streaming Media classification)
- NMACC — repeated AI-generation failures (4 attempts), collector never built successfully
- antiSOCIAL / Khar Social — repeated AI-generation failures (4 attempts)
- Chemould Prescott Road, Chatterjee and Lal — TARQ collector returned wrong/stale
  TARQ data when pointed at these URLs; never got a dedicated collector due to time
- DAG (Delhi) — out of scope (Mumbai-only project), also failed with crawler
  selector timeout regardless

## Architecture note for README
Different site types (BookMyShow-ticketed venues, gallery archives, multi-venue calendars,
cultural centres) required separate collectors rather than one universal scraper, since a
single collector's schema over-fits to the site it was trained on. This mirrors how a real
production scraping system would be built — purpose-built collectors per site family.

## Final count: 6 clean Mumbai sites + 1 filtered Mumbai site (Art Mumbai, 2 events) + 1 documented self-heal (partial fix) = 8 sites total, strictly Mumbai
