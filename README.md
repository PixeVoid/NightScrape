# NightScrape

A real-time interactive map of Mumbai venue events — scrape, normalize, and explore what's happening tonight across 16 venues.

🌐 **Live demo:** [https://night-scrape.vercel.app/](https://night-scrape.vercel.app/)  
📁 **Videos (demo, failure & self-heal captures):** [NightScrape drive folder](https://drive.google.com/drive/folders/18G-UuwQJ_84RJ0o-P8GagOGtVNQRER5H?usp=drive_link)  
▶️ **Demo walkthrough (≤3 min):** [YouTube demo video](https://youtu.be/exrdtAK-edY)

Built for the [Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse) hackathon, using [Bright Data Scraper Studio](https://docs.brightdata.com/datasets/scraper-studio/overview).

## Prerequisites

- Node.js and npm
- A free [Bright Data](https://brightdata.com) account (no card required) — only needed for the scraper side, not for running the frontend

## Running the app

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` (or the next free port).

## Bright Data CLI (scraper side)

No install needed — run on demand via `npx`:

```bash
npx -p @brightdata/cli bdata --version
npx -p @brightdata/cli bdata login
```

```bash
# create a scraper
npx -p @brightdata/cli bdata scraper create <URL> "<what to extract>"

# run it
npx -p @brightdata/cli bdata scraper run <COLLECTOR_ID> <URL> --pretty

# heal it after a site change
npx -p @brightdata/cli bdata scraper heal <COLLECTOR_ID> "<what changed>" --url <URL>
npx -p @brightdata/cli bdata scraper approve <COLLECTOR_ID> --url <URL>
```

## Stack

- React + Vite
- Leaflet + CARTO tiles for the map
- Bright Data Scraper Studio for the venue data

## What it does

NightScrape scrapes event listings from 16 Mumbai venues (The Habitat, Royal Opera House, NCPA, Alliance Française de Bombay, Jehangir Art Gallery, Art Mumbai, Doolally Taproom, 3 Art House, NGMA Mumbai, Experimenter Gallery, R-City Mall, Phoenix Marketcity, The Fine Arts Society, Dome India, Prithvi Theatre, St. Andrew's Auditorium) using Bright Data Scraper Studio. Each venue has a custom collector that handles its unique HTML/JS structure. The raw data is normalized into a unified contract (`{ id, venue, title, genre, date, time, lat, lng, ticketUrl, status }`) and rendered on an interactive CARTO map with venue pins connected by a spider-web network. (TARQ is also collected but currently returns only past exhibitions, so it's not shown on the live map.)

The UI features: a live Mumbai clock in the top bar, genre filter pills with live event counts and a More/Less toggle, real-time search across the event rail, a dossier panel with a countdown timer and scroll hint, spring-physics animations on cards and chips, and a theme toggle with rotating sun/moon icons. Failed scrapes are surfaced honestly — dashed pins and flagged cards — rather than hidden.

## Data

Event data lives in `src/data/events.js`, shaped as:

```js
{ id, venue, title, genre, date, time, lat, lng, ticketUrl, status, entry?, distanceKm?, sets? }
```

`status` is `"ok"` for a normal listing or `"failed"` if that venue's scrape broke — failed venues are still shown (as a dashed pin on the map and a flagged card in the lineup) rather than hidden.

## How we used Scraper Studio

We created 17 collectors in Bright Data Scraper Studio — one per venue — each targeting the venue's events/exhibitions page. Collectors extract event name, date, time, genre, ticket URL, and venue sub-location where applicable. The collector IDs are stored in our scraper scripts and run via the Bright Data CLI (`bdata scraper run <COLLECTOR_ID>`). 

When a venue changes its site structure (e.g., Doolally Taproom switched to a React-rendered calendar), we use the **self-heal loop**: `bdata scraper heal <COLLECTOR_ID> "site now uses JS calendar"` → review the AI-proposed selector fix in Studio → `bdata scraper approve` → re-run and verify. This loop is fully auditable and scored in the hackathon.

Key collectors:
- `habitat`, `royaloperahouse`, `tarq`, `ncpa`, `alliancefrancaise`, `jehangir`, `artmumbai`, `doolally` (original 8)
- `3arthouse`, `ngma`, `experimenter` (added — first batch of new venues)
- `rcity`, `phoenix`, `finearts`, `dome`, `prithvi`, `standrews` (added — Powai / Eastern Freeway / western-suburb coverage)

Raw JSON per collector lives in `scraper/*.json`; `scraper/normalize.mjs` merges them into `scraper/normalized-events.json` which the frontend imports directly.

## The self-heal moment

**Venue:** Doolally Taproom (`socialoffline.in/events`)  
**Break:** Site migrated to a React-rendered calendar — the old static-table selectors returned empty.  
**Heal:** Ran `bdata scraper heal <doolally-id> "calendar is now JS-rendered React component"` — Studio analyzed the live DOM and proposed new selectors targeting the calendar's day cells and event modals.  
**Approve:** Reviewed the diff in Studio, approved the new selectors.  
**Re-verify:** Re-ran the collector — 49 events returned, 12 with full title+date (status "ok"), rest partial (status "failed" — honest about what we couldn't parse).  

Before heal: 0 events. After heal: 49 entries, 12 fully usable. The partial data is kept and shown as "unreadable" cards so judges can see the real, unpolished output — no cherry-picking.

Two other venues hit dead ends and were documented honestly:
- NMACC (`nmacc.com/calendar/`) — CAPTCHA + JS rendering, no public API
- antiSOCIAL (`socialoffline.in`) — server returns 500, domain effectively dead

## Team

ByteMe — Sardar Patel Institute of Technology