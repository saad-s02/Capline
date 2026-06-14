import { describe, it, expect } from "vitest";
import { fundingToHeight, headcountToFootprintScale, valuationToColor, revenueToGlow } from "./scales";
describe("fundingToHeight", () => {
  it("gives the floor height to zero/unknown funding", () => {
    expect(fundingToHeight(0)).toBe(15);
    expect(fundingToHeight(null)).toBe(15);
  });
  it("is monotonic increasing", () => {
    expect(fundingToHeight(1e6)).toBeLessThan(fundingToHeight(1e8));
  });
  it("clamps so the largest does not exceed the max", () => {
    expect(fundingToHeight(1e12)).toBeLessThanOrEqual(400);
  });
  it("tempers magnitude: 100x funding is far less than 100x height", () => {
    const ratio = fundingToHeight(1e9) / fundingToHeight(1e7);
    expect(ratio).toBeLessThan(10);
  });
});

it("headcount scales footprint by area within bounds", () => {
  expect(headcountToFootprintScale(0)).toBeCloseTo(0.6, 1);
  expect(headcountToFootprintScale(10000)).toBeLessThanOrEqual(1.6);
  const a = headcountToFootprintScale(100), b = headcountToFootprintScale(400);
  expect(b - 0.6).toBeCloseTo((a - 0.6) * 2, 1);
});
it("treats unknown headcount as the footprint floor", () => {
  expect(headcountToFootprintScale(null)).toBe(headcountToFootprintScale(0));
});
it("valuation maps to a viridis hex color", () => {
  expect(valuationToColor(0)).toMatch(/^#|rgb/);
  expect(valuationToColor(1e9)).not.toEqual(valuationToColor(0));
});
it("treats unknown valuation as the dark end (same as zero)", () => {
  expect(valuationToColor(null)).toEqual(valuationToColor(0));
});
it("revenue glow is 0 when no revenue and rises with revenue", () => {
  expect(revenueToGlow(0)).toBe(0);
  expect(revenueToGlow(1e8)).toBeGreaterThan(revenueToGlow(1e6));
  expect(revenueToGlow(1e12)).toBeLessThanOrEqual(1);
});
