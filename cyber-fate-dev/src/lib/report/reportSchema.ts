import { z } from "zod";

export const StampIntensitySchema = z.enum(["low", "medium", "high"]);
export const ReviewSeveritySchema = z.enum(["low", "medium", "high"]);

export const ReportSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional(),
});

export const ReportChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  sealName: z.string().optional(),
  summary: z.string(),
  sections: z.array(ReportSectionSchema).min(1),
});

export const ReportStampSchema = z.object({
  id: z.string(),
  label: z.string(),
  domain: z.string(),
  reason: z.string(),
  intensity: StampIntensitySchema,
});

export const CyberFateReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  generatedAt: z.string(),
  entertainmentNotice: z.string(),
  userProfile: z.object({
    displayName: z.string(),
    birthDate: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
    currentCity: z.string().optional(),
    focusAreas: z.array(z.string()),
    uncertaintyNotes: z.array(z.string()),
  }),
  signals: z.object({
    westernZodiac: z.string().optional(),
    chineseZodiac: z.string().optional(),
    wuxingProfile: z
      .object({
        dominantElements: z.array(z.string()),
        lackingElements: z.array(z.string()),
        notes: z.array(z.string()),
      })
      .optional(),
    ichingHexagram: z
      .object({
        name: z.string(),
        number: z.number().optional(),
        theme: z.string(),
      })
      .optional(),
    fengshuiThemes: z.array(z.string()).optional(),
  }),
  executiveSummary: z.string(),
  chapters: z.array(ReportChapterSchema).min(6),
  stamps: z.array(ReportStampSchema).min(1),
  reviewer: z.object({
    passed: z.boolean(),
    issues: z.array(
      z.object({
        severity: ReviewSeveritySchema,
        message: z.string(),
        suggestedFix: z.string().optional(),
      }),
    ),
  }),
  appendix: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
    }),
  ),
});

export type CyberFateReport = z.infer<typeof CyberFateReportSchema>;
export type ReportChapter = z.infer<typeof ReportChapterSchema>;
export type ReportStamp = z.infer<typeof ReportStampSchema>;
