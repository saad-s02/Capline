// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { useState } from "react";
import { Terms } from "./pages/terms";
import { Privacy } from "./pages/privacy";
import { Review } from "./pages/review";
import { MapView } from "./map/MapView";
import { Legend } from "./ui/Legend";
import { RankPanel } from "./ui/RankPanel";
import { SubmitForm } from "./ui/SubmitForm";
import { Footer } from "./ui/Footer";

function MainApp() {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0d0d1a",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 20px",
          background: "rgba(10,10,25,0.95)",
          borderBottom: "1px solid #222",
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Capline
        </h1>
        <span style={{ color: "#555", fontSize: 13 }}>Toronto Tech on the Map</span>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setShowSubmit(true)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Add Company
          </button>
        </div>
      </header>

      {/* Map area with overlays */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <MapView />

        {/* Legend overlay — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <Legend />
        </div>

        {/* Rank panel overlay — top left */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <RankPanel />
        </div>
      </div>

      <Footer />

      {/* Submit modal */}
      {showSubmit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmit(false);
          }}
        >
          <div
            style={{
              background: "#13132a",
              border: "1px solid #333",
              borderRadius: 10,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowSubmit(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                background: "none",
                border: "none",
                color: "#aaa",
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
                zIndex: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <SubmitForm />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const path = window.location.pathname;
  if (path === "/terms") return <Terms />;
  if (path === "/privacy") return <Privacy />;
  if (path === "/review") return <Review />;
  return <MainApp />;
}

export default App;
