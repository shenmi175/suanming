import { z } from 'zod';

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const IntakeProfileSchema = z.object({
  displayName: z.string().min(1),
  birthDate: z.string().describe('YYYY-MM-DD'),
  birthTime: z.string().nullable().optional(),
  birthTimeStatus: z.enum(['known', 'approximate', 'unknown']),
  birthTimezone: z.string().nullable().optional(),
  birthplace: z.string().nullable().optional(),
  currentCity: z.string().nullable().optional(),
  focusAreas: z.array(
    z.enum(['career', 'wealth', 'love', 'relationships', 'family', 'study', 'fengshui', 'yearTheme']),
  ),
  reportTone: z.enum(['cyber', 'classical', 'gentle', 'sharp', 'academic', 'mystic']),
  currentQuestion: z.string().nullable().optional(),
});

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
  source: z.string().optional(),
  confidence: ConfidenceSchema.default('medium'),
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

export const ReportChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  confidence: ConfidenceSchema,
  signalRefs: z.array(z.string()).default([]),
  researchNoteRefs: z.array(z.string()).default([]),
  stampIds: z.array(z.string()).default([]),
});

export const ReportStampSchema = z.object({
  id: z.string(),
  label: z.string(),
  domain: z.string(),
  reason: z.string(),
  status: z.enum(['passed', 'limited', 'needs_review']).default('passed'),
  assetPath: z.string().optional(),
});

export const CopywriterOutputSchema = z.object({
  title: z.string(),
  entertainmentNotice: z.string(),
  chapters: z.array(ReportChapterSchema),
  stamps: z.array(ReportStampSchema),
  appendix: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const ReviewIssueSchema = z.object({
  severity: z.enum(['blocker', 'major', 'minor']),
  path: z.string(),
  message: z.string(),
  requiredAction: z.string().optional(),
});

export const ReviewOutputSchema = z.object({
  passed: z.boolean(),
  renderReady: z.boolean(),
  issues: z.array(ReviewIssueSchema),
  requiredRevisions: z.array(z.string()).default([]),
});

export type IntakeProfile = z.infer<typeof IntakeProfileSchema>;
export type CalculatedSignal = z.infer<typeof CalculatedSignalSchema>;
export type ResearchNote = z.infer<typeof ResearchNoteSchema>;
export type InterviewOutput = z.infer<typeof InterviewOutputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type FusionOutput = z.infer<typeof FusionOutputSchema>;
export type CopywriterOutput = z.infer<typeof CopywriterOutputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
