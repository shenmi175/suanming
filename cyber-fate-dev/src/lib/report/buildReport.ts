import { format } from "date-fns";
import type { IntakeProfile } from "@/lib/schemas/intake";

export const entertainmentNotice =
  "本报告为赛博玄学娱乐内容，仅供自我观察与灵感参考，不作为医学、法律、投资或人生重大决策依据。";

export function createReportId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CF-${format(new Date(), "yyyyMMdd-HHmmss")}-${random}`;
}

export function buildUncertaintyNotes(profile: IntakeProfile) {
  const notes: string[] = [];
  if (profile.birthTimeStatus !== "known") notes.push("出生时间未精确确认，时辰与高精度排盘相关内容只做低精度处理。");
  if (!profile.birthPlace) notes.push("未提供出生地，地域与时区相关信息只做默认处理。");
  if (!profile.currentCity) notes.push("未提供当前居住城市，空间建议以通用居家/工作场景取象。");
  notes.push("生肖按公历年份近似，未处理农历新年与立春边界。");
  notes.push("五行模块为象征规则侧写，不是专业八字排盘。");
  return notes;
}
