import { NextResponse } from "next/server";
import { getReport } from "@/lib/report/reportStore";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const report = await getReport(params.id);
  if (!report) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });

  return NextResponse.json(report);
}
