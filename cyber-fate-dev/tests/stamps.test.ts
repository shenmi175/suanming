import { describe, expect, it } from "vitest";
import { selectStamps } from "@/lib/fate/stamps";

describe("stamp selection", () => {
  it("selects focus-dependent stamps", () => {
    const stamps = selectStamps({ focusAreas: ["career", "wealth", "fengshui"], reviewerPassed: true });
    const ids = stamps.map((stamp) => stamp.id);

    expect(ids).toContain("career-light");
    expect(ids).toContain("wealth-flow");
    expect(ids).toContain("fengshui-symbol");
    expect(ids).toContain("review-clear");
  });

  it("does not apply review-clear when reviewer failed", () => {
    const stamps = selectStamps({ focusAreas: ["career"], reviewerPassed: false });
    expect(stamps.map((stamp) => stamp.id)).not.toContain("review-clear");
  });
});
