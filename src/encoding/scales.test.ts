import { describe, it, expect } from "vitest";
import { fundingToHeight } from "./scales";
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
