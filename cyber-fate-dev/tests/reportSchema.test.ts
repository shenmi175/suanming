import { describe, expect, it } from "vitest";
import { CyberFateReportSchema } from "@/lib/report/reportSchema";
import { sampleReport } from "@/lib/report/sampleReport";

describe("CyberFateReportSchema", () => {
  it("parses the sample report", () => {
    expect(CyberFateReportSchema.parse(sampleReport).id).toBe("sample");
  });
});
