// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { useState } from "react";
import { submitCompany } from "../data/api";

type FundingStage = "Bootstrapped" | "Pre-seed" | "Seed" | "Series A+";
type HeadcountRange = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1001-5000" | "5001+";

const FUNDING_STAGES: FundingStage[] = ["Bootstrapped", "Pre-seed", "Seed", "Series A+"];
const HEADCOUNT_RANGES: HeadcountRange[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001+",
];

function extractHostname(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

function extractEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? (parts[1] ?? "").toLowerCase() : "";
}

export function SubmitForm() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [rawAddress, setRawAddress] = useState("");
  const [fundingStage, setFundingStage] = useState<FundingStage>("Bootstrapped");
  const [fundingAmount, setFundingAmount] = useState("");
  const [headcountRange, setHeadcountRange] = useState<HeadcountRange>("1-10");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const emailDomain = extractEmailDomain(submitterEmail);
    const websiteDomain = extractHostname(website);
    const domainVerified = !!(emailDomain && websiteDomain && emailDomain === websiteDomain);

    const payload: Parameters<typeof submitCompany>[0]["payload"] = {
      displayName: companyName,
      website: website || undefined,
      hqAddress: rawAddress || undefined,
      rawAddress: rawAddress || undefined,
    };

    if (fundingAmount) {
      const amount = parseFloat(fundingAmount);
      if (!isNaN(amount)) {
        payload.metrics = [
          {
            metric: "funding_total",
            value: amount,
            currency: "CAD",
            asOf: new Date().toISOString().slice(0, 10),
            sourceType: "self_reported",
            confidence: domainVerified ? "medium" : "low",
            lastVerifiedAt: new Date().toISOString().slice(0, 10),
            bucket: fundingStage,
          },
        ];
      }
    }

    if (headcountRange) {
      const headcountMetric = {
        metric: "headcount" as const,
        value: null,
        bucket: headcountRange,
        currency: "N/A",
        asOf: new Date().toISOString().slice(0, 10),
        sourceType: "self_reported" as const,
        confidence: (domainVerified ? "medium" : "low") as "medium" | "low",
        lastVerifiedAt: new Date().toISOString().slice(0, 10),
      };
      payload.metrics = [...(payload.metrics ?? []), headcountMetric];
    }

    try {
      await submitCompany({
        kind: "new",
        payload,
        submitterEmail,
        submitterDomainVerified: domainVerified,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          color: "#e0e0e0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Submitted for review
        </div>
        <div style={{ color: "#aaa", fontSize: 13 }}>
          Your submission will be reviewed before appearing on the map. Thank you!
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a2e",
    border: "1px solid #444",
    borderRadius: 4,
    color: "#e0e0e0",
    padding: "8px 10px",
    fontSize: 14,
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 14,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "20px 24px",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        minWidth: 320,
        maxWidth: 440,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
        Add a Company
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Company Name *</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Acme Corp"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Website</label>
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={inputStyle}
          placeholder="https://example.com"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Address</label>
        <input
          type="text"
          value={rawAddress}
          onChange={(e) => setRawAddress(e.target.value)}
          style={inputStyle}
          placeholder="123 King St W, Toronto, ON"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Funding Stage *</label>
        <select
          value={fundingStage}
          onChange={(e) => setFundingStage(e.target.value as FundingStage)}
          required
          style={inputStyle}
        >
          {FUNDING_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Total Funding Amount (optional, CAD)</label>
        <input
          type="number"
          value={fundingAmount}
          onChange={(e) => setFundingAmount(e.target.value)}
          style={inputStyle}
          placeholder="e.g. 5000000"
          min="0"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Headcount Range</label>
        <select
          value={headcountRange}
          onChange={(e) => setHeadcountRange(e.target.value as HeadcountRange)}
          style={inputStyle}
        >
          {HEADCOUNT_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Your Email *</label>
        <input
          type="email"
          value={submitterEmail}
          onChange={(e) => setSubmitterEmail(e.target.value)}
          required
          style={inputStyle}
          placeholder="you@yourcompany.com"
        />
        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
          Using your company email domain improves data confidence.
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#3d1a1a",
            color: "#f56",
            borderRadius: 4,
            padding: "8px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "10px 20px",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          width: "100%",
        }}
      >
        {submitting ? "Submitting…" : "Submit for Review"}
      </button>

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "#888",
          lineHeight: 1.5,
        }}
      >
        By submitting, you confirm the information is accurate to the best of your knowledge
        and agree to Capline's{" "}
        <a href="/terms" style={{ color: "#6ab4f5" }}>
          Terms
        </a>
        .
      </div>
    </form>
  );
}
