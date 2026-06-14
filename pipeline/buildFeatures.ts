import type { Company, MetricName } from "../src/data/types";
import { fundingToHeight, valuationToColor, headcountToFootprintScale, revenueToGlow }
  from "../src/encoding/scales";
import { displayMetric } from "../src/data/provenance";
const val = (c: Company, m: MetricName) =>
  displayMetric(c.metrics.filter(x => x.metric === m))?.value ?? null;
export function toFeatureProps(c: Company) {
  return {
    companyId: c.id, name: c.displayName,
    height: fundingToHeight(val(c, "funding_total")),
    color: valuationToColor(val(c, "valuation")),
    footprintScale: headcountToFootprintScale(val(c, "headcount")),
    glow: revenueToGlow(val(c, "revenue")),
  };
}
