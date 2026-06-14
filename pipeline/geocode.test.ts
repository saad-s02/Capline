import { normalizeAddress } from "./geocode";
it("normalizes whitespace, case, and appends Toronto context", () => {
  expect(normalizeAddress("  123  King St W ")).toBe("123 King St W, Toronto, ON, Canada");
  expect(normalizeAddress("123 King St, Toronto")).toBe("123 King St, Toronto, ON, Canada");
});
