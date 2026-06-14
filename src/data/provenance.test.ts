import { it, expect } from "vitest";
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
