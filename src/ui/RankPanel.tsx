// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { useEffect, useState } from "react";
import { topByFunding } from "../data/api";
import type { RankRow } from "../data/api";

interface RankPanelProps {
  onSelect?: (companyId: string) => void;
}

function humanFunding(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function RankPanel({ onSelect }: RankPanelProps) {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    topByFunding(20)
      .then((data) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        background: "rgba(20, 20, 40, 0.92)",
        color: "#e0e0e0",
        borderRadius: 8,
        padding: "12px 0",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        minWidth: 220,
        maxHeight: 400,
        overflowY: "auto",
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 13,
          padding: "0 16px 8px",
          borderBottom: "1px solid #333",
        }}
      >
        Top by Funding
      </div>
      {loading && (
        <div style={{ padding: "12px 16px", color: "#888" }}>Loading…</div>
      )}
      {!loading && rows.length === 0 && (
        <div style={{ padding: "12px 16px", color: "#888" }}>No data</div>
      )}
      {rows.map((row, i) => (
        <button
          key={row.id}
          onClick={() => onSelect?.(row.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            background: "none",
            border: "none",
            borderBottom: "1px solid #222",
            color: "#e0e0e0",
            padding: "8px 16px",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#888", width: 18, flexShrink: 0, textAlign: "right" }}>
            {i + 1}
          </span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.name}
          </span>
          <span style={{ color: "#6ab4f5", flexShrink: 0 }}>
            {humanFunding(row.funding)}
          </span>
        </button>
      ))}
    </div>
  );
}
