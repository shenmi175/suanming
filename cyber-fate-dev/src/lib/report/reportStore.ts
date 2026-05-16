import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { postgresEnabled, queryPostgres } from "@/lib/db/postgres";
import { CyberFateReportSchema, type CyberFateReport } from "./reportSchema";

const dataDir = path.join(process.cwd(), ".cyber-fate-data", "reports");

function reportPath(id: string) {
  return path.join(dataDir, `${id}.json`);
}

export async function saveReport(report: CyberFateReport) {
  if (postgresEnabled()) {
    await queryPostgres(
      `
        INSERT INTO cyber_reports (id, report, updated_at)
        VALUES ($1, $2::jsonb, now())
        ON CONFLICT (id)
        DO UPDATE SET report = EXCLUDED.report, updated_at = now()
      `,
      [report.id, JSON.stringify(report)],
    );
    return report;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(reportPath(report.id), JSON.stringify(report, null, 2), "utf8");
  return report;
}

export async function getReport(id: string) {
  if (postgresEnabled()) {
    const result = await queryPostgres<{ report: unknown }>(
      "SELECT report FROM cyber_reports WHERE id = $1 LIMIT 1",
      [id],
    );
    const row = result.rows[0];
    return row ? CyberFateReportSchema.parse(row.report) : null;
  }

  try {
    const raw = await readFile(reportPath(id), "utf8");
    return CyberFateReportSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
