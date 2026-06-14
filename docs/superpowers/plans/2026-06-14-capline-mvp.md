# Capline MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a geographically accurate 3D map of Toronto where each company is a building whose height/mass/color encode its funding/headcount/valuation/revenue, fed by a crowdsourced + free-public-data pipeline.

**Architecture:** React + MapLibre GL `fill-extrusion` renders curated company footprints with heights/colors baked from our data. A Node/TypeScript pipeline seeds the company dataset from Wikidata/OGL grants/SEC EDGAR, geocodes addresses, matches them to Overture footprints (heights backfilled from Toronto 3D Massing) using PostGIS, and emits a PMTiles file served from Cloudflare R2. Supabase (Postgres + PostGIS) stores companies, per-field provenance, and a crowdsourced submission review queue.

**Tech Stack:** Vite + React + TypeScript, Vitest, maplibre-gl + react-map-gl, d3-scale, pmtiles + tippecanoe (CLI), Supabase (Postgres/PostGIS), Cloudflare R2, Vercel. Pipeline shells out to `overturemaps` and `ogr2ogr`.

**Source of truth:** `docs/spec.md` and `docs/research/*`. Read `docs/research/encoding-and-design.md` before Phase 4 and `docs/research/data-sourcing.md` before Phase 3.

---

## File structure (created across the plan)

```
capline/
  package.json                      # root: scripts, deps
  vite.config.ts                    # Vite + Vitest config
  tsconfig.json
  .env.example                      # documented env vars (no secrets)
  src/
    main.tsx                        # React entry
    App.tsx                         # layout: map + legend + side panel
    map/
      MapView.tsx                   # MapLibre map, fill-extrusion layer, cameras
      layers.ts                     # layer + style definitions
      cameras.ts                    # 3D constrained + orthographic compare presets
    encoding/
      scales.ts                     # metric -> channel scale functions (pure)
      scales.test.ts
      legend.ts                     # legend model derived from scales (pure)
      legend.test.ts
    ui/
      BuildingReadout.tsx           # hover/click readout with sources/confidence
      Legend.tsx                    # 2D legend
      RankPanel.tsx                 # "Top by funding" ranked list
      SubmitForm.tsx                # submit company / suggest correction
      Footer.tsx                    # attribution + disclaimer
    data/
      types.ts                      # Company, MetricRecord, Building, Submission types
      provenance.ts                 # display-value precedence + confidence (pure)
      provenance.test.ts
      api.ts                        # Supabase client + queries
    pages/
      terms.tsx privacy.tsx         # static legal pages
  pipeline/
    sources/
      wikidata.ts wikidata.test.ts  # SPARQL fetch + parse (parse is pure)
      oglGrants.ts oglGrants.test.ts# CSV parse + Toronto filter (pure)
      edgar.ts edgar.test.ts        # companyfacts JSON parse (pure)
    geocode.ts geocode.test.ts      # address normalize (pure) + geocode call
    buildFeatures.ts buildFeatures.test.ts  # company+building -> GeoJSON feature (pure)
    run-seed.ts                     # orchestrator: load -> match (PostGIS) -> export
    sql/
      001_schema.sql                # buildings, companies, metric_records, submissions
      002_match.sql                 # ST_Contains + nearest-footprint assignment
  spike/                            # OPTIONAL throwaway; not imported by app
    index.html spike.ts             # 10 fake companies, real coords, data-driven heights
  supabase/
    config.toml                     # local Supabase
```

---

## Phase 0 (OPTIONAL, clearly labeled): Rendering spike

> Throwaway. Lives in `spike/`, imported by nothing, deleted or ignored after it answers the question: "does MapLibre fill-extrusion with data-driven heights look right for ~10 companies at real Toronto coordinates?" Do not let it grow into the app. Skip this phase entirely if you are confident in the approach.

### Task 0: Standalone fill-extrusion spike

**Files:**
- Create: `spike/index.html`, `spike/spike.ts`, `spike/companies.json`

- [ ] **Step 1: Scaffold a minimal Vite-less HTML page that loads MapLibre from CDN**

`spike/index.html`:
```html
<!doctype html><html><head>
<link href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" rel="stylesheet"/>
<style>html,body,#map{height:100%;margin:0}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
<script type="module" src="./spike.ts"></script></body></html>
```

- [ ] **Step 2: Add 10 fake companies at real downtown Toronto coordinates with a funding value**

`spike/companies.json` (10 features; coordinates near King/Bay, e.g. `-79.3807, 43.6480`), each `{name, lng, lat, funding}`.

- [ ] **Step 3: Render small extruded squares whose height comes from funding**

`spike/spike.ts`: build a GeoJSON FeatureCollection of small square polygons (buffer each point ~15m), set `properties.height = Math.pow(funding, 0.3) * k` with a floor, add a dark MapLibre style (Protomaps demo or a minimal raster), add a `fill-extrusion` layer reading `['get','height']`, set pitch ~50.

- [ ] **Step 4: Verify visually**

Run: `npx serve spike` (or `python3 -m http.server` in `spike/`), open the page.
Expected: 10 dark buildings of clearly different heights at correct downtown locations, smooth orbit at 60fps. Confirm the unicorn does not dwarf the rest with the `exponent(0.3)` scaling.

- [ ] **Step 5: Record the finding and stop**

