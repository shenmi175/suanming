import { z } from "zod";

export const focusAreaValues = [
  "career",
  "wealth",
  "love",
  "relationships",
  "family",
  "study",
  "fengshui",
  "yearTheme",
] as const;

export const focusAreaLabels: Record<(typeof focusAreaValues)[number], string> = {
  career: "事业",
  wealth: "财帛",
  love: "情感",
  relationships: "人际",
  family: "家庭",
  study: "学业",
  fengshui: "空间风水",
  yearTheme: "年度主题",
};

export const reportToneValues = ["cyber", "classical", "gentle", "sharp", "academic", "mystic"] as const;

export const reportToneLabels: Record<(typeof reportToneValues)[number], string> = {
  cyber: "赛博",
  classical: "古典",
  gentle: "温柔",
  sharp: "犀利",
  academic: "学术",
  mystic: "神秘",
};

function isValidDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const IntakeProfileSchema = z.object({
  displayName: z.string().trim().min(1, "请填写姓名或昵称").max(40, "昵称不宜超过 40 个字"),
  birthDate: z.string().refine(isValidDateString, "请使用有效日期，例如 1996-08-18"),
  birthTime: z.string().trim().optional().nullable(),
  birthTimeStatus: z.enum(["known", "approximate", "unknown"]).default("unknown"),
  birthTimezone: z.string().trim().optional().nullable().default("Asia/Shanghai"),
  birthPlace: z.string().trim().optional().nullable(),
  currentCity: z.string().trim().optional().nullable(),
  focusAreas: z.array(z.enum(focusAreaValues)).min(1, "至少选择一个关心领域"),
  reportTone: z.enum(reportToneValues).default("cyber"),
  question: z.string().trim().max(300, "问题请控制在 300 字内").optional().nullable(),
  homeDirection: z.string().trim().optional().nullable(),
  homeLayoutNotes: z.string().trim().max(300, "空间描述请控制在 300 字内").optional().nullable(),
});

export type IntakeProfile = z.infer<typeof IntakeProfileSchema>;
export type FocusArea = (typeof focusAreaValues)[number];
export type ReportTone = (typeof reportToneValues)[number];

export const defaultIntakeProfile: IntakeProfile = {
  displayName: "匿名访客",
  birthDate: "1996-08-18",
  birthTime: "09:30",
  birthTimeStatus: "approximate",
  birthTimezone: "Asia/Shanghai",
  birthPlace: "杭州",
  currentCity: "上海",
  focusAreas: ["career", "wealth", "love", "fengshui", "yearTheme"],
  reportTone: "cyber",
  question: "未来一年如何把创作、收入与生活节奏调整到更稳定的状态？",
  homeDirection: "东南",
  homeLayoutNotes: "工作桌靠窗，收纳偏少，想提升专注与资源流动感。",
};
