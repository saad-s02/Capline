import { scalePow } from "d3-scale";
const FLOOR = 15, CAP = 400, DOMAIN_MAX = 1e10;
const height = scalePow<number, number>().exponent(0.3)
  .domain([0, DOMAIN_MAX]).range([FLOOR, CAP]).clamp(true);
export function fundingToHeight(funding: number | null): number {
  if (funding == null || funding <= 0) return FLOOR;
  return Math.round(height(funding));
}