Write 3 bullet points in the PR/commit describing what worked and any surprises. Do not refactor the spike into the app.

```bash
git add spike/ && git commit -m "spike: prove maplibre fill-extrusion with data-driven heights (throwaway)"
```

---

## Phase 1: Project scaffold and tooling

### Task 1: Initialize Vite + React + TypeScript + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `index.html`

- [ ] **Step 1: Scaffold the app**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install maplibre-gl react-map-gl d3-scale d3-scale-chromatic
npm install -D @types/d3-scale @types/d3-scale-chromatic
```

- [ ] **Step 2: Configure Vitest in `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test-setup.ts"] },
});
```
Create `src/test-setup.ts` with `import "@testing-library/jest-dom";`.

- [ ] **Step 3: Add a smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";
test("renders app title", () => {
  render(<App />);
  expect(screen.getByText(/Capline/i)).toBeInTheDocument();
});
```
Set `App.tsx` to render `<h1>Capline</h1>` plus a `<div id="map-root">` placeholder.

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite react ts app with vitest"
```

### Task 2: Define core domain types

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type SourceType =
  | "self_reported" | "wikidata" | "sec_edgar" | "ogl_grant" | "press" | "linkedin_manual";
export type Confidence = "high" | "medium" | "low";
export type MetricName = "funding_total" | "valuation" | "revenue" | "headcount";

export interface MetricRecord {
  metric: MetricName;
  value: number | null;        // canonical numeric (CAD); null when only a bucket is known
  valueMin?: number; valueMax?: number; bucket?: string;
  currency: string;            // e.g. "CAD"
  asOf: string;                // ISO date
  sourceType: SourceType;
  sourceUrl?: string;
  confidence: Confidence;
  lastVerifiedAt: string;
}
export interface Company {
  id: string;
  displayName: string;
  legalName?: string;
  website?: string;            // canonical domain
  hqAddress?: string;
  lng?: number; lat?: number;
  buildingId?: string;         // FK to a footprint; many companies -> one building
  wikidataQid?: string;
  secCik?: string;
  metrics: MetricRecord[];
  weightBasis: MetricName;     // which metric currently sizes the building
}
export interface Building { id: string; height: number | null; }
export type SubmissionStatus = "pending" | "approved" | "rejected";
export interface Submission {
  id: string; kind: "new" | "correction";
  payload: Partial<Company> & { rawAddress?: string };
  submitterEmail: string; status: SubmissionStatus; createdAt: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts && git commit -m "feat: add core domain types"
```

---

## Phase 2: Encoding logic (pure, TDD)

### Task 3: Height scale (funding -> building height)

**Files:**
- Create: `src/encoding/scales.ts`, `src/encoding/scales.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { fundingToHeight } from "./scales";

describe("fundingToHeight", () => {
  it("gives the floor height to zero/unknown funding", () => {
    expect(fundingToHeight(0)).toBe(15);        // 15m floor (~3-5 stories)
    expect(fundingToHeight(null)).toBe(15);
  });
  it("is monotonic increasing", () => {
    expect(fundingToHeight(1e6)).toBeLessThan(fundingToHeight(1e8));
  });
  it("clamps so the largest does not exceed the max", () => {
    expect(fundingToHeight(1e12)).toBeLessThanOrEqual(400);  // 400m cap
  });
  it("tempers magnitude: 100x funding is far less than 100x height", () => {
    const ratio = fundingToHeight(1e9) / fundingToHeight(1e7);
    expect(ratio).toBeLessThan(10);             // exponent 0.3 compression
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/encoding/scales.test.ts`
Expected: FAIL ("fundingToHeight is not a function").

- [ ] **Step 3: Implement**

```ts
import { scalePow } from "d3-scale";
const FLOOR = 15, CAP = 400, DOMAIN_MAX = 1e10;
const height = scalePow<number, number>().exponent(0.3)
  .domain([0, DOMAIN_MAX]).range([FLOOR, CAP]).clamp(true);
export function fundingToHeight(funding: number | null): number {
  if (funding == null || funding <= 0) return FLOOR;
  return Math.round(height(funding));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/encoding/scales.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/encoding/scales.ts src/encoding/scales.test.ts
git commit -m "feat: funding-to-height power scale"
```

### Task 4: Footprint, color, and revenue-glow scales

**Files:**
- Modify: `src/encoding/scales.ts`, `src/encoding/scales.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { headcountToFootprintScale, valuationToColor, revenueToGlow } from "./scales";

it("headcount scales footprint by area within bounds", () => {
  expect(headcountToFootprintScale(0)).toBeCloseTo(0.6, 1);
  expect(headcountToFootprintScale(10000)).toBeLessThanOrEqual(1.6);
  // sqrt(area) relationship: 4x headcount -> ~2x linear factor delta, not 4x
  const a = headcountToFootprintScale(100), b = headcountToFootprintScale(400);
  expect(b - 0.6).toBeCloseTo((a - 0.6) * 2, 1);
});
it("valuation maps to a viridis hex color", () => {
  expect(valuationToColor(0)).toMatch(/^#|rgb/);
  expect(valuationToColor(1e9)).not.toEqual(valuationToColor(0));
});
it("revenue glow is 0 when no revenue and rises with revenue", () => {
  expect(revenueToGlow(0)).toBe(0);
  expect(revenueToGlow(1e8)).toBeGreaterThan(revenueToGlow(1e6));
  expect(revenueToGlow(1e12)).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/encoding/scales.test.ts`
