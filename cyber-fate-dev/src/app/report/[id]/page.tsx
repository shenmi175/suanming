import { notFound } from "next/navigation";
import { ReportPreview } from "@/components/report/ReportPreview";
import { getReportFromBackend } from "@/lib/frontend/backendApi";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await getReportFromBackend(params.id);
  if (!report) notFound();

  return <ReportPreview report={report} />;
}
