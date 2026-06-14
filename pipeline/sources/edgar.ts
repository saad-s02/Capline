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
