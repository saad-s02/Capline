import { parseRevenue } from "./edgar";
const facts = { cik: 320193, entityName: "Acme", facts: { "us-gaap": { Revenues: {
  units: { USD: [ { fy: 2023, fp: "FY", val: 1000, end: "2023-12-31", form: "10-K" } ] } } } } };
it("extracts latest annual revenue", () => {
  const r = parseRevenue(facts as any);
  expect(r?.value).toBe(1000); expect(r?.metric).toBe("revenue");
  expect(r?.sourceType).toBe("sec_edgar"); expect(r?.asOf).toBe("2023-12-31");
});
