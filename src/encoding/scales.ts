import { scalePow, scaleSqrt, scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";
const FLOOR = 15, CAP = 400, DOMAIN_MAX = 1e10;
const height = scalePow<number, number>().exponent(0.3)
  .domain([0, DOMAIN_MAX]).range([FLOOR, CAP]).clamp(true);
export function fundingToHeight(funding: number | null): number {
  if (funding == null || funding <= 0) return FLOOR;
  return Math.round(height(funding));
}

const footprint = scaleSqrt().domain([0, 10000]).range([0.6, 1.6]).clamp(true);
export function headcountToFootprintScale(headcount: number | null): number {
  return footprint(headcount ?? 0);
}

const color = scaleSequential(interpolateViridis).domain([0, 1e10]).clamp(true);
export function valuationToColor(valuation: number | null): string {
  return color(valuation ?? 0);
}

const glow = scaleSqrt().domain([0, 1e9]).range([0, 1]).clamp(true);
export function revenueToGlow(revenue: number | null): number {
  if (revenue == null || revenue <= 0) return 0;
  return glow(revenue);
}
