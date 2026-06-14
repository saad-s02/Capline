# Capline: Spec

Working name: Capline (market cap + skyline). Domain: capline.ca (recommended; see naming check). Date: 2026-06-13.

This spec is the agreed concept, the MVP scope, and explicit non-goals. It is grounded in the five research docs under `docs/research/`. Assumptions are flagged inline.

## 1. Concept

A geographically accurate 3D map of Toronto where every company is a building, and the building's geometry encodes the company's financial weight instead of arbitrary architecture. The skyline becomes a walkable 3D bar chart of economic activity, each company at its real address.

It combines the proven loop of Build 416 (founders put their company on a Toronto map) with the proven appeal of Git City (an entity's stats rendered as a 3D building), and adds the thing neither does together: financial weight encoded into a real-geography skyline.

## 2. Who it is for and the core job

Primary audience: founders and the local Toronto tech ecosystem.

Primary job: "Show me (and let me show others) where the money and momentum are in Toronto tech, as a place I can explore, with my own company on it."

The growth loop is the Build 416 loop: founders want their company on the map, submit it, and share it. The retention/virality hook is the skyline itself (a beautiful, legible economic map worth returning to and sharing).

## 3. The core experience (MVP)

A visitor lands on a dark "night city" 3D map of Toronto. Buildings for known companies rise from their real footprints, sized and lit by financial data. The visitor can:
- Orbit/pan/zoom the city (with constrained pitch/zoom and a few camera presets).
- Hover or click a building to see a readout: company name, funding, valuation, revenue, headcount, each with its source and date and a confidence/"self-reported" marker.
- Read a persistent 2D legend (height ladder, color ramp, footprint key) and a ranked side panel ("Top by funding").
- Switch to an orthographic top-down "compare mode" camera.
- Submit a company (or a correction) via a form, which enters a manual review queue.

## 4. Visual encoding (from `encoding-and-design.md`)

| Metric | Channel | Scale | Notes |
|---|---|---|---|
| Funding raised | Building height | `scalePow().exponent(0.3).clamp(true)`; log toggle later | Headline metric; floor ~3 stories so $0 is still a visible building; capped max |
| Headcount | Footprint area / mass | `scaleSqrt` (value to area) | Least precise read on the weakest channel; ~0.6x to ~1.6x of real footprint |
| Valuation | Color brightness | `scaleSequential`, viridis/cividis | Colorblind-safe; lightness survives all CVD types |
| Revenue | Emissive lit-window intensity | thresholded | "Lights on = has revenue"; coarse but intuitive |

Legibility scaffolding is non-negotiable because 3D wrecks precise comparison: hover/click numeric readouts, persistent 2D legend, ranked side panel, orthographic compare-mode camera, constrained camera. Real OSM/Overture footprints are kept (the thing that makes it a city, not a generic bar chart) with height overridden from data; a normalized abstract pad is used only when a company has no usable footprint.

ASSUMPTION: funding-to-height as the headline matches the founder audience. Flag to confirm.

## 5. Data strategy (from `data-sourcing.md`)

- **Primary intake:** crowdsourced self-submission (name, website, dropped map pin, funding stage bucket, optional amounts, headcount range, submitter email), gated by a manual review queue.
- **Seed (before crowdsourcing gains momentum):** Wikidata SPARQL (CC0) for Toronto-HQ companies, Canada Open Government grants/IRAP CSV (OGL) filtered to Toronto, SEC EDGAR company facts for the few public/cross-listed Toronto firms.
- **No scraping, no paid APIs.** LinkedIn/Crunchbase/PitchBook excluded on ToS grounds; SEDAR+ is manual reference only (restrictive site ToS).
- **Provenance per field:** each metric stores value/range, currency, as_of_date, source_type, source_url, confidence, last_verified_at. Conflicts resolved by a display precedence (regulatory > government > domain-verified self-report > Wikidata > press > unverified). Missing data renders at a baseline size with an explicit "unknown" treatment; a `weight_basis` field keeps the map honest.

## 6. Architecture (from `tech-stack-evaluation.md`)

- **Front end:** React + `react-map-gl/maplibre` (Vite).
- **Render:** MapLibre GL `fill-extrusion`, height/color driven by baked feature properties (Pattern A) for the MVP.
- **Footprints/heights:** Overture buildings (generalizable) backfilled with Toronto 3D Massing `EleZ` heights; served as a single PMTiles file (tippecanoe) on Cloudflare R2.
- **Data store/backend:** Supabase (Postgres + PostGIS + Auth-ready). PostGIS `ST_Contains` matches geocoded company points to footprints (nearest-footprint fallback). Multi-tenant towers modeled as N companies to 1 building.
- **Geocoding:** at write time only (Toronto Address Points offline, or Nominatim), never on page render.
- **Hosting:** Vercel (front end), Supabase (DB/API), Cloudflare R2 (tiles). Expected recurring cost within free tiers.
- **Escape hatch (later):** deck.gl `MapboxOverlay` interleaved + instanced custom models, with no rewrite.

## 7. MVP scope (what ships)

1. 3D Toronto map (MapLibre, dark style) rendering a curated seed of company buildings with data-driven height/color from baked properties.
2. Company + building data model in Supabase/PostGIS with per-field provenance.
3. Seed pipeline: a script that pulls Wikidata + OGL grants + SEC, geocodes, matches to footprints, and generates the PMTiles + GeoJSON.
4. Hover/click building readouts with sources, dates, and confidence markers.
5. Persistent 2D legend + ranked "Top by funding" side panel.
6. Orthographic compare-mode camera + constrained 3D camera.
7. Public "Submit a company" and "Suggest a correction" forms writing to a `pending` review queue.
8. A lightweight admin/review view (can be minimal, even SQL-backed) to approve/reject submissions.
9. Compliance basics: attribution footer (OSM + OGL-Toronto), data-accuracy disclaimer, ToS, privacy policy, takedown/correction contact.

## 8. Non-goals (explicitly out of MVP)

- No authentication, payments, or "claim/verify your building" flow (defer; monetization is "free now, monetize later").
- No cities other than Toronto (architected to generalize, not built to).
- No paid or private data sources, and no scraping of any source.
- No company logos (plain-text names only at launch).
- No interactive metric-switching via feature-state (static baked encoding first; Pattern B later).
- No deck.gl custom 3D models, no automated/scheduled data refresh service (a manual or cron script is enough), no mobile-native app.
- No social features (comments, follows), no analytics dashboards for companies.

## 9. Success criteria for the MVP

- A visitor can load the Toronto skyline, read it via the legend, and inspect any building's metrics with sources in under a few seconds of interaction.
- The seed contains a credible base of real Toronto companies (target: a few dozen to low hundreds) before any crowdsourcing.
- A founder can submit their company and, after manual approval, see it appear on the map.
- The page is legally launch-safe (attribution, disclaimer, ToS, privacy, takedown) per the compliance checklist.
- Recurring infra cost stays within free tiers (under the ~$50/mo bootstrapped ceiling).

## 10. Key assumptions (flagged)

- Superpowers methodology is followed in spirit; the plugin is now installed locally.
- MVP building count stays in the hundreds to low thousands (fill-extrusion is comfortable there).
- Wikidata yields a usable Toronto seed (dozens of firms); to be validated with an actual SPARQL query in phase 1.
- Toronto 3D Massing heights are still available (the open-data page shows a "Retired" flag; confirm or fall back to Overture/OSM levels).
- Funding-to-height is the right headline encoding for founders.
- Supabase/Vercel/R2 free tiers are adequate at launch.

## 11. Open questions to resolve during build

See `docs/research/risks-and-open-questions.md` section "Open questions to resolve early": 3D Massing live status, Overture height completeness for Toronto, Wikidata seed coverage, final name/domain purchase, multi-tenant tower UX, and confirmation of the headline metric.

## 12. Optional, clearly-labeled spike

A throwaway rendering spike (about 10 fake companies at real Toronto coordinates with data-driven heights) to prove the MapLibre fill-extrusion approach. Kept isolated under a `spike/` path, not wired into the app, and not allowed to grow into it. Included as the first optional task in the implementation plan.
