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
