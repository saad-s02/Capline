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
