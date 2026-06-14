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
