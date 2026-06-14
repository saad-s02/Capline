import type { MetricRecord, SourceType, Confidence } from "./types";
export const PRECEDENCE: SourceType[] =
  ["sec_edgar", "ogl_grant", "wikidata", "press", "linkedin_manual", "self_reported"];
export function displayMetric(records: MetricRecord[]): MetricRecord | null {
  if (records.length === 0) return null;
  return [...records].sort(
    (a, b) => PRECEDENCE.indexOf(a.sourceType) - PRECEDENCE.indexOf(b.sourceType)
  )[0];
}
export function selfReportConfidence(domainVerified: boolean): Confidence {
  return domainVerified ? "medium" : "low";
}
