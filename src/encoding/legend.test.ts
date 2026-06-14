import { it, expect } from "vitest";
import { buildLegend } from "./legend";
it("produces height ticks and a color ramp", () => {
  const l = buildLegend();
  expect(l.heightTicks.length).toBeGreaterThanOrEqual(3);
  expect(l.heightTicks[0]).toHaveProperty("label");
  expect(l.heightTicks[0]).toHaveProperty("meters");
  expect(l.colorStops.length).toBeGreaterThanOrEqual(3);
  expect(l.colorStops[0]).toHaveProperty("color");
});
