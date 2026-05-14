import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CyberFateReportSchema, type CyberFateReport } from "./reportSchema";
import { sampleReport } from "./sampleReport";

const dataDir = path.join(process.cwd(), ".cyber-fate-data", "reports");

function reportPath(id: string) {
  return path.join(dataDir, `${id}.json`);
}

export async function saveReport(report: CyberFateReport) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(reportPath(report.id), JSON.stringify(report, null, 2), "utf8");
  return report;
}

export async function getReport(id: string) {
  if (id === "sample") return sampleReport;

  try {
    const raw = await readFile(reportPath(id), "utf8");
    return CyberFateReportSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
