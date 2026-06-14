import { parseGrants } from "./oglGrants";
const csv = `recipient_legal_name,recipient_city,agreement_value,agreement_start_date
Acme Inc,Toronto,500000,2024-03-01
Beta Co,Ottawa,250000,2024-04-01`;
it("keeps only Toronto recipients and sums as funding metric", () => {
  const rows = parseGrants(csv);
  expect(rows).toHaveLength(1);
  expect(rows[0].displayName).toBe("Acme Inc");
  const f = rows[0].metrics[0];
  expect(f.metric).toBe("funding_total"); expect(f.value).toBe(500000);
  expect(f.sourceType).toBe("ogl_grant");
});
