"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { backendApiUrl } from "@/lib/frontend/backendApi";

export function PdfDownloadButton({ reportId }: { reportId: string }) {
  const href = useMemo(
    () => backendApiUrl(`/api/reports/${encodeURIComponent(reportId)}/pdf`, "browser"),
    [reportId],
  );

  return (
    <a
      href={href}
      className="inline-flex h-11 items-center gap-2 rounded-md bg-cinnabar px-4 text-sm font-semibold text-paper hover:bg-[#ef5a43]"
    >
      <Download className="h-4 w-4" />
      下载 PDF
    </a>
  );
}
