# Competitive Landscape and Prior Art

Status: research complete. Two agents (rendering, basemap) still feeding the stack doc.

## Bottom line

No one is doing exactly Capline (companies-as-buildings + real geography + financial encoding + crowdsourcing). The metaphor is well proven (CodeCity, Git City) and the geo-3D-data-bars pattern is well proven (CivicMapper, deck.gl). The white space is the combination, plus the crowdsourced company dataset at real addresses, plus the founder/local-tech wedge. The closest adjacent competitor is **CivicMapper** (parcels-as-bars, launched ~Jan 2026). The closest spiritual sibling is **Git City**. The closest category competitor is **Build 416**, which notably does not encode finances as building geometry.

## The landscape

| Capability | Build 416 | Git City | CivicMapper | Dealroom | **Capline** |
|---|---|---|---|---|---|
| Real geography (true address) | Yes (markers) | No (abstract) | Yes | Yes (2D) | **Yes** |
| Financial weight to building height/mass/color | No | Yes (dev metrics) | Yes (land value) | No | **Yes** |
| Entity = company | Yes | No (devs) | No (parcels) | Yes | **Yes** |
| Walkable 3D skyline | No | Yes | Yes | No | **Yes** |
| Crowdsourced + free public data | Yes | No (API) | No (gov data) | No (proprietary) | **Yes** |

No competitor checks all five.

## Key players

**Build 416 (build416.ca) - closest category competitor, but leaves the core idea on the table.** Interactive map of Toronto tech companies ("Where The Builders Are"), crowdsourced via a form (name, website, pin-drop location, funding stage bootstrapped to Series A+, funding amount) with manual review. Built on MapLibre GL. Critical gap: despite being a map with funding data, it does NOT encode financial weight into building height/mass/color; pins are standard markers, not a 3D bar chart. It validates the audience (Toronto founders) and the crowdsourcing mechanic, but leaves Capline's core visual idea unbuilt. Traction and business model not disclosed (unverified). ([build416.ca](https://build416.ca/))

