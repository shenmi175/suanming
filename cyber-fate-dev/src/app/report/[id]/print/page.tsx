import { notFound } from "next/navigation";
import { ReportPrint } from "@/components/report/ReportPrint";
import { getReportFromBackend } from "@/lib/frontend/backendApi";

export default async function ReportPrintPage({ params }: { params: { id: string } }) {
  const report = await getReportFromBackend(params.id);
  if (!report) notFound();

  return <ReportPrint report={report} />;
}
