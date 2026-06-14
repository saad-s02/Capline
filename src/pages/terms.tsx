// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.

export function Terms() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        background: "#0d0d1a",
        minHeight: "100vh",
        lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Use</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 32 }}>
        Last updated: June 2025
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>1. Acceptance</h2>
        <p>
          By accessing or using Capline, you agree to these Terms of Use. If you do not agree,
          please do not use the service.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>2. Submitter Rules</h2>
        <p>When submitting company information, you agree to the following:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li style={{ marginBottom: 6 }}>
            No impersonation: do not submit data as if you represent a company you are not
            affiliated with.
          </li>
          <li style={{ marginBottom: 6 }}>
            No fake or false data: submissions must represent accurate information to the best
            of your knowledge.
          </li>
          <li style={{ marginBottom: 6 }}>
            No malicious content: do not include harmful, defamatory, or unlawful content in
            submissions.
          </li>
          <li style={{ marginBottom: 6 }}>
            You are responsible for the accuracy of the information you submit.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>3. Content Licence</h2>
        <p>
          By submitting information to Capline, you grant Capline a non-exclusive, royalty-free,
          worldwide licence to use, store, display, and share that information as part of the
          service, including under open data licences where applicable.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          4. Disclaimer of Warranties
        </h2>
        <p>
          Capline is provided "as is" without warranty of any kind, express or implied. We do
          not warrant that the information on this site is accurate, complete, or current.
          Company figures are self-reported and/or from public sources and may be inaccurate.
          Nothing on this site constitutes investment advice.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          5. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by law, Capline and its operators shall not be liable
          for any direct, indirect, incidental, or consequential damages arising out of your use
          of this service or reliance on any information provided herein.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>6. No Scraping</h2>
        <p>
          Automated scraping, crawling, or bulk extraction of data from this site is prohibited
          without prior written permission. This applies to all content, including company data,
          map tiles, and any other materials hosted on or served by Capline.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>7. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after
          changes are posted constitutes your acceptance of the revised terms.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>8. Contact</h2>
        <p>
          Questions about these terms? Contact us at the address listed on the Privacy page.
        </p>
      </section>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #333" }}>
        <a href="/" style={{ color: "#6ab4f5" }}>
          ← Back to map
        </a>
        {" · "}
        <a href="/privacy" style={{ color: "#6ab4f5" }}>
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
