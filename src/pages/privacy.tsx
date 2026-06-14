// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.

export function Privacy() {
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
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Last updated: June 2025</p>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 32 }}>
        This policy is provided in accordance with Canada's Personal Information Protection and
        Electronic Documents Act (PIPEDA).
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          1. What Information We Collect
        </h2>
        <p>
          When you submit a company to Capline, we collect your email address. We do not collect
          any additional personal information beyond what you voluntarily provide in the
          submission form (company name, website, address, and funding details).
        </p>
        <p style={{ marginTop: 8 }}>
          We do not set tracking cookies, use third-party analytics, or collect IP addresses
          beyond standard web server logs.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>2. Why We Collect It</h2>
        <p>Your email address is collected for the following purposes:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li style={{ marginBottom: 6 }}>
            To verify domain affiliation with the company you are submitting (used to assign
            a higher confidence level to self-reported data).
          </li>
          <li style={{ marginBottom: 6 }}>
            To contact you if we have questions about your submission.
          </li>
          <li style={{ marginBottom: 6 }}>
            To attribute accountability for submitted data and deter abuse.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>3. Consent</h2>
        <p>
          By submitting the form, you consent to Capline collecting and storing your email
          address for the purposes described above. You may withdraw consent at any time by
          contacting us (see section 7). Withdrawal of consent may result in deletion of your
          submission.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>4. Retention</h2>
        <p>
          Submission records, including your email address, are retained for as long as the
          associated company data remains on the platform, or until you request deletion,
          whichever comes first. Rejected submissions are deleted within 90 days of rejection.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>5. Disclosure</h2>
        <p>
          We do not sell, rent, or share your personal information with third parties, except
          where required by law. Submission payloads (excluding your email address) may be
          published as open data once approved.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>6. Security</h2>
        <p>
          We store data with Supabase and take reasonable technical measures to protect your
          personal information. However, no internet transmission or storage system is 100%
          secure.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          7. Access, Correction, and Deletion
        </h2>
        <p>
          Under PIPEDA, you have the right to access the personal information we hold about
          you, request corrections, or request deletion. To exercise these rights, contact us at:
        </p>
        <p
          style={{
            marginTop: 10,
            padding: "12px 16px",
            background: "#1a1a2e",
            borderRadius: 6,
            fontSize: 13,
            color: "#bbb",
          }}
        >
          privacy@capline.ca
          <br />
          (Replace with actual contact email before launch)
        </p>
        <p style={{ marginTop: 10, fontSize: 13, color: "#888" }}>
          We will respond to requests within 30 days as required by PIPEDA.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>8. Changes</h2>
        <p>
          We may update this policy from time to time. Material changes will be noted on this
          page with a revised date.
        </p>
      </section>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #333" }}>
        <a href="/" style={{ color: "#6ab4f5" }}>
          ← Back to map
        </a>
        {" · "}
        <a href="/terms" style={{ color: "#6ab4f5" }}>
          Terms of Use
        </a>
      </div>
    </div>
  );
}
