// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { buildLegend } from "../encoding/legend";

export function Legend() {
  const legend = buildLegend();

  return (
    <div
      style={{
        background: "rgba(20, 20, 40, 0.92)",
        color: "#e0e0e0",
        borderRadius: 8,
        padding: "12px 16px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        minWidth: 160,
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Legend</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#aaa", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Height = Total Funding
        </div>
        {legend.heightTicks.map((tick) => (
          <div key={tick.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div
              style={{
                width: 4,
                height: Math.max(4, Math.min(40, tick.meters / 10)),
                background: "#6ab4f5",
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            <span>
              {tick.label}
              <span style={{ color: "#888", marginLeft: 4 }}>{tick.meters}m</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#aaa", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Color = Valuation
        </div>
        {legend.colorStops.map((stop) => (
          <div key={stop.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div
              style={{
                width: 16,
                height: 12,
                background: stop.color,
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            <span>{stop.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ color: "#aaa", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Footprint = Headcount
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ width: 10, height: 10, background: "#6ab4f5", borderRadius: 1, opacity: 0.5 }} />
          <div style={{ width: 16, height: 16, background: "#6ab4f5", borderRadius: 1 }} />
          <span style={{ color: "#888", fontSize: 11 }}>small → large</span>
        </div>
      </div>
    </div>
  );
}
