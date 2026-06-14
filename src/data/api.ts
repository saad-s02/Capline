// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { createClient } from "@supabase/supabase-js";
import type { Company, MetricRecord, Submission } from "./types";

// Use a placeholder URL so createClient does not throw during test/SSR environments
// where env vars are not set. Real requests will fail gracefully via error returns.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface RankRow {
  id: string;
  name: string;
  funding: number;
}

// Raw metric_records row (snake_case columns) -> MetricRecord (camelCase).
interface MetricRow {
  metric: MetricRecord["metric"]; value: number | null;
  value_min: number | null; value_max: number | null; bucket: string | null;
  currency: string; as_of: string | null;
  source_type: MetricRecord["sourceType"]; source_url: string | null;
  confidence: MetricRecord["confidence"]; last_verified_at: string | null;
}
function toMetricRecord(r: MetricRow): MetricRecord {
  return {
    metric: r.metric, value: r.value,
    valueMin: r.value_min ?? undefined, valueMax: r.value_max ?? undefined,
    bucket: r.bucket ?? undefined, currency: r.currency, asOf: r.as_of ?? "",
    sourceType: r.source_type, sourceUrl: r.source_url ?? undefined,
    confidence: r.confidence, lastVerifiedAt: r.last_verified_at ?? "",
  };
}

export async function getCompany(companyId: string): Promise<Company | null> {
  // metric_records is the related table; embed it by its real name and map columns.
  const { data, error } = await supabase
    .from("companies")
    .select("*, metric_records(*)")
    .eq("id", companyId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id as string,
    displayName: data.display_name as string,
    legalName: data.legal_name as string | undefined,
    website: data.website as string | undefined,
    hqAddress: data.hq_address as string | undefined,
    lng: data.lng as number | undefined,
    lat: data.lat as number | undefined,
    buildingId: data.building_id as string | undefined,
    wikidataQid: data.wikidata_qid as string | undefined,
    secCik: data.sec_cik as string | undefined,
    metrics: ((data.metric_records as MetricRow[]) ?? []).map(toMetricRecord),
    weightBasis: data.weight_basis as Company["weightBasis"],
  };
}

export async function topByFunding(limit: number): Promise<RankRow[]> {
  // funding_total lives in metric_records, so rank via the company_funding view
  // (see supabase/migrations/002_company_funding_view.sql).
  const { data, error } = await supabase
    .from("company_funding")
    .select("id, display_name, funding_total")
    .order("funding_total", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as { id: string; display_name: string; funding_total: number }[]).map((row) => ({
    id: row.id,
    name: row.display_name,
    funding: row.funding_total ?? 0,
  }));
}

export async function submitCompany(input: {
  kind: "new" | "correction";
  payload: Partial<Company> & { rawAddress?: string };
  submitterEmail: string;
  submitterDomainVerified: boolean;
}): Promise<void> {
  const { error } = await supabase.from("submissions").insert({
    kind: input.kind,
    payload: input.payload,
    submitter_email: input.submitterEmail,
    submitter_domain_verified: input.submitterDomainVerified,
    status: "pending",
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function listPending(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (
    data as {
      id: string;
      kind: "new" | "correction";
      payload: Partial<Company> & { rawAddress?: string };
      submitter_email: string;
      status: Submission["status"];
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    kind: row.kind,
    payload: row.payload,
    submitterEmail: row.submitter_email,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function setSubmissionStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
