import { notFound } from "next/navigation";
import { ReportPreview } from "@/components/report/ReportPreview";
import { getReport } from "@/lib/report/reportStore";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await getReport(params.id);
  if (!report) notFound();

  return <ReportPreview report={report} />;
}
