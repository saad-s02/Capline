# Data Sourcing (v1 strategy)

Status: research complete. Decision context locked: **crowdsourced self-submission + free public data**, no paid APIs, no scraping, bootstrapped solo dev.

## Bottom line

A Build 416 style self-submission form is the primary intake. Augment it with a small set of free, well-licensed public sources (Wikidata CC0, SEC EDGAR public domain, Canada Open Government Licence grants). Avoid scraping LinkedIn (ToS breach risk) and any paid API (Crunchbase free tier was removed in 2025). Store provenance and confidence per field. Seed roughly 50 to 200 companies from Wikidata SPARQL plus public funding lists before crowdsourcing gains momentum.

## 1. Crowdsourcing (primary intake)

Build 416 itself is a 3D map of Toronto tech companies built purely on founder self-submission. Its "Add A Company" form collects name, website, a dropped map pin, funding stage (Bootstrapped / Pre-seed / Seed / Series A+), funding amount, and submitter email, with manual review and no automated verification ([build416.ca](https://build416.ca/)). This is the closest reference design.

UX patterns to adopt:
- **Categorical over exact.** Funding stage buckets and headcount ranges are easier to get right and less spammy than exact dollars (mirrors Build 416 and LinkedIn's own bucketing).
- **Map-pin drop** for location.
- **Manual review queue** before going live. At low volume you are the moderator.
- **Public "suggest a correction" link** per company (Wikipedia / OSM model) once there is traffic.

Quality risk is real and well documented: crowdsourced datasets suffer misinformation, errors, prolific-contributor dominance, promotional spam, and vandalism, and community review struggles to keep pace with volume ([crowdsourced geospatial data quality](https://www.tandfonline.com/doi/full/10.1080/13658816.2019.1593422), [OSM vandalism detection](https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512224)). For a solo dev, a manual approval gate plus per-field provenance is more realistic than building automated vandalism detection.

Verifying a submitter represents the company (cheap, layered):
- **Email-domain match** (founder@acme.com for acme.com) is the standard low-friction ownership signal ([domain verification guide](https://workos.com/guide/the-developers-guide-to-domain-verification)).
- **DNS TXT / file-at-root** is a stronger optional tier (the GitHub/Zoho/Salesforce method) reserved for a "verified" badge, not basic submission ([GitHub domain verification](https://docs.github.com/en/organizations/managing-organization-settings/verifying-or-approving-a-domain-for-your-organization)).
- **LinkedIn profile link** as a soft signal eyeballed during manual review (do not scrape it).
- Treat domain-verified submissions as higher confidence than free-email (gmail) submissions.

## 2. Free public sources (access, limits, license)

| Source | Free? | API? | License | Verdict for v1 |
|---|---|---|---|---|
| **Wikidata** | Yes | Yes (SPARQL) | CC0 | **Best seed source.** Query Toronto-HQ companies. |
| **SEC EDGAR** | Yes | Yes (10 req/s, User-Agent header required) | Public domain | Use for the few public/cross-listed Toronto firms. Thin coverage. |
| **Canada Open Gov (grants / IRAP)** | Yes | Bulk CSV | OGL-Canada (attribution) | Real free "government funding" signal. Add attribution line. |
| **SEDAR+** | Browse only | **No** | Public filings, restrictive site ToS | Manual spot-check only. Do not auto-pull or DB-store (see legal doc). |
| **Canadian registries (ISED / Ontario)** | Browse only | **No** | n/a | Confirm legal name only. No financials. |
| **LinkedIn** | View only | No (legitimate) | Proprietary ToS | **Do not scrape.** Self-report or manual eyeball only. |
| **Crunchbase** | **No** | Paid only | Licensed | Free tier removed 2025 (~$49 to $99/mo). Not a v1 source. |
| **Self-report / press** | Yes | n/a | n/a | Accept, tag low confidence, verify. |

Key access notes:
- **SEC EDGAR**: company facts JSON at `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` returns every XBRL fact a filer ever submitted; 10 requests/sec cap; descriptive User-Agent (name + email) is mandatory ([SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [EDGAR API guide](https://dealcharts.org/blog/sec-edgar-api-guide)).
- **Wikidata**: SPARQL endpoint `https://query.wikidata.org/sparql`; query headquarters location (P159) = Toronto, pulling founded (P571), employees (P1128), industry, official website (P856), coordinates; CC0, no attribution required ([Wikidata SPARQL](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service), [Wikidata licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)).
- **Canada Open Government grants** (incl. NRC IRAP) are downloadable CSV under OGL-Canada v2.0 (worldwide, royalty-free, commercial use OK, attribution only) ([dataset](https://open.canada.ca/data/en/dataset/432527ab-7aac-45b5-81d6-7597107a7013), [OGL-Canada](https://open.canada.ca/en/open-government-licence-canada)).

## 3. Headcount (free approximation)

LinkedIn shows fixed public size buckets (1, 2-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+) but these reflect members who list the employer, not true headcount ([LinkedIn company sizes](https://www.getwickedgrowth.com/linkedin-ads-targeting/company-sizes/), [headcount data caveat](https://blog.getaura.ai/headcount-data)). Scraping LinkedIn breaches its User Agreement: in *hiQ v. LinkedIn*, scraping public data likely did not violate the CFAA, but LinkedIn still prevailed on breach of contract ([EFF](https://www.eff.org/deeplinks/2019/09/victory-ruling-hiq-v-linkedin-protects-scraping-public-data)). So: self-report the bucket on the form (primary), use Wikidata P1128 where present, or a human manually reads a public page. No automated scraping.

## 4. Data model

Store **per-field provenance**, not just per-company (funding may come from a press release while headcount comes from Wikidata).

Company entity: `id`, `legal_name`, `display_name`, `website` (canonical domain), `hq_address`, `lat/lng`, `building_id`, `founded_year`, `wikidata_qid`, `sec_cik` (nullable), `status` (pending / live / rejected), `submitter_email`, `domain_verified` (bool), `created_at`.

Per metric (funding_total, valuation, revenue, headcount, funding_stage) store: `value` or range (`value_min` / `value_max` / `bucket`), `currency`, `as_of_date`, `source_type` (enum: self_reported, wikidata, sec_edgar, ogl_grant, press, linkedin_manual), `source_url`, `confidence` (high = SEC/OGL/domain-verified; medium = Wikidata/press; low = unverified self-report), `last_verified_at`, `verified_by`.

- **Conflict handling.** Keep multiple metric records; pick the displayed value by precedence: regulatory (SEC) > government (OGL grant) > domain-verified self-report > Wikidata > press > unverified. Show a "sources" tooltip listing all, and flag staleness.
- **Missing data.** Size the building by the best available metric and record a `weight_basis` field ("sized by funding" vs "sized by headcount") so the map stays honest. Render unknowns at a baseline size with an explicit "unverified/unknown" treatment rather than guessing.

## 5. Seed data (first 50 to 200 Toronto companies, free and legal)

1. **Wikidata SPARQL** (CC0, safe to store) for Toronto-HQ companies, dumped to the `company` table with `source_type=wikidata`.
2. **Canada Open Government grants/IRAP CSV** filtered to Toronto recipients gives an instant set of real, OGL-licensed funded companies.
3. **SEC EDGAR** company facts for the handful of public Toronto-HQ tech firms.
4. **Editorial pointers** (BetaKit funding coverage, MaRS portfolio, TechTO lists) used only to find company names, then each verified from a primary source. Do not bulk-copy third-party compilations; they may not grant redistribution rights.

Workflow: Wikidata to table, enrich with OGL grants and SEC facts, flag the rest as `self_reported`/`press` placeholders, then open the public Add/Correct form. This gives a legal, cited base map before founder submissions arrive.

## Assumptions and flags

- ASSUMPTION: Toronto-HQ Wikidata coverage yields a usable seed (dozens of firms). To be validated with an actual SPARQL query during the spike or phase 1.
- FLAG: SEDAR+ is browse-only with restrictive ToS; treat as manual reference, not a pipeline source (see `risks-and-open-questions.md` and the legal section).
- FLAG: crowdsourced data quality is the central ongoing risk; the manual review queue is the mitigation for v1.

### Sources
[build416.ca](https://build416.ca/) ·
[SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) ·
[EDGAR API guide](https://dealcharts.org/blog/sec-edgar-api-guide) ·
[SEDAR+ Terms of Use](https://systems.securities-administrators.ca/onlinehelp/terms-of-use/) ·
[OSC SEDAR+](https://www.osc.ca/en/industry/sedarplus) ·
[Open Gov grants dataset](https://open.canada.ca/data/en/dataset/432527ab-7aac-45b5-81d6-7597107a7013) ·
[OGL-Canada](https://open.canada.ca/en/open-government-licence-canada) ·
[Wikidata SPARQL](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service) ·
[Wikidata Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing) ·
[Company data via Wikidata](https://dev.to/minchulkim87/company-data-using-wikidata-n19) ·
[EFF hiQ](https://www.eff.org/deeplinks/2019/09/victory-ruling-hiq-v-linkedin-protects-scraping-public-data) ·
[Morgan Lewis hiQ](https://www.morganlewis.com/blogs/sourcingatmorganlewis/2022/12/linkedin-v-hiq-landmark-data-scraping-suit-provides-guidance-to-data-scrapers-and-web-operators) ·
[LinkedIn size buckets](https://www.getwickedgrowth.com/linkedin-ads-targeting/company-sizes/) ·
[Headcount caveat](https://blog.getaura.ai/headcount-data) ·
[Crunchbase free tier gone](https://dev.to/agenthustler/crunchbase-api-in-2026-free-tier-gone-what-startup-data-hunters-do-now-1177) ·
[Crunchbase license](https://data.crunchbase.com/docs/license-agreement) ·
[Domain verification guide](https://workos.com/guide/the-developers-guide-to-domain-verification) ·
[Crowdsourced data quality](https://www.tandfonline.com/doi/full/10.1080/13658816.2019.1593422) ·
[OSM vandalism detection](https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512224)
