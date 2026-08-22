# Stagelight — Scraper Progress (Person A)

## Collector ID
c_mt44cnhrgp7fwqbl4

## Working / clean data
- Prithvi Theatre — https://prithvitheatre.org — DROPPED (see below)
- The Habitat — https://indiehabitat.com — clean (2 events missing date/venue field — minor gap)
- Royal Opera House — https://www.royaloperahouse.in/upcoming-shows/ — clean

## Blocked — same root cause, heal in progress
Issue: collector's schema waits for a BookMyShow ticket-link selector (learned from Habitat),
times out on sites that don't sell tickets via BookMyShow.
- NCPA — https://www.ncpamumbai.com/event-calendar/ — heal attempted, timed out at 600s,
  server-side job may still be processing (409 another refactor job in progress on retry)
- TARQ — https://www.tarq.in/exhibitions/ — same timeout, blocked by NCPA heal lock
- Chemould Prescott Road — https://www.gallerychemould.com/exhibitions/ — same timeout
- Chatterjee and Lal — https://chatterjeeandlal.com/shows/ — same timeout (correct URL now)

## Dropped permanently — do not retry
- Prithvi Theatre — repeated 404 (crawler blocked, real site confirmed reachable elsewhere)
- CSMVS — repeated 404, same pattern as Prithvi (backup only)
- G5A Foundation — Bright Data policy block (Philanthropy/Non-Profit classification)
- Shanmukhananda Hall — Bright Data policy block (Streaming Media classification)

## Not yet attempted
- Alliance Francaise de Bombay — https://bombay.afindia.org/events/categories/culture/
- antiSOCIAL / Khar Social — https://socialoffline.in/socialoffline-events/
- Jehangir Art Gallery — https://www.jehangirartgallery.com
- Nehru Centre — https://www.nehrucentremumbai.in/whats-on/
- NMACC (JS-heavy, heal candidate) — https://nmaccindia.com/whats-on
- Doolally Taproom (JS-heavy, heal candidate) — https://doolally.in/web/events

## Next steps
1. Retry NCPA heal once 409 lock clears
2. Once NCPA heals, re-run TARQ / Chemould / Chatterjee and Lal
3. Clear remaining untried static sites above
4. Do the real JS-heavy heal demo on NMACC or Doolally (screen-record)
5. Build failed source reporting for dropped sites
