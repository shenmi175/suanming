import { z } from "zod";
import { IntakeProfileSchema } from "@/lib/schemas/intake";
import { CyberFateReportSchema } from "@/lib/report/reportSchema";

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);

export const CalculatedSignalSchema = z.object({
  id: z.string(),
  module: z.string(),
  label: z.string(),
  value: z.string(),
  confidence: ConfidenceSchema,
  notes: z.array(z.string()).default([]),
});

export const ResearchNoteSchema = z.object({
  id: z.string(),
  system: z.string(),
  topic: z.string(),
  claim: z.string(),
  interpretiveUse: z.string(),
  source: z.string(),
  confidence: ConfidenceSchema.default("medium"),
});

export const InterviewOutputSchema = z.object({
  profile: IntakeProfileSchema,
  missingFields: z.array(z.string()),
  userThemes: z.array(z.string()),
  readyForReport: z.boolean(),
});

export const ResearchOutputSchema = z.object({
  notes: z.array(ResearchNoteSchema),
});

export const SectionBlueprintSchema = z.object({
  chapterId: z.string(),
  title: z.string(),
  thesis: z.string(),
  signalRefs: z.array(z.string()),
  researchNoteRefs: z.array(z.string()),
  confidence: ConfidenceSchema,
});

export const FusionOutputSchema = z.object({
  coreThesis: z.string(),
  sectionBlueprints: z.array(SectionBlueprintSchema),
  conflicts: z.array(z.string()),
  uncertaintyNotes: z.array(z.string()),
});

export const CopywriterOutputSchema = CyberFateReportSchema.omit({
  id: true,
  generatedAt: true,
  reviewer: true,
});

export const ReviewOutputSchema = z.object({
  passed: z.boolean(),
  renderReady: z.boolean(),
  issues: z.array(
    z.object({
      severity: z.enum(["blocker", "major", "minor"]),
      path: z.string(),
      message: z.string(),
      requiredAction: z.string().optional(),
    }),
  ),
  requiredRevisions: z.array(z.string()).default([]),
});

export type CalculatedSignal = z.infer<typeof CalculatedSignalSchema>;
export type ResearchNote = z.infer<typeof ResearchNoteSchema>;
export type InterviewOutput = z.infer<typeof InterviewOutputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type FusionOutput = z.infer<typeof FusionOutputSchema>;
export type CopywriterOutput = z.infer<typeof CopywriterOutputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