**Git City (github.com/srizzon/git-city) - proves data-as-buildings and vanity monetization, but abstract geometry.** Every GitHub profile becomes a 3D building: height = contributions, width = repos, lit windows = stars. Stack: Next.js, React Three Fiber + Three.js, Supabase (Postgres + OAuth), Tailwind, Vercel; performance via WebGL instanced rendering ("thousands of buildings," single draw call) + LOD. Monetizes cosmetics (crowns, auras, roof effects) via Stripe. ~5.7k GitHub stars, AGPL-3.0. Proves (a) data-as-buildings has viral/vanity pull, (b) cosmetic monetization works on a "your entity as a building" product, (c) a solo dev can ship this stack. Key contrast: non-geographic; buildings are not at real addresses. ([git-city](https://github.com/srizzon/git-city), [CLAUDE.md](https://github.com/srizzon/git-city/blob/main/CLAUDE.md), [WebGPU showcase](https://www.webgpu.com/showcase/git-city-github-3d-pixel-skyline/))

**CivicMapper (civicmapper.org) - the most direct adjacent competitor.** Interactive 3D where every parcel is an extruded bar with height = property value (land / improvement / total, selectable), click for parcel data, adjustable height-scaling and filters. From the Center for Land Economics, launched ~Jan 2026 (Show HN). This is Capline's exact visual grammar applied to real-estate parcels instead of companies. It is "one pivot away" from doing companies; worth monitoring. ([launch post](https://progressandpoverty.substack.com/p/launching-civicmapper-visualizing), [Hacker News](https://news.ycombinator.com/item?id=46848103), [civicmapper.org](https://www.civicmapper.org/))

**CodeCity lineage - validates the metaphor academically.** CodeCity (Wettel and Lanza, USI): classes = buildings, packages = districts, height/base/color = code metrics; empirically improved task correctness +24% and time -12% vs Eclipse+Excel. The canonical proof that height/area/color encoding is legible. Related: CoderCity (web), Gource (animated git history). The "encode metrics into building dimensions" idea is 15+ years validated and not defensible IP. ([Wettel paper](https://wettel.github.io/download/Wettel08a-icse-tooldemo.pdf), [CoderCity](https://github.com/INSO-World/CoderCity))

**deck.gl - the rendering substrate, not a competitor.** Extruded buildings from vector tiles, 3D Tiles (OGC), TerrainExtension. Its `ColumnLayer`/`PolygonLayer` extrusion is the most direct "company-as-bar-at-coordinate" primitive. ([deck.gl](https://deck.gl/), [MapTiler MVT extrude](https://docs.maptiler.com/deck-gl/examples/mvt-extrude/))

**VC/market-map incumbents (data-rich, not spatial-3D).** Dealroom geo-locates startups with sector/funding/investor data and powers 100+ official city ecosystem maps (SaaS + white-label to governments), but it is 2D and list/filter-driven, not a 3D financial skyline ([Dealroom ecosystem platform](https://dealroom.co/products/ecosystem-platform)). Crunchbase geocodes HQs onto a 2D map. Specter is a company-discovery data feed. None render an economic skyline.

**Open 3D building data/renderers (substrate, not competitors).** OSM Buildings, F4Map, Streets GL render real OSM heights; GlobalBuildingAtlas provides open global polygons + heights + LoD1 models, a free footprint source ([GlobalBuildingAtlas](https://essd.copernicus.org/articles/17/6647/2025/), [OSMBuildings](https://github.com/OSMBuildings/OSMBuildings)).

## Defensible differentiator (ranked)

1. **The dataset, not the renderer.** The metaphor is unprotectable. The moat is a clean, crowdsourced, geocoded company-to-finances mapping per city, starting with Toronto. Whoever owns the canonical "company at its real address with its funding/headcount" dataset wins. This is also the hardest part (data quality, dedup, geocoding, funding freshness).
2. **The intersection itself** (company + real geo + financial encoding + walkable + crowdsourced) is genuinely unoccupied.
3. **Audience wedge and vanity loop.** Git City proves founders/devs engage and pay for cosmetics to make "their building" stand out. Capline can run the same claim-your-building loop on founders, a warmer, higher-LTV audience.
4. **Local-first, generalizable.** Build 416 shows Toronto-tech appetite; Dealroom shows cities/EDCs/accelerators will fund and white-label ecosystem maps. Plausible later B2B2C path after a viral Toronto launch.

## Threats to watch

- **CivicMapper** is one pivot away (same team, same tech, recent momentum). Monitor it.
- **Build 416** is one feature away from neutralizing the differentiator (add extrusion to its existing MapLibre + funding data). This argues for moving fast on the skyline encoding.
- **Dealroom** has the data but little incentive to build a consumer 3D toy; more likely a future acquirer/partner than a near-term threat.

## Flags (unverified)

Build 416 traction/business model; Git City data-refresh cadence; existence of City Blocks / ViewGit / github3d as live tools; any "wealth of cities" art project doing this exact thing. None of these change the conclusion.

### Sources
[build416.ca](https://build416.ca/) ·
[git-city repo](https://github.com/srizzon/git-city) ·
[git-city CLAUDE.md](https://github.com/srizzon/git-city/blob/main/CLAUDE.md) ·
[Git City WebGPU showcase](https://www.webgpu.com/showcase/git-city-github-3d-pixel-skyline/) ·
[CivicMapper launch](https://progressandpoverty.substack.com/p/launching-civicmapper-visualizing) ·
[CivicMapper on HN](https://news.ycombinator.com/item?id=46848103) ·
[civicmapper.org](https://www.civicmapper.org/) ·
[Wettel CodeCity paper](https://wettel.github.io/download/Wettel08a-icse-tooldemo.pdf) ·
[CoderCity](https://github.com/INSO-World/CoderCity) ·
[Gource](https://github.com/acaudwell/Gource) ·
[deck.gl](https://deck.gl/) ·
[deck.gl MVT extrude](https://docs.maptiler.com/deck-gl/examples/mvt-extrude/) ·
[Dealroom ecosystem platform](https://dealroom.co/products/ecosystem-platform) ·
[Crunchbase maps (TechCrunch 2008)](https://techcrunch.com/2008/06/22/crunchbase-now-with-maps-advanced-search-jobs-and-milestones) ·
[GlobalBuildingAtlas](https://essd.copernicus.org/articles/17/6647/2025/) ·
[OSMBuildings](https://github.com/OSMBuildings/OSMBuildings) ·
[Streets GL](https://community.openstreetmap.org/t/streets-gl-a-new-3d-renderer-for-osm/98594)
