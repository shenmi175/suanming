import { notFound } from "next/navigation";
import { ReportPrint } from "@/components/report/ReportPrint";
import { getReport } from "@/lib/report/reportStore";

export default async function ReportPrintPage({ params }: { params: { id: string } }) {
  const report = await getReport(params.id);
  if (!report) notFound();

  return <ReportPrint report={report} />;
}
