# Capline: Setup and Live Verification

This repo contains the verified core (encoding logic + data-pipeline parsers, all unit-tested) and a compile-only UI layer (it typechecks and builds, but has not been run against a live map or database). This guide takes it from "builds" to "runs live." It assumes a Mac/Linux dev machine with Node 22+.

Status legend: [DONE] verified in CI sandbox, [LIVE] needs your accounts/browser to verify.

## 0. Prerequisites to install locally

These are not in the CI sandbox, so install them on your machine:
- `tippecanoe` (https://github.com/felt/tippecanoe) for building PMTiles.
- `ogr2ogr` (GDAL) for loading footprints into Postgres.
- `overturemaps` Python CLI: `pip install overturemaps`.
- `supabase` CLI (https://supabase.com/docs/guides/cli) OR a hosted Supabase project.
- `tsx` to run the TS pipeline: `npm i -g tsx` (or `npx tsx`).
- An S3-compatible CLI (`aws` or `rclone`) configured for Cloudflare R2.

## 1. Install and run the app shell [LIVE]

```bash
npm install
cp .env.example .env     # then fill in values as you create services below
npm run dev              # app shell loads; map needs tiles (step 4) to show buildings
npm test                 # 20 unit tests, should pass  [DONE]
npm run build            # production build, should succeed  [DONE]
```

## 2. Create Supabase + apply schema [LIVE]

1. Create a Supabase project (free tier). Copy the project URL and anon key into `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and the Postgres connection string
   into `DATABASE_URL`.
2. Apply migrations (they enable PostGIS and create the tables + the ranking view):
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_company_funding_view.sql`
   Via CLI: `supabase db push` (or run the SQL in the Supabase SQL editor).
3. Note on Row Level Security: enable RLS and add policies before launch. At minimum:
   public read on `companies`/`metric_records`/`buildings`/`company_funding`, insert-only
   on `submissions`, and NO public access to update `submissions` (the review action must
   move server-side; see step 7).

## 3. Seed the data and load footprints [LIVE]  (plan Task 13)

This is the step the sandbox could not run. Implement `pipeline/run-seed.ts` as outlined in
the plan (the parsers it calls are done and tested):
1. Footprints: `overturemaps download --bbox=-79.42,43.63,-79.36,43.67 -f geojson --type=building -o fp.geojson`
   (start with a small downtown bbox), then `ogr2ogr` it into a `buildings_raw` table and
   INSERT into `buildings(id, geom, height_m)`. Backfill `height_m` from Toronto 3D Massing
   `EleZ` via a spatial join. FIRST confirm 3D Massing is still published
   (open.toronto.ca shows a "Retired" flag); fallback is Overture/OSM `building:levels`.
2. Companies: `[...await fetchToronto(), ...parseGrants(readFileSync(grantsCsv))]` plus any
   SEC `parseRevenue` for public Toronto firms. RUN the Wikidata query first to confirm
   Toronto coverage (open question in the spec).
3. Geocode missing coords with `geocode()` (respect Nominatim 1 req/sec; sleep ~1100ms).
4. Upsert `companies` + `metric_records`. Run `pipeline/sql/002_match.sql` to assign
   `building_id` (point-in-polygon + nearest fallback).  NOTE: `002_match.sql` is referenced
   by the plan but not yet written; write it from the plan's Task 13 SQL block.
5. Export companies joined to buildings, mapping each via `toFeatureProps()`, to `seed.geojson`.

## 4. Build and upload tiles [LIVE]  (plan Task 14)

```bash
bash pipeline/build-tiles.sh seed.geojson capline.pmtiles   # needs tippecanoe
# set R2_ENDPOINT and R2_BUCKET in your shell to auto-upload, or upload manually:
aws s3 cp capline.pmtiles s3://$R2_BUCKET/capline.pmtiles --endpoint-url $R2_ENDPOINT
```
Put the public R2 URL into `.env` as `VITE_PMTILES_URL` (and `PMTILES_URL`). Confirm range
requests work (MapLibre needs HTTP 206):
`curl -sI -H "Range: bytes=0-99" "$PMTILES_URL" | grep -i "206\|content-range"`.

## 5. Verify the map in a browser [LIVE]

`npm run dev`, open the app. Expected: dark Toronto base, company buildings extruded at
varying heights/colors at correct locations; clicking one shows the readout with sources;
the legend and rank panel render; "Compare View" flattens to top-down. Swap the placeholder
basemap (`MAP_STYLE` in `src/map/MapView.tsx`) for a self-hosted Protomaps dark style.

## 6. Known compile-only gaps to confirm when wiring live

- `MapView.tsx`: the `vector` source `source-layer` must match the tippecanoe layer name
  (`-l companies`, so `"source-layer": "companies"` in `src/map/layers.ts`). Confirm the
  buildings carry a `companyId` property in the tiles (added during export in step 3).
- `getCompany`/`topByFunding` were written against the schema in this repo; verify the
  `metric_records(*)` embed and the `company_funding` view return the expected shapes.
- `react-map-gl` v8 `MapRef.getMap().easeTo(...)` powers the Compare toggle; verify the
  camera transition behaves.
- The buildings currently extrude as their real footprint at the data-driven height; the
  headcount->footprint scaling (`footprintScale` is baked but not yet applied to geometry)
  is a later enhancement, not wired into the tiles yet.

## 7. Before any real launch (compliance + safety)  (plan Task 20 done; these are operational)

- Move the `/review` approval action to a server route or Supabase Edge Function. The current
  page is a client-side `?secret=` gate only (auth is a non-goal for the MVP, but writes must
  not be client-trusted). Implement the `approve_submission` logic (plan Task 19 step 1).
- Confirm the attribution footer, accuracy disclaimer, terms, privacy, and a working
  correction/takedown contact are all live (see `docs/research/risks-and-open-questions.md`
  "Minimal launch compliance checklist").

## 8. Deploy [LIVE]  (plan Task 21)

1. Deploy the frontend to Vercel; set the `VITE_*` env vars in the Vercel project.
2. Apply migrations to the production Supabase project; run the seed + tile build + R2 upload
   against production.
3. Smoke-test the live URL end to end.
4. Buy `capline.ca` (confirm the name first) and attach it to Vercel.

## What is already verified [DONE]

- `npm test` (20 unit tests): encoding scales, legend, provenance precedence + domain-verify
  confidence, and the pipeline parsers (Wikidata, OGL grants, SEC EDGAR, address normalize,
  feature baking).
- `npx tsc --noEmit` clean and `npm run build` succeeds for the whole app including the UI.
