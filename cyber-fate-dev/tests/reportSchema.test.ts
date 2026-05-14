import { describe, expect, it } from "vitest";
import { CyberFateReportSchema } from "@/lib/report/reportSchema";
import { reportFixture } from "./fixtures/reportFixture";

describe("CyberFateReportSchema", () => {
  it("parses a complete report object", () => {
    expect(CyberFateReportSchema.parse(reportFixture).id).toBe("CF-TEST-000001");
  });
});
