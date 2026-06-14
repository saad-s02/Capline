# Risks and Open Questions

Status: research complete. Consolidates the legal/ToS findings and every flagged risk and open item from the other research docs. The legal portion is informational only, not legal advice; for a real takedown demand or defamation letter, consult a Canadian lawyer.

## Risk register (ranked by practical severity)

### 1. Defamation / wrong financials about a named company (highest practical risk)
Displaying an incorrect revenue/valuation/funding figure for a real, named company is the classic exposure. In Canada a corporation can sue for defamation (statement that lowers reputation, refers to it, is published) ([Lexpert](https://www.lexpert.ca/news/legal-faq/can-a-company-sue-for-defamation-in-canada/393851)).
Mitigations (all cheap, all in the MVP):
- Label every figure "self-reported / unverified" and show source + date per data point.
- Prominent disclaimer: figures are self-reported and/or compiled from public sources, may be inaccurate or outdated, and are not investment advice.
- Fast correction/takedown channel (a contact email/form with a stated turnaround); acting promptly cuts damages and signals good faith.
- Truth is a complete defence; Ontario anti-SLAPP (Protection of Public Participation Act) allows early dismissal of suits over matters of public interest ([anti-SLAPP](https://ontariolitigationlawyers.com/what-qualifies-as-defamation-in-toronto/)).

### 2. ODbL share-alike on building footprints (medium)
OSM/Overture footprints are ODbL. The key distinction: a Derivative Database (modifying the OSM database) must be re-licensed ODbL; a Produced Work (a rendered map/image) only owes attribution ([ODbL v1.0](https://opendatacommons.org/licenses/odbl/1-0/), [OSM Legal FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ)). The rendered 3D map users see is a Produced Work, so there is no obligation to open our data.
Mitigations:
- Keep the financial/sizing data as a separate table keyed to companies (our own data), merged with footprints only at render time.
- Do not publish a public bulk export that bundles OSM footprints with our heights (that could be a Derivative Database and trigger share-alike).

### 3. Data-source ToS (medium)
- **SEDAR+** public-site Terms of Use are restrictive: no bots, no storing public info in a database, no commercial product built on it ([SEDAR+ Terms](https://systems.securities-administrators.ca/onlinehelp/terms-of-use/)). Do not auto-pull or DB-store SEDAR+ for v1; treat it as manual reference only.
- **SEC EDGAR** is US-government public domain and fine to use within its fair-access/rate-limit/User-Agent rules ([SEC](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)).
- **Crunchbase/PitchBook/LinkedIn** ToS prohibit scraping/redistribution; even though *hiQ v. LinkedIn* held that scraping public data likely is not a CFAA crime, breach-of-contract exposure remains ([EFF hiQ](https://www.eff.org/cases/hiq-v-linkedin)). We avoid all three; this is why.

### 4. Crowdsourced data quality and abuse (medium, ongoing)
Crowdsourced datasets reliably attract errors, spam, impersonation, and vandalism, and community review struggles at volume. For a solo dev the realistic control is a **manual approval queue + per-field provenance/confidence**, not automated vandalism detection. Add a public "suggest a correction" link and an easy removal request once there is traffic.

### 5. Trademarks and logos (low)
Using a company's name to refer to it is nominative fair use ([INTA](https://www.inta.org/fact-sheets/fair-use-of-trademarks-intended-for-a-non-legal-audience/)). Logos are riskier: prefer plain text company names for v1, skip rendering stylized logos until there is a logo-rights plan, and honor removal requests. Add a "not affiliated with / not endorsed by" notice.

### 6. Privacy / PIPEDA (low but mandatory)
Storing submitter emails triggers PIPEDA: state why you collect, get consent, use only for that purpose, minimize, and publish a privacy policy with a contact for access/correction ([OPC PIPEDA](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/)). Company facts are not personal info, but a sole proprietor / named founder can be; for v1 focus on companies, not named individuals, and offer easy removal.

### 7. Attribution (low but mandatory)
Always-visible (or one-tap) footer: "© OpenStreetMap contributors" (link to openstreetmap.org/copyright), "Contains information licensed under the Open Government Licence – Toronto", plus any tile-provider credit if not self-hosting. Retain the MapLibre BSD notice in the bundle.

## Technical risks

- **Self-hosted tiles are the only commercially-clean free option.** MapTiler and Stadia free tiers are non-commercial; do not back the product on them. Use self-hosted PMTiles on R2 (see tech-stack doc).
- **fill-extrusion memory at high zoom** is a whole-city problem; a curated company-building set avoids it. Re-test if a full OSM context layer is ever added.
- **No clean benchmark** exists for extruded deck.gl layers at millions of features; not a concern at MVP scale, but do not assume the published 1M/60fps simple-layer numbers transfer to extrusion.

## Data risks

- **Coverage at launch.** Crowdsourcing is slow to start; the seed set (Wikidata + OGL grants + SEC) must carry the first impression. ASSUMPTION: Wikidata yields dozens of Toronto-HQ firms; validate with an actual SPARQL query early.
- **Headcount accuracy.** LinkedIn buckets reflect members who list the employer, not true headcount, and cannot be scraped; rely on self-report and Wikidata. Treat headcount as the least precise metric (consistent with putting it on the weak area channel in the encoding doc).
- **Conflicting/stale figures.** Handled by per-field provenance, a display precedence order, and staleness flags (schema in data-sourcing doc).

## Open questions to resolve early

1. **Toronto 3D Massing live status.** The dataset page shows a "Retired" flag. Confirm the current dataset or its successor (email opendata@toronto.ca) before depending on its heights. Fallback: Overture heights + OSM `building:levels`.
2. **Overture height completeness in Toronto.** Quantify how many target footprints have null heights; budget for backfill from 3D Massing.
3. **Wikidata Toronto coverage.** Run the SPARQL query and count usable seed companies; if thin, lean harder on OGL grants + manual curation.
4. **Name decision.** Capline (recommended, capline.ca available) vs Mintropolis (backup); Boomtown is out (trademark + domains taken). Confirm before buying a domain. Note a moderate "Capline" software-class trademark exists abroad; acceptable given different goods/geography, but worth a glance.
5. **Multi-tenant towers UX.** Confirm the N-companies-to-1-building click experience (tenant list) is acceptable for the MVP, since many Toronto firms share towers.
6. **Which metric leads.** Encoding doc recommends funding to height as the headline; confirm this matches the founder-audience intent.

## Minimal launch compliance checklist

- [ ] Attribution footer (always visible / one-tap): OSM + OGL-Toronto (+ tile provider if any).
- [ ] Retain MapLibre BSD copyright notice in the bundle.
- [ ] Keep financial/sizing data as a separate dataset, merged at render time; no bulk export bundling OSM footprints.
- [ ] Prominent data-accuracy disclaimer; per-datapoint source + date; mark unverified entries.
- [ ] Terms of Service (visitor + submitter): no scraping of our site, submission rules (no impersonation/fake/false data), content license, warranty disclaimer, liability limit.
- [ ] Privacy policy (PIPEDA): what is collected (emails), why, consent, retention, contact for access/correction/deletion.
- [ ] Correction/takedown contact with a stated turnaround; log changes.
- [ ] "Not affiliated/endorsed" notice; plain-text company names, no stylized logos at launch.
- [ ] Do not auto-pull or DB-store SEDAR+; rely on EDGAR (public domain), Toronto Open Data (OGL), Wikidata (CC0), press, and crowdsourcing.

Two items worth a one-hour paid lawyer review before scaling: (1) the defamation/disclaimer + takedown policy, and (2) confirming the SEDAR+ data path stays compliant.

### Sources
[ODbL v1.0](https://opendatacommons.org/licenses/odbl/1-0/) ·
[OSM Licence/Legal FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ) ·
[OSM Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) ·
[Overture attribution/licensing](https://docs.overturemaps.org/attribution/) ·
[City of Toronto Open Data Licence](https://open.toronto.ca/open-data-licence/) ·
[SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data) ·
[SEDAR+ Terms of Use](https://systems.securities-administrators.ca/onlinehelp/terms-of-use/) ·
[Crunchbase ToS](https://about.crunchbase.com/terms-of-service) ·
[hiQ v. LinkedIn (EFF)](https://www.eff.org/cases/hiq-v-linkedin) ·
[Defamation Canada (Lexpert)](https://www.lexpert.ca/news/legal-faq/can-a-company-sue-for-defamation-in-canada/393851) ·
[Ontario anti-SLAPP](https://ontariolitigationlawyers.com/what-qualifies-as-defamation-in-toronto/) ·
[PIPEDA in brief (OPC)](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/) ·
[Nominative fair use (INTA)](https://www.inta.org/fact-sheets/fair-use-of-trademarks-intended-for-a-non-legal-audience/) ·
[MapTiler pricing](https://www.maptiler.com/cloud/pricing/) ·
[Stadia pricing](https://stadiamaps.com/pricing/)