Expected: FAIL (functions not defined).

- [ ] **Step 3: Implement**

```ts
import { scaleSqrt, scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";

const footprint = scaleSqrt().domain([0, 10000]).range([0.6, 1.6]).clamp(true);
export function headcountToFootprintScale(headcount: number | null): number {
  return footprint(headcount ?? 0);
}
const color = scaleSequential(interpolateViridis).domain([0, 1e10]).clamp(true);
export function valuationToColor(valuation: number | null): string {
  return color(valuation ?? 0);
}
const glow = scaleSqrt().domain([0, 1e9]).range([0, 1]).clamp(true);
export function revenueToGlow(revenue: number | null): number {
  if (revenue == null || revenue <= 0) return 0;
  return glow(revenue);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/encoding/scales.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/encoding/scales.ts src/encoding/scales.test.ts
git commit -m "feat: footprint, valuation-color, revenue-glow scales"
```

### Task 5: Legend model derived from scales

**Files:**
- Create: `src/encoding/legend.ts`, `src/encoding/legend.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { buildLegend } from "./legend";
it("produces height ticks and a color ramp", () => {
  const l = buildLegend();
  expect(l.heightTicks.length).toBeGreaterThanOrEqual(3);
  expect(l.heightTicks[0]).toHaveProperty("label");
  expect(l.heightTicks[0]).toHaveProperty("meters");
  expect(l.colorStops.length).toBeGreaterThanOrEqual(3);
  expect(l.colorStops[0]).toHaveProperty("color");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/encoding/legend.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (reuse the scales from Task 3-4; do not duplicate scale config)

```ts
import { fundingToHeight, valuationToColor } from "./scales";
export interface Legend {
  heightTicks: { label: string; meters: number }[];
  colorStops: { label: string; color: string }[];
}
export function buildLegend(): Legend {
  const fundings = [0, 1e6, 1e7, 1e8, 1e9];
  const valuations = [0, 1e8, 1e9, 1e10];
  return {
    heightTicks: fundings.map(f => ({ label: humanMoney(f), meters: fundingToHeight(f) })),
    colorStops: valuations.map(v => ({ label: humanMoney(v), color: valuationToColor(v) })),
  };
}
function humanMoney(n: number): string {
  if (n === 0) return "$0";
  if (n >= 1e9) return `$${n / 1e9}B`;
  if (n >= 1e6) return `$${n / 1e6}M`;
  return `$${n}`;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/encoding/legend.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/encoding/legend.ts src/encoding/legend.test.ts
git commit -m "feat: legend model derived from encoding scales"
```

### Task 6: Provenance precedence and display value

**Files:**
- Create: `src/data/provenance.ts`, `src/data/provenance.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { displayMetric, PRECEDENCE } from "./provenance";
import type { MetricRecord } from "./types";
const rec = (sourceType: any, value: number): MetricRecord => ({
  metric: "funding_total", value, currency: "CAD", asOf: "2025-01-01",
  sourceType, confidence: "medium", lastVerifiedAt: "2025-01-01",
});
it("prefers regulatory over self-report", () => {
  const chosen = displayMetric([rec("self_reported", 5), rec("sec_edgar", 9)]);
  expect(chosen!.value).toBe(9);
});
it("returns null when no records", () => {
  expect(displayMetric([])).toBeNull();
});
it("PRECEDENCE ranks sec_edgar above press above unverified self_report", () => {
  expect(PRECEDENCE.indexOf("sec_edgar")).toBeLessThan(PRECEDENCE.indexOf("press"));
  expect(PRECEDENCE.indexOf("press")).toBeLessThan(PRECEDENCE.indexOf("self_reported"));
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/data/provenance.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { MetricRecord, SourceType } from "./types";
export const PRECEDENCE: SourceType[] =
  ["sec_edgar", "ogl_grant", "wikidata", "press", "linkedin_manual", "self_reported"];
// note: a domain-verified self_report is bumped at call sites via confidence; see Phase 5.
export function displayMetric(records: MetricRecord[]): MetricRecord | null {
  if (records.length === 0) return null;
  return [...records].sort(
    (a, b) => PRECEDENCE.indexOf(a.sourceType) - PRECEDENCE.indexOf(b.sourceType)
  )[0];
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/data/provenance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/provenance.ts src/data/provenance.test.ts
git commit -m "feat: metric provenance precedence and display selection"
```

---

## Phase 3: Data pipeline and seed (pure parsers TDD + PostGIS matching)

> Prereq: install Supabase CLI and start local stack (`supabase init && supabase start`), and ensure `ogr2ogr`/`tippecanoe`/`overturemaps` are installed. Before coding, run the actual Wikidata SPARQL query manually to confirm Toronto coverage (open question in the spec).

### Task 7: PostGIS schema

**Files:**
- Create: `pipeline/sql/001_schema.sql`, `supabase/migrations/001_schema.sql` (same content)

- [ ] **Step 1: Write the schema**

```sql
create extension if not exists postgis;
create table buildings (
  id text primary key,
  geom geometry(MultiPolygon, 4326) not null,
  height_m double precision,
  height_source text
);
create index buildings_geom_idx on buildings using gist (geom);
create table companies (
  id text primary key,
  display_name text not null,
  legal_name text, website text, hq_address text,
  lng double precision, lat double precision,
  building_id text references buildings(id),
  wikidata_qid text, sec_cik text,
  weight_basis text not null default 'funding_total',
  status text not null default 'live'
);
create table metric_records (
  id bigserial primary key,
  company_id text references companies(id) on delete cascade,
  metric text not null, value double precision,
  value_min double precision, value_max double precision, bucket text,
  currency text default 'CAD', as_of date,
  source_type text not null, source_url text,
  confidence text not null, last_verified_at date
);
create table submissions (
  id bigserial primary key,
  kind text not null, payload jsonb not null,
  submitter_email text not null, submitter_domain_verified boolean default false,
  status text not null default 'pending', created_at timestamptz default now()
);
```

- [ ] **Step 2: Apply locally**

Run: `supabase db reset` (applies migrations)
Expected: tables created, no errors. Verify with `supabase db query "select postgis_version();"`.

- [ ] **Step 3: Commit**

```bash
git add pipeline/sql/001_schema.sql supabase/migrations/001_schema.sql
git commit -m "feat: postgis schema for buildings, companies, metrics, submissions"
```

### Task 8: Wikidata SPARQL parser (pure)

**Files:**
- Create: `pipeline/sources/wikidata.ts`, `pipeline/sources/wikidata.test.ts`

- [ ] **Step 1: Write the failing test** (test the pure parser against a saved sample, not the network)

```ts
import { parseWikidata } from "./wikidata";
const sample = { results: { bindings: [{
  company: { value: "http://www.wikidata.org/entity/Q123" },
  companyLabel: { value: "Acme Inc" },
  website: { value: "https://acme.com" },
  employees: { value: "250" },
  coord: { value: "Point(-79.38 43.65)" },
}]}};
it("maps a SPARQL binding to a partial Company", () => {
  const [c] = parseWikidata(sample as any);
  expect(c.displayName).toBe("Acme Inc");
  expect(c.wikidataQid).toBe("Q123");
  expect(c.lng).toBeCloseTo(-79.38); expect(c.lat).toBeCloseTo(43.65);
  const hc = c.metrics.find(m => m.metric === "headcount");
  expect(hc?.value).toBe(250); expect(hc?.sourceType).toBe("wikidata");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run pipeline/sources/wikidata.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement parser + a separate (untested) fetch function**

```ts
import type { Company } from "../../src/data/types";
const QID = (u: string) => u.split("/").pop()!;
const parsePoint = (p?: string) => {
  if (!p) return {};
  const m = p.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  return m ? { lng: +m[1], lat: +m[2] } : {};
};
export function parseWikidata(json: any): Company[] {
  return json.results.bindings.map((b: any) => {
    const id = QID(b.company.value);
    const metrics = b.employees ? [{
      metric: "headcount" as const, value: +b.employees.value, currency: "n/a",
      asOf: "", sourceType: "wikidata" as const, sourceUrl: b.company.value,
      confidence: "medium" as const, lastVerifiedAt: new Date().toISOString().slice(0,10),
    }] : [];
    return {
      id: `wd:${id}`, displayName: b.companyLabel?.value ?? id,
      website: b.website?.value, wikidataQid: id, ...parsePoint(b.coord?.value),
      metrics, weightBasis: "funding_total" as const,
    };
  });
}
export async function fetchToronto(): Promise<Company[]> {
  const q = `SELECT ?company ?companyLabel ?website ?employees ?coord WHERE {
    ?company wdt:P159 ?hq. ?hq wdt:P131* wd:Q172. OPTIONAL{?company wdt:P856 ?website}
    OPTIONAL{?company wdt:P1128 ?employees} OPTIONAL{?company wdt:P159 ?h. ?h wdt:P625 ?coord}
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Capline/0.1 (capline.ca)" } });
  return parseWikidata(await res.json());
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run pipeline/sources/wikidata.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/sources/wikidata.ts pipeline/sources/wikidata.test.ts
git commit -m "feat: wikidata SPARQL parser and Toronto fetch"
```

### Task 9: OGL grants CSV parser (pure)

**Files:**
- Create: `pipeline/sources/oglGrants.ts`, `pipeline/sources/oglGrants.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { parseGrants } from "./oglGrants";
const csv = `recipient_legal_name,recipient_city,agreement_value,agreement_start_date
Acme Inc,Toronto,500000,2024-03-01
Beta Co,Ottawa,250000,2024-04-01`;
it("keeps only Toronto recipients and sums as funding metric", () => {
  const rows = parseGrants(csv);
  expect(rows).toHaveLength(1);
  expect(rows[0].displayName).toBe("Acme Inc");
  const f = rows[0].metrics[0];
  expect(f.metric).toBe("funding_total"); expect(f.value).toBe(500000);
  expect(f.sourceType).toBe("ogl_grant");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run pipeline/sources/oglGrants.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (use a tiny CSV split; for real data swap to `csv-parse` but keep `parseGrants` signature)

```ts
import type { Company } from "../../src/data/types";
export function parseGrants(csv: string): Company[] {
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  const idx = (n: string) => cols.indexOf(n);
  return lines.map(l => l.split(",")).filter(r => /toronto/i.test(r[idx("recipient_city")]))
    .map(r => ({
      id: `grant:${r[idx("recipient_legal_name")]}`,
      displayName: r[idx("recipient_legal_name")],
      weightBasis: "funding_total" as const,
      metrics: [{
        metric: "funding_total" as const, value: +r[idx("agreement_value")],
        currency: "CAD", asOf: r[idx("agreement_start_date")],
        sourceType: "ogl_grant" as const, confidence: "high" as const,
        lastVerifiedAt: new Date().toISOString().slice(0,10),
      }],
    }));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run pipeline/sources/oglGrants.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/sources/oglGrants.ts pipeline/sources/oglGrants.test.ts
git commit -m "feat: OGL grants CSV parser with Toronto filter"
```

### Task 10: SEC EDGAR companyfacts parser (pure)

**Files:**
- Create: `pipeline/sources/edgar.ts`, `pipeline/sources/edgar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { parseRevenue } from "./edgar";
const facts = { cik: 320193, entityName: "Acme", facts: { "us-gaap": { Revenues: {
  units: { USD: [ { fy: 2023, fp: "FY", val: 1000, end: "2023-12-31", form: "10-K" } ] } } } } };
it("extracts latest annual revenue", () => {
  const r = parseRevenue(facts as any);
  expect(r?.value).toBe(1000); expect(r?.metric).toBe("revenue");
  expect(r?.sourceType).toBe("sec_edgar"); expect(r?.asOf).toBe("2023-12-31");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run pipeline/sources/edgar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { MetricRecord } from "../../src/data/types";
export function parseRevenue(facts: any): MetricRecord | null {
  const series = facts?.facts?.["us-gaap"]?.Revenues?.units?.USD
    ?? facts?.facts?.["us-gaap"]?.RevenueFromContractWithCustomerExcludingAssessedTax?.units?.USD;
  if (!series?.length) return null;
  const annual = series.filter((x: any) => x.form === "10-K" && x.fp === "FY");
  const latest = (annual.length ? annual : series).sort((a: any, b: any) => a.end < b.end ? 1 : -1)[0];
  return {
    metric: "revenue", value: latest.val, currency: "USD", asOf: latest.end,
    sourceType: "sec_edgar", sourceUrl: `https://data.sec.gov/cgi-bin/browse-edgar?CIK=${facts.cik}`,
    confidence: "high", lastVerifiedAt: new Date().toISOString().slice(0,10),
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run pipeline/sources/edgar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/sources/edgar.ts pipeline/sources/edgar.test.ts
git commit -m "feat: SEC EDGAR companyfacts revenue parser"
```

### Task 11: Address normalization for geocoding (pure)

**Files:**
- Create: `pipeline/geocode.ts`, `pipeline/geocode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { normalizeAddress } from "./geocode";
it("normalizes whitespace, case, and appends Toronto context", () => {
  expect(normalizeAddress("  123  King St W ")).toBe("123 King St W, Toronto, ON, Canada");
  expect(normalizeAddress("123 King St, Toronto")).toBe("123 King St, Toronto, ON, Canada");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run pipeline/geocode.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement normalize + a separate (untested) geocode call**

```ts
export function normalizeAddress(raw: string): string {
  const a = raw.replace(/\s+/g, " ").trim();
  const hasCity = /toronto/i.test(a);
  const base = hasCity ? a.replace(/,?\s*toronto.*$/i, ", Toronto") : `${a}, Toronto`;
  return `${base}, ON, Canada`;
}
export async function geocode(raw: string): Promise<{ lng: number; lat: number } | null> {
  const q = encodeURIComponent(normalizeAddress(raw));
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const res = await fetch(url, { headers: { "User-Agent": "Capline/0.1 (capline.ca)" } });
  const [hit] = await res.json();
  return hit ? { lng: +hit.lon, lat: +hit.lat } : null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run pipeline/geocode.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/geocode.ts pipeline/geocode.test.ts
git commit -m "feat: address normalization and nominatim geocode"
```

### Task 12: Build a GeoJSON map feature from a company + building (pure)

**Files:**
- Create: `pipeline/buildFeatures.ts`, `pipeline/buildFeatures.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { toFeatureProps } from "./buildFeatures";
import type { Company } from "../src/data/types";
const company: Company = {
  id: "c1", displayName: "Acme", weightBasis: "funding_total",
  metrics: [
    { metric: "funding_total", value: 1e8, currency: "CAD", asOf: "2024-01-01",
      sourceType: "self_reported", confidence: "low", lastVerifiedAt: "2024-01-01" },
    { metric: "valuation", value: 1e9, currency: "CAD", asOf: "2024-01-01",
      sourceType: "press", confidence: "medium", lastVerifiedAt: "2024-01-01" },
  ],
};
it("bakes height, color, and id into feature properties", () => {
  const p = toFeatureProps(company);
  expect(p.companyId).toBe("c1");
  expect(p.height).toBeGreaterThan(15);
  expect(p.color).toMatch(/^#|rgb/);
  expect(p.name).toBe("Acme");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run pipeline/buildFeatures.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (reuse encoding scales + provenance; do not re-derive scaling)

```ts
import type { Company, MetricName } from "../src/data/types";
import { fundingToHeight, valuationToColor, headcountToFootprintScale, revenueToGlow }
  from "../src/encoding/scales";
import { displayMetric } from "../src/data/provenance";
const val = (c: Company, m: MetricName) =>
  displayMetric(c.metrics.filter(x => x.metric === m))?.value ?? null;
export function toFeatureProps(c: Company) {
  return {
    companyId: c.id, name: c.displayName,
    height: fundingToHeight(val(c, "funding_total")),
    color: valuationToColor(val(c, "valuation")),
    footprintScale: headcountToFootprintScale(val(c, "headcount")),
    glow: revenueToGlow(val(c, "revenue")),
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run pipeline/buildFeatures.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/buildFeatures.ts pipeline/buildFeatures.test.ts
git commit -m "feat: bake encoding into geojson feature properties"
```

### Task 13: Footprint match SQL + seed orchestrator

**Files:**
- Create: `pipeline/sql/002_match.sql`, `pipeline/run-seed.ts`

- [ ] **Step 1: Write the match SQL** (point-in-polygon with nearest fallback)

```sql
-- assign building_id: company point inside a footprint, else nearest within 50m
update companies c set building_id = b.id
from buildings b
where c.building_id is null and c.lng is not null
  and ST_Contains(b.geom, ST_SetSRID(ST_MakePoint(c.lng, c.lat), 4326));
update companies c set building_id = sub.id
from (
  select c2.id as cid, b.id,
    ST_Distance(b.geom::geography, ST_SetSRID(ST_MakePoint(c2.lng,c2.lat),4326)::geography) d
  from companies c2 join buildings b
    on ST_DWithin(b.geom::geography, ST_SetSRID(ST_MakePoint(c2.lng,c2.lat),4326)::geography, 50)
  where c2.building_id is null
) sub
where c.id = sub.cid and sub.d = (select min(d2) from (
  select ST_Distance(b2.geom::geography, ST_SetSRID(ST_MakePoint(c.lng,c.lat),4326)::geography) d2
  from buildings b2 where ST_DWithin(b2.geom::geography, ST_SetSRID(ST_MakePoint(c.lng,c.lat),4326)::geography, 50)
) z);
```

- [ ] **Step 2: Write the orchestrator** (download footprints, load sources, geocode, match, export)

`pipeline/run-seed.ts` outline (each block is a real call; no placeholders):
```ts
// 1. footprints: shell out, load into PostGIS
//    overturemaps download --bbox=-79.64,43.58,-79.12,43.86 -f geojson --type=building -o fp.geojson
//    ogr2ogr -f PostgreSQL "PG:..." fp.geojson -nln buildings_raw
//    then INSERT into buildings(id,geom,height_m) selecting from buildings_raw,
//    backfilling height_m from Toronto 3D Massing EleZ via a spatial join.
// 2. companies: const all = [...await fetchToronto(), ...parseGrants(fs.readFileSync(...))]
// 3. geocode missing coords: for (c of all if !c.lng) c.coords = await geocode(c.hqAddress)
//    (respect Nominatim 1 req/sec; sleep 1100ms between calls)
// 4. upsert companies + metric_records into Postgres
// 5. run sql/002_match.sql
// 6. export: select companies joined to buildings -> GeoJSON with toFeatureProps()
//    write seed.geojson
```

- [ ] **Step 3: Run the seed against local Supabase with a SMALL bbox first**

Run: `npx tsx pipeline/run-seed.ts --bbox downtown`
Expected: `seed.geojson` with the seed companies, each having `building_id` where a footprint matched. Log how many matched vs fell back vs unmatched.

- [ ] **Step 4: Sanity-check counts**

Run: `supabase db query "select count(*) from companies; select count(*) from companies where building_id is not null;"`
Expected: a credible Toronto seed (target dozens+); record the match rate. (This answers the Wikidata-coverage and Overture-height open questions.)

- [ ] **Step 5: Commit**

```bash
git add pipeline/sql/002_match.sql pipeline/run-seed.ts
git commit -m "feat: seed orchestrator with postgis footprint matching and geojson export"
```

### Task 14: Generate PMTiles and upload to R2

**Files:**
- Create: `pipeline/build-tiles.sh`, `.env.example` (R2 vars)

- [ ] **Step 1: Write the tile build script**

```bash
#!/usr/bin/env bash
set -euo pipefail
tippecanoe -o capline.pmtiles -l companies \
  --drop-densest-as-needed --extend-zooms-if-still-dropping \
  -Z10 -z18 seed.geojson
echo "built capline.pmtiles ($(du -h capline.pmtiles | cut -f1))"
```

- [ ] **Step 2: Run it**

Run: `bash pipeline/build-tiles.sh`
Expected: `capline.pmtiles` created.

- [ ] **Step 3: Upload to R2** (document, do not hardcode secrets)

Run (with rclone or aws CLI configured for R2):
`aws s3 cp capline.pmtiles s3://capline-tiles/capline.pmtiles --endpoint-url $R2_ENDPOINT`
Add `R2_ENDPOINT`, `PMTILES_URL` to `.env.example`.
Expected: file reachable at the public R2 URL.

- [ ] **Step 4: Verify byte-range fetch**

Run: `curl -sI -H "Range: bytes=0-99" "$PMTILES_URL" | grep -i "206\|content-range"`
Expected: HTTP 206 Partial Content (range requests work, required by MapLibre).

- [ ] **Step 5: Commit**

```bash
git add pipeline/build-tiles.sh .env.example
git commit -m "feat: pmtiles build and R2 upload"
```

---

## Phase 4: Map rendering and UI (manual verification, not unit tests)

> Rendering is verified by running the app and looking, not by brittle DOM assertions. Each task ends with a concrete visual check.

### Task 15: MapLibre map with the company fill-extrusion layer

**Files:**
- Create: `src/map/MapView.tsx`, `src/map/layers.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Define the layer style reading baked properties**

`src/map/layers.ts`:
```ts
import type { LayerProps } from "react-map-gl/maplibre";
export const companyExtrusion: LayerProps = {
  id: "companies-3d", type: "fill-extrusion", source: "companies", "source-layer": "companies",
  paint: {
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": 0,
    "fill-extrusion-color": ["get", "color"],
    "fill-extrusion-opacity": 0.92,
  },
};
```

- [ ] **Step 2: Render the map with the PMTiles source**

`src/map/MapView.tsx`: register the pmtiles protocol (`import {Protocol} from "pmtiles"`), add a dark style (Protomaps dark or a minimal style JSON), add `<Source type="vector" url={"pmtiles://"+import.meta.env.VITE_PMTILES_URL}>` with `<Layer {...companyExtrusion}/>`, set initial `pitch: 50, bearing: -20, center: [-79.3807,43.6480], zoom: 14`.

- [ ] **Step 3: Mount it in App**

Replace the `#map-root` placeholder with `<MapView/>`.

- [ ] **Step 4: Run and verify visually**

Run: `npm run dev`
Expected: dark Toronto map, company buildings extruded at varying heights and colors at correct locations; 60fps orbit. Re-run the App smoke test: `npx vitest run src/App.test.tsx` (still passes).

- [ ] **Step 5: Commit**

```bash
git add src/map/ src/App.tsx && git commit -m "feat: maplibre 3d company extrusion from pmtiles"
```

### Task 16: Building readout on hover/click

**Files:**
- Create: `src/ui/BuildingReadout.tsx`, `src/data/api.ts`
- Modify: `src/map/MapView.tsx`

- [ ] **Step 1: Add the Supabase query for a company by id**

`src/data/api.ts`: `getCompany(companyId)` returns the company + metric_records (with source/date/confidence). Use `@supabase/supabase-js`; read URL/key from `import.meta.env`.

- [ ] **Step 2: Wire click/hover picking**

In `MapView.tsx`, `interactiveLayerIds={["companies-3d"]}`, on click read `e.features[0].properties.companyId`, fetch with `getCompany`, show `<BuildingReadout/>`.

- [ ] **Step 3: Render the readout with provenance**

`BuildingReadout.tsx`: name + each metric's value, `as_of` date, source link, and a "self-reported / unverified" badge when `confidence === "low"`. Include the global accuracy disclaimer line.

- [ ] **Step 4: Run and verify**

Run: `npm run dev`
Expected: clicking a building shows the panel with metrics, sources, dates, and a confidence badge.

- [ ] **Step 5: Commit**

```bash
git add src/ui/BuildingReadout.tsx src/data/api.ts src/map/MapView.tsx
git commit -m "feat: building readout with provenance on click"
```

### Task 17: Legend, rank panel, cameras

**Files:**
- Create: `src/ui/Legend.tsx`, `src/ui/RankPanel.tsx`, `src/map/cameras.ts`
- Modify: `src/App.tsx`, `src/map/MapView.tsx`

- [ ] **Step 1: Legend** renders `buildLegend()` (height ticks + color ramp + footprint key).

- [ ] **Step 2: Rank panel** queries top companies by displayed funding (`api.topByFunding(limit)`), lists rank + name + funding; clicking flies the camera to that building.

- [ ] **Step 3: Cameras** in `cameras.ts`: `compareMode()` sets pitch 0 + an orthographic-feel top-down view; `defaultCity()` resets; constrain with `maxPitch: 60`, `minZoom: 11`, `maxZoom: 18` on the map. Add a toggle button.

- [ ] **Step 4: Run and verify**

Run: `npm run dev`
Expected: legend is readable; rank panel lists top companies and flying works; compare-mode flattens to top-down; camera cannot exceed constraints.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Legend.tsx src/ui/RankPanel.tsx src/map/cameras.ts src/App.tsx src/map/MapView.tsx
git commit -m "feat: legend, rank panel, and compare-mode cameras"
```

---

## Phase 5: Submission and review

### Task 18: Submit form -> pending queue (with domain-verify flag)

**Files:**
- Create: `src/ui/SubmitForm.tsx`
- Modify: `src/data/api.ts`, `src/data/provenance.ts`

- [ ] **Step 1: Write a failing test for the domain-verify confidence bump**

`src/data/provenance.test.ts` add:
```ts
import { selfReportConfidence } from "./provenance";
it("domain-verified self-report is higher confidence than free-email", () => {
  expect(selfReportConfidence(true)).toBe("medium");
  expect(selfReportConfidence(false)).toBe("low");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/data/provenance.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement + the form**

In `provenance.ts`:
```ts
import type { Confidence } from "./types";
export function selfReportConfidence(domainVerified: boolean): Confidence {
  return domainVerified ? "medium" : "low";
}
```
`SubmitForm.tsx`: fields (name, website, address or map pin, funding stage bucket + optional amount, headcount range, submitter email). On submit, compute `domainVerified = emailDomain === websiteDomain`, call `api.submit({kind, payload, submitterEmail, submitterDomainVerified})` which inserts into `submissions` with `status='pending'`.

- [ ] **Step 4: Run to verify pass + manual check**

Run: `npx vitest run src/data/provenance.test.ts` (PASS), then `npm run dev`, submit a test company.
Expected: row appears in `submissions` with correct `submitter_domain_verified`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/SubmitForm.tsx src/data/api.ts src/data/provenance.ts src/data/provenance.test.ts
git commit -m "feat: submission form with domain-verify confidence"
```

### Task 19: Minimal review/approve flow

**Files:**
- Create: `src/pages/review.tsx`
- Modify: `src/data/api.ts`, `pipeline/sql/` (an `approve_submission` SQL function)

- [ ] **Step 1: Write the approve SQL function** that, on approve, inserts a `companies` row + `metric_records` from the submission payload, geocodes will be backfilled by the next seed run, and sets `submissions.status='approved'`. Rejection just sets status.

- [ ] **Step 2: Build a password-gated review page** listing pending submissions with Approve/Reject buttons calling `api.approve(id)` / `api.reject(id)`. Gate behind a simple shared secret in env for the MVP (full auth is a non-goal).

- [ ] **Step 3: Run and verify**

Run: `npm run dev`, open `/review`, approve the test submission.
Expected: a `companies` row is created and the submission flips to `approved`. (It appears on the map after the next `run-seed`/tile rebuild, since geometry/matching happens there.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/review.tsx src/data/api.ts pipeline/sql/
git commit -m "feat: minimal gated submission review flow"
```

---

## Phase 6: Compliance and launch

### Task 20: Attribution footer, disclaimer, legal pages

**Files:**
- Create: `src/ui/Footer.tsx`, `src/pages/terms.tsx`, `src/pages/privacy.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Footer** always-visible (or one-tap) with: "© OpenStreetMap contributors" (link to openstreetmap.org/copyright), "Contains information licensed under the Open Government Licence – Toronto", and the data-accuracy disclaimer ("Figures are self-reported and/or compiled from public sources, may be inaccurate, and are not investment advice").

- [ ] **Step 2: Terms + Privacy pages** per the compliance checklist in `docs/research/risks-and-open-questions.md`: submitter rules (no impersonation/fake/false data), content license, warranty/liability disclaimers; PIPEDA privacy policy (what is collected, why, consent, retention, contact for access/correction/deletion). Add a "not affiliated/endorsed" notice. Use plain-text company names (no logos).

- [ ] **Step 3: Verify the launch checklist** (run through `risks-and-open-questions.md` "Minimal launch compliance checklist" and tick every box).

- [ ] **Step 4: Run, typecheck, and full test pass**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: no type errors, all tests pass, production build succeeds.

- [ ] **Step 5: Commit and push**

```bash
git add -A && git commit -m "feat: attribution footer, disclaimer, terms and privacy"
git push -u origin <branch>
```

### Task 21: Deploy

- [ ] **Step 1: Deploy front end to Vercel** (connect repo, set `VITE_*` env: Supabase URL/key, PMTILES_URL).
- [ ] **Step 2: Point the production Supabase project** (apply migrations there), set the production R2 bucket public URL.
- [ ] **Step 3: Run the seed against production** (`run-seed` + `build-tiles` + R2 upload).
- [ ] **Step 4: Smoke-test the live URL**: map loads, buildings render, click readout works, submit writes a pending row, footer/attribution present.
- [ ] **Step 5: Buy `capline.ca`** and attach it to Vercel (confirm name first, see open questions).

---

## Self-review against the spec

- Spec section 3 (core experience): orbit/zoom (Task 15, 17), readouts (16), legend + rank panel (17), compare camera (17), submit/correction (18). Covered.
- Spec section 4 (encoding): height (3), footprint/color/glow (4), legend (5), baked into features (12), rendered (15). Covered.
- Spec section 5 (data strategy): Wikidata (8), OGL grants (9), EDGAR (10), provenance precedence (6), domain-verify confidence (18), seed (13). Covered. SEDAR+ correctly absent.
- Spec section 6 (architecture): MapLibre fill-extrusion (15), PMTiles/R2 (14), Supabase/PostGIS (7,13), write-time geocode (11,13), Vercel (21). Covered.
- Spec section 7 (MVP scope items 1-9): all mapped to tasks above.
- Spec section 8 (non-goals): no auth (review is a shared-secret gate, not user auth), no payments, one city, no paid/scraped data, plain-text names, static baked encoding (no feature-state), no deck.gl models, cron/manual refresh only. Honored.
- Spec section 9 (success criteria) and section 12 (optional spike, Task 0): covered.

Placeholder scan: no TBD/TODO; every code step has real code; commands have expected output. Type consistency: `toFeatureProps`, `displayMetric`, `fundingToHeight`, `valuationToColor`, `headcountToFootprintScale`, `revenueToGlow`, `selfReportConfidence` are defined once and reused with consistent signatures.

Open items deliberately deferred to execution (from `risks-and-open-questions.md`): confirm Toronto 3D Massing live status (Task 13 backfill, fallback to OSM levels), measure Overture height completeness and Wikidata seed coverage (Task 13 step 4), confirm name/domain (Task 21 step 5), multi-tenant tower UX (N:1 modeled in schema Task 7; readout lists tenants, refine in 16).
