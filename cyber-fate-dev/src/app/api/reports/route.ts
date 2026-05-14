import { NextResponse } from "next/server";
import { runCyberFatePipeline } from "@/lib/agents/runCyberFatePipeline";
import { saveReport } from "@/lib/report/reportStore";
import { IntakeProfileSchema } from "@/lib/schemas/intake";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const profile = IntakeProfileSchema.parse(json);
    const result = await runCyberFatePipeline(profile);
    await saveReport(result.report);

    return NextResponse.json({
      id: result.report.id,
      mode: result.mode,
      report: result.report,
      artifacts: result.artifacts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "REPORT_GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown report generation error.",
      },
      { status: 400 },
    );
  }
}
