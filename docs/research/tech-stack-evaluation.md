# Tech Stack Evaluation (with recommendation)

Status: research complete. Synthesizes the rendering and basemap/footprint findings into a full end-to-end stack, separated into MVP and later phases. Every choice is justified on fit for this problem (heavy 3D geospatial rendering + a low-cost crowdsourced data pipeline), not popularity.

## Recommended stack (one-line summary)

**React + `react-map-gl/maplibre`** front end, rendering company buildings as **MapLibre GL `fill-extrusion`** with height/color driven by our own data, served as a single **PMTiles** file on **Cloudflare R2**, backed by **Supabase (Postgres + PostGIS + Auth)** for the company dataset and crowdsourced submissions, with **deck.gl (`MapboxOverlay`, interleaved)** kept as a no-rewrite escape hatch for fancier 3D later. Deploy the front end on **Vercel**.

This keeps recurring cost near zero, matches the proven solo-dev template (Git City uses R3F + Supabase + Vercel + Stripe), and uses MapLibre's geographic correctness (the part Git City gives up) which is core to Capline.

## 1. 3D rendering: MapLibre fill-extrusion (not standalone Three.js, not deck.gl-first)

The decisive technical question, "can I render real footprints and override their heights from my own data," has a clean answer: **you ignore the source heights and supply your own.** Footprint geometry and height/color are decoupled. MapLibre's `fill-extrusion-height` and `-color` accept data-driven expressions, so `['get', 'capline_height']` reads any property you put on the feature ([MapLibre 3D buildings example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/), [style spec](https://maplibre.org/maplibre-style-spec/layers/)).

