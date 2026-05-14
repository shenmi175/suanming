import { describe, expect, it } from "vitest";
import { runMockPipeline } from "@/lib/llm/mockPipeline";
import { defaultIntakeProfile } from "@/lib/schemas/intake";
import { CyberFateReportSchema } from "@/lib/report/reportSchema";

describe("mock pipeline", () => {
  it("generates a complete CyberFateReport", async () => {
    const result = await runMockPipeline(defaultIntakeProfile);
    const report = CyberFateReportSchema.parse(result.report);

    expect(result.mode).toBe("mock");
    expect(result.artifacts).toHaveLength(5);
    expect(report.chapters.length).toBeGreaterThanOrEqual(8);
    expect(report.stamps.length).toBeGreaterThanOrEqual(5);
  });
});
