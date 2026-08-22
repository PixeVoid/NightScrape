# NightScrape

<!-- TODO: one or two sentence description once the real data/scraper is wired in -->

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

<!-- TODO -->

## Data

Event data lives in `src/data/events.js`, shaped as:

```js
{ id, venue, title, genre, date, time, lat, lng, ticketUrl, status, entry?, distanceKm?, sets? }
```

`status` is `"ok"` for a normal listing or `"failed"` if that venue's scrape broke — failed venues are still shown (as a dashed pin on the map and a flagged card in the lineup) rather than hidden.

## How we used Scraper Studio

<!-- TODO: what we're scraping, how the Collector ID feeds into the app -->

## The self-heal moment

<!-- TODO: which venue broke, what the fix was, before/after -->

## Team

ByteMe — Sardar Patel Institute of Technology
