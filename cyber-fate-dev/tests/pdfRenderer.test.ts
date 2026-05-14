import { describe, expect, it } from "vitest";
import { renderReportHtml } from "@/lib/pdf/renderReportHtml";
import { sampleReport } from "@/lib/report/sampleReport";

describe("PDF HTML renderer", () => {
  it("generates non-empty HTML with report content", () => {
    const html = renderReportHtml(sampleReport);

    expect(html.length).toBeGreaterThan(5000);
    expect(html).toContain("赛博天命局");
    expect(html).toContain("印章与附录");
  });
});
