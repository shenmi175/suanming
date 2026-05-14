import { defaultIntakeProfile } from "@/lib/schemas/intake";
import { buildCyberFateReport } from "./buildReport";

export const sampleReport = buildCyberFateReport(defaultIntakeProfile, "sample");
