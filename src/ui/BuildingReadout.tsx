// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import type { Company, MetricName } from "../data/types";
import { displayMetric } from "../data/provenance";

interface BuildingReadoutProps {
  company: Company;
  onClose?: () => void;
}

const METRIC_LABELS: Record<MetricName, string> = {
  funding_total: "Total Funding",
  valuation: "Valuation",
  revenue: "Revenue",
  headcount: "Headcount",
};

const ALL_METRICS: MetricName[] = ["funding_total", "valuation", "revenue", "headcount"];

function humanValue(metric: MetricName, value: number | null): string {
  if (value === null) return "Unknown";
  if (metric === "headcount") return value.toLocaleString();
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function BuildingReadout({ company, onClose }: BuildingReadoutProps) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        color: "#e0e0e0",
        borderRadius: 8,
        padding: "16px 20px",
        minWidth: 280,
        maxWidth: 360,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{company.displayName}</div>
          {company.legalName && company.legalName !== company.displayName && (
            <div style={{ color: "#aaa", fontSize: 12 }}>{company.legalName}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 0 0 8px",
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #333", margin: "10px 0" }} />

      {ALL_METRICS.map((metricName) => {
        const records = company.metrics.filter((m) => m.metric === metricName);
        const record = displayMetric(records);
        if (!record) return null;
        return (
          <div key={metricName} style={{ marginBottom: 10 }}>
            <div style={{ color: "#aaa", fontSize: 12, marginBottom: 2 }}>
              {METRIC_LABELS[metricName]}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {humanValue(metricName, record.value)}
              </span>
              {record.confidence === "low" && (
                <span
                  style={{
                    background: "#5a3e00",
                    color: "#f5c518",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  self-reported / unverified
                </span>
              )}
            </div>
            <div style={{ color: "#888", fontSize: 11 }}>
              As of {record.asOf}
              {record.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={record.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6ab4f5" }}
                  >
                    source
                  </a>
                </>
              )}
            </div>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 12,
          padding: "8px",
          background: "#111",
          borderRadius: 4,
          fontSize: 11,
          color: "#999",
          lineHeight: 1.4,
        }}
      >
        Figures are self-reported and/or from public sources, may be inaccurate, and are not
        investment advice.
      </div>
    </div>
  );
}
