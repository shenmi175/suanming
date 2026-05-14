import type { FocusArea } from "@/lib/schemas/intake";

export function deriveFengshuiThemes(input: {
  currentCity?: string | null;
  homeDirection?: string | null;
  homeLayoutNotes?: string | null;
  focusAreas: FocusArea[];
}) {
  const themes = new Set<string>();

  if (input.currentCity) themes.add(`${input.currentCity}生活场域：以通勤节奏与光线稳定为先`);
  if (input.homeDirection) themes.add(`${input.homeDirection}取象：保留一处明亮、清洁、可长期维护的工作/阅读角`);
  if (input.focusAreas.includes("career") || input.focusAreas.includes("study")) {
    themes.add("书桌清明：减少桌面杂讯，让任务入口保持单一");
  }
  if (input.focusAreas.includes("wealth")) {
    themes.add("财位象征：把票据、账本、订阅与收纳合并到可复盘的位置");
  }
  if (input.focusAreas.includes("love") || input.focusAreas.includes("relationships")) {
    themes.add("关系磁场：保留双人坐席或可对话的软光区域");
  }
  if (input.homeLayoutNotes) themes.add("空间限制已记录：建议只做象征性整理，不作宅盘定论");

  themes.add("未提供户型图、坐向与现场测量时，风水建议只作为娱乐性空间取象。");

  return [...themes];
}