Two patterns:
- **Pattern A (bake, use for MVP).** Join financial data to footprints offline (DuckDB/GeoPandas), write properties (`height`, `mass`, `metric`) onto each feature, style with `['get', ...]`.
- **Pattern B (live join, add later).** Set `promoteId` on the source, push values at runtime with `map.setFeatureState()`, read with `['feature-state', 'x']`. Both `fill-extrusion-height` and `-color` support feature-state, and it is the fast path for updating many features without re-uploading geometry ([sources spec](https://maplibre.org/maplibre-style-spec/sources/), [Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)). Caveat: feature-state only applies to features in currently loaded tiles. Add this only when users toggle metric (funding vs headcount) interactively.

Why not the alternatives:
- **Standalone Three.js / R3F:** you would hand-build tiling, web-mercator projection, geocoding, basemap, label collision, and picking. The ecosystem's own bridges (`react-three-map`) exist precisely so you embed R3F inside MapLibre rather than run standalone. Justified only for a stylized non-geographic city, which contradicts the Toronto-accurate requirement. Skip for MVP.
- **deck.gl first:** excellent and higher-ceiling (1M+ items at 60fps for simple layers), but for hundreds to low thousands of curated company buildings it is not needed on day one, and MapLibre gives labels/picking/controls for free. Keep deck.gl as an additive overlay, not the foundation.

Performance verdict: for the realistic MVP scale (hundreds to low thousands of curated company footprints), MapLibre fill-extrusion is comfortably sufficient. The known fill-extrusion memory issue (900MB+ at z17) is a whole-city-OSM-at-high-zoom problem; a curated company-building set sidesteps it ([maplibre-native #4107](https://github.com/maplibre/maplibre-native/issues/4107)).

Interactivity comes from MapLibre natively: `symbol` layers for data-driven text labels, `click` + `queryRenderedFeatures` for picking, `Popup` for tooltips. No extra libraries for the MVP.

Escape hatch (no migration): when flat boxes are not enough, add `MapboxOverlay({interleaved:true})` with `ScenegraphLayer`/`SimpleMeshLayer` for GPU-instanced custom building models. Interleaved mode needs WebGL2 / `maplibre-gl@>3` and renders 3D correctly under MapLibre's labels ([deck.gl x MapLibre](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre)).

## 2. Footprints and heights

- **Overture buildings** as the generalizable base (one pipeline for every future city): ~2.6B buildings, GeoParquet on free AWS S3, downloadable by bbox (`overturemaps download --bbox=... --type=building`) ([Overture getting data](https://docs.overturemaps.org/getting-data/)).
- **City of Toronto 3D Massing** `EleZ` (LiDAR-derived heights) to backfill where Overture heights are null. License is OGL-Toronto (commercial OK, attribution only, no share-alike) ([TMU 3D Massing](https://library.torontomu.ca/gmdc/2015/01/20/toronto3dmassing/)). OPEN ITEM: the open.toronto.ca page currently shows a "Retired" flag; confirm the live dataset or its successor before depending on it (see risks doc).
- Footprint geometry from Overture/OSM is **ODbL** (attribution + share-alike on derived databases). This is the baseline obligation regardless of source.

## 3. Basemap and tiles: self-hosted PMTiles on Cloudflare R2

The cost analysis is decisive. MapTiler's and Stadia's free tiers are **non-commercial only** (and MapTiler forces a logo), so neither can legally back a product even if free to users. Self-hosting avoids this entirely:
- `tippecanoe -o capline.pmtiles buildings.geojson` produces a single-file tile archive ([felt/tippecanoe](https://github.com/felt/tippecanoe), [Protomaps create](https://docs.protomaps.com/pmtiles/create)).
- Host the one `.pmtiles` file on **Cloudflare R2** (no egress fees); MapLibre fetches HTTP byte-ranges. No tile server, no dynamic backend, near-zero standing cost. 10M tile requests/month is roughly $11 on R2 vs ~$3,600 on Google ([serverless maps cost](https://tobilg.com/serverless-maps-for-fun-and-profit)).
- For the base streets/water layer, use a Protomaps basemap build (also OSM/ODbL).

For the MVP's small curated set you can even ship raw GeoJSON as one source and move to PMTiles when it grows. MapLibre GL JS itself is BSD/free.

## 4. Geocoding: at write time only

Geocode a company address to a coordinate **once when it is added/imported**, persist it, and never geocode on page render. This makes free tiers sufficient:
- **Toronto Address Points** (One Address Repository, ~500k official points, OGL-Toronto) gives a license-clean offline geocoder for Toronto.
- **Nominatim** (self-host or public at 1 req/sec) for general use; cache results, set a User-Agent.
- **Mapbox** temporary geocoding (100k/mo free) as a fallback; note storing results long-term needs the paid Permanent product, so prefer offline/self-host.
- US Census geocoder is US-only, not applicable to Toronto.

Match coordinate to footprint with point-in-polygon (PostGIS `ST_Contains`), with a nearest-footprint fallback (`ST_Distance`) when the geocoded point lands just outside the right polygon.

## 5. Data store and backend: Supabase (Postgres + PostGIS + Auth)

- **Postgres + PostGIS** holds the `buildings` table (geometry, height, `building_id`) and the `companies` + per-metric tables (schema in `data-sourcing.md`). PostGIS provides `ST_Contains` for matching companies to buildings.
- **Multi-tenant towers** model as N companies to 1 building (`building_id` FK); on click, show a tenant list. Do not duplicate geometry per company.
- **Company data lives in the DB/API, not baked into tiles**, because it changes often. The PMTiles building layer carries `building_id`; the click handler joins to live company data via the API.
- **Supabase Auth** covers the later "claim/verify your building" flow (email-domain match) with no custom auth build. Free tier fits the bootstrapped budget; it is the same proven solo-dev backend Git City uses.
- Crowdsourced submissions land in a `pending` queue table for manual review before going live.

## 6. Hosting and ops

- **Front end:** Vercel (free tier, trivial React deploys, matches the proven template).
- **Backend/DB/Auth:** Supabase (free tier).
- **Tiles/static data:** Cloudflare R2.
- **Ingestion/refresh:** a simple scheduled job (Supabase scheduled function or a GitHub Action cron) that re-pulls Wikidata/SEC/OGL grants and regenerates tiles. Keep it a script, not a service, for the MVP.

Total expected recurring cost at MVP scale: effectively within free tiers (well under the bootstrapped ~$50/mo ceiling), plus a domain (~$17 for capline.ca).

## MVP vs later phases

**MVP (build now):**
- React + react-map-gl/maplibre; MapLibre fill-extrusion, Pattern A baked heights/colors.
- Curated Toronto footprints (Overture + 3D Massing heights) as PMTiles on R2.
- Supabase Postgres/PostGIS with company + submission schema; write-time geocoding.
- Crowdsourced submission form + manual review queue; seed via Wikidata/OGL/SEC.
- Native MapLibre labels, click popups, a 2D legend, a ranked side panel (per encoding doc).

**Later phases (defer):**
- Pattern B feature-state for interactive metric switching.
- deck.gl interleaved + instanced custom building models.
- Supabase Auth "claim/verify your building" (email-domain match) and cosmetics/monetization.
- Additional cities (the Overture + tippecanoe + R2 path generalizes; only the local height source and address geocoder are city-specific).
- Automated data refresh and conflict resolution UI.

## Flagged assumptions and uncertainties

- ASSUMPTION: MVP building count stays in the hundreds to low thousands. If it grows to whole-city context layers, re-test fill-extrusion memory and consider deck.gl/LOD.
- OPEN ITEM: verify Toronto 3D Massing live status/successor; verify Overture height completeness for Toronto (expect to backfill).
- ASSUMPTION: Supabase free tier limits (DB size, auth MAU) are adequate at launch; revisit if traction is strong.

### Sources
[MapLibre 3D buildings example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/) ·
[MapLibre style spec layers](https://maplibre.org/maplibre-style-spec/layers/) ·
[MapLibre sources spec](https://maplibre.org/maplibre-style-spec/sources/) ·
[MapLibre Map API (setFeatureState)](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) ·
[fill-extrusion memory issue #4107](https://github.com/maplibre/maplibre-native/issues/4107) ·
[deck.gl x MapLibre](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre) ·
[deck.gl performance guide](https://deck.gl/docs/developer-guide/performance) ·
[ScenegraphLayer](https://deck.gl/docs/api-reference/mesh-layers/scenegraph-layer) ·
[react-three-map](https://github.com/RodrigoHamuy/react-three-map) ·
[Overture getting data](https://docs.overturemaps.org/getting-data/) ·
[Overture buildings guide](https://docs.overturemaps.org/guides/buildings/) ·
[Toronto 3D Massing (TMU)](https://library.torontomu.ca/gmdc/2015/01/20/toronto3dmassing/) ·
[open.toronto.ca 3D Massing](https://open.toronto.ca/dataset/3d-massing/) ·
[Toronto Address Points](https://open.toronto.ca/dataset/address-points-municipal-toronto-one-address-repository/) ·
[felt/tippecanoe](https://github.com/felt/tippecanoe) ·
[Protomaps PMTiles create](https://docs.protomaps.com/pmtiles/create) ·
[Protomaps + MapLibre](https://docs.protomaps.com/pmtiles/maplibre) ·
[Serverless maps cost analysis](https://tobilg.com/serverless-maps-for-fun-and-profit) ·
[MapTiler pricing](https://www.maptiler.com/cloud/pricing/) ·
[Stadia pricing](https://stadiamaps.com/pricing/) ·
[Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) ·
[git-city stack (CLAUDE.md)](https://github.com/srizzon/git-city/blob/main/CLAUDE.md)
