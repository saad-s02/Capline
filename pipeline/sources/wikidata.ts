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
