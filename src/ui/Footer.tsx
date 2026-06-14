// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.

export function Footer() {
  return (
    <footer
      style={{
        background: "rgba(10, 10, 20, 0.95)",
        color: "#888",
        fontFamily: "system-ui, sans-serif",
        fontSize: 11,
        padding: "10px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 16px",
        alignItems: "center",
        borderTop: "1px solid #222",
        lineHeight: 1.5,
      }}
    >
      <span>
        Map data &copy;{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6ab4f5" }}
        >
          OpenStreetMap contributors
        </a>
      </span>

      <span>
        Contains information licensed under the{" "}
        <a
          href="https://www.toronto.ca/city-government/data-research-maps/open-data/open-data-licence/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6ab4f5" }}
        >
          Open Government Licence – Toronto
        </a>
      </span>

      <span>
        Company figures are self-reported and/or from public sources, may be inaccurate, and
        are not investment advice.
      </span>

      <span>Not affiliated with or endorsed by the companies shown.</span>

      <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
        <a href="/terms" style={{ color: "#6ab4f5" }}>
          Terms
        </a>
        <a href="/privacy" style={{ color: "#6ab4f5" }}>
          Privacy
        </a>
      </span>
    </footer>
  );
}
