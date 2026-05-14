import { describe, expect, it } from "vitest";
import { getIChingHexagram } from "@/lib/fate/iching";

describe("I Ching seed", () => {
  it("is stable for the same input", () => {
    const first = getIChingHexagram("same-input");
    const second = getIChingHexagram("same-input");

    expect(first.number).toBe(second.number);
    expect(first.name).toBe(second.name);
  });

  it("maps into 1..64", () => {
    const result = getIChingHexagram("boundary-check");
    expect(result.number).toBeGreaterThanOrEqual(1);
    expect(result.number).toBeLessThanOrEqual(64);
  });
});
