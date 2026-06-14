import { fundingToHeight, valuationToColor } from "./scales";
export interface Legend {
  heightTicks: { label: string; meters: number }[];
  colorStops: { label: string; color: string }[];
}
export function buildLegend(): Legend {
  const fundings = [0, 1e6, 1e7, 1e8, 1e9];
  const valuations = [0, 1e8, 1e9, 1e10];
  return {
    heightTicks: fundings.map(f => ({ label: humanMoney(f), meters: fundingToHeight(f) })),
    colorStops: valuations.map(v => ({ label: humanMoney(v), color: valuationToColor(v) })),
  };
}
function humanMoney(n: number): string {
  if (n === 0) return "$0";
  if (n >= 1e9) return `$${n / 1e9}B`;
  if (n >= 1e6) return `$${n / 1e6}M`;
  return `$${n}`;
}
