import { NextResponse } from "next/server";
import { generateReportPdf } from "@/lib/pdf/generatePdf";
import { getReport } from "@/lib/report/reportStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const report = await getReport(params.id);
  if (!report) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });

  try {
    const pdf = await generateReportPdf(report);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "PDF_GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown PDF generation error.",
      },
      { status: 500 },
    );
  }
}
