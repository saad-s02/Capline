// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
// MVP gate only; move behind a real server route before launch (auth is a non-goal now).
import { useEffect, useState } from "react";
import { listPending, setSubmissionStatus } from "../data/api";
import type { Submission } from "../data/types";

function getSecretParam(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("secret") ?? "";
}

export function Review() {
  const [secret, setSecret] = useState(getSecretParam());
  const [inputSecret, setInputSecret] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reviewSecret = import.meta.env.VITE_REVIEW_SECRET ?? "";

  useEffect(() => {
    if (secret && reviewSecret && secret === reviewSecret) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [secret, reviewSecret]);

  useEffect(() => {
    if (!authorized) return;
    setLoading(true);
    listPending()
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [authorized]);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecret(inputSecret.trim());
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionError(null);
    try {
      await setSubmissionStatus(id, status);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d1a",
          color: "#e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ width: 320 }}>
          <h1 style={{ fontSize: 20, marginBottom: 20 }}>Review Portal</h1>
          {secret ? (
            <div style={{ color: "#f56" }}>Not authorized.</div>
          ) : (
            <form onSubmit={handleSecretSubmit}>
              <label style={{ display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                Enter review secret:
              </label>
              <input
                type="password"
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1a1a2e",
                  border: "1px solid #444",
                  borderRadius: 4,
                  color: "#e0e0e0",
                  padding: "8px 10px",
                  fontSize: 14,
                  boxSizing: "border-box",
                  marginBottom: 10,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Enter
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d1a",
        color: "#e0e0e0",
        fontFamily: "system-ui, sans-serif",
        padding: "32px",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Pending Submissions</h1>

      {loading && <div style={{ color: "#aaa" }}>Loading…</div>}

      {!loading && submissions.length === 0 && (
        <div style={{ color: "#aaa" }}>No pending submissions.</div>
      )}

      {actionError && (
        <div
          style={{
            background: "#3d1a1a",
            color: "#f56",
            borderRadius: 4,
            padding: "8px 12px",
            marginBottom: 16,
          }}
        >
          {actionError}
        </div>
      )}

      {submissions.map((sub) => (
        <div
          key={sub.id}
          style={{
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 16,
            maxWidth: 600,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>
              {sub.kind === "new" ? "New Company" : "Correction"}
            </span>
            <span style={{ color: "#888", fontSize: 12 }}>{sub.createdAt}</span>
          </div>

          <div style={{ fontSize: 13, color: "#bbb", marginBottom: 4 }}>
            Submitter: {sub.submitterEmail}
          </div>

          <pre
            style={{
              background: "#111",
              borderRadius: 4,
              padding: "10px",
              fontSize: 11,
              color: "#ccc",
              overflow: "auto",
              marginBottom: 12,
              maxHeight: 200,
            }}
          >
            {JSON.stringify(sub.payload, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleAction(sub.id, "approved")}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(sub.id, "rejected")}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
