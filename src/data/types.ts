export type SourceType =
  | "self_reported" | "wikidata" | "sec_edgar" | "ogl_grant" | "press" | "linkedin_manual";
export type Confidence = "high" | "medium" | "low";
export type MetricName = "funding_total" | "valuation" | "revenue" | "headcount";

export interface MetricRecord {
  metric: MetricName;
  value: number | null;
  valueMin?: number; valueMax?: number; bucket?: string;
  currency: string;
  asOf: string;
  sourceType: SourceType;
  sourceUrl?: string;
  confidence: Confidence;
  lastVerifiedAt: string;
}
export interface Company {
  id: string;
  displayName: string;
  legalName?: string;
  website?: string;
  hqAddress?: string;
  lng?: number; lat?: number;
  buildingId?: string;
  wikidataQid?: string;
  secCik?: string;
  metrics: MetricRecord[];
  weightBasis: MetricName;
}
export interface Building { id: string; height: number | null; }
export type SubmissionStatus = "pending" | "approved" | "rejected";
export interface Submission {
  id: string; kind: "new" | "correction";
  payload: Partial<Company> & { rawAddress?: string };
  submitterEmail: string; status: SubmissionStatus; createdAt: string;
}
