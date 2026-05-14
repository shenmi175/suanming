import type { FocusArea } from "@/lib/schemas/intake";
import type { ReportStamp } from "@/lib/report/reportSchema";

type StampConfig = {
  id: string;
  label: string;
  domain: string;
  meaning: string;
  focus?: FocusArea[];
  intensity: ReportStamp["intensity"];
};

export const stampCatalog: StampConfig[] = [
  {
    id: "tianji-initial",
    label: "天机初判印",
    domain: "overall",
    meaning: "报告生成完成，核心模块已串联。",
    intensity: "high",
  },
  {
    id: "wuxing-joined",
    label: "五行参合印",
    domain: "wuxing",
    meaning: "五行侧写参与解读，并标注为象征规则。",
    intensity: "medium",
  },
  {
    id: "stars-checked",
    label: "星盘校验印",
    domain: "stars",
    meaning: "星座与生肖作为时间象征参与叙事。",
    intensity: "medium",
  },
  {
    id: "iching-revealed",
    label: "易象启示印",
    domain: "iching",
    meaning: "易象 seed 已生成，当前问题有可追溯卦象。",
    intensity: "medium",
  },
  {
    id: "fengshui-symbol",
    label: "风水取象印",
    domain: "fengshui",
    meaning: "空间建议已生成，且注明非现场宅盘。",
    focus: ["fengshui"],
    intensity: "low",
  },
  {
    id: "career-light",
    label: "事业启明印",
    domain: "career",
    meaning: "事业章节已按关注领域生成。",
    focus: ["career", "study"],
    intensity: "high",
  },
  {
    id: "wealth-flow",
    label: "财运流转印",
    domain: "wealth",
    meaning: "资源流动与财务秩序章节已生成。",
    focus: ["wealth"],
    intensity: "medium",
  },
  {
    id: "love-aurora",
    label: "姻缘流光印",
    domain: "love",
    meaning: "情感/人际章节已生成，并避免绝对化断言。",
    focus: ["love", "relationships"],
    intensity: "medium",
  },
  {
    id: "review-clear",
    label: "审阅无冲印",
    domain: "review",
    meaning: "Reviewer 未发现阻断问题。",
    intensity: "high",
  },
];

export function selectStamps(input: { focusAreas: FocusArea[]; reviewerPassed?: boolean }): ReportStamp[] {
  return stampCatalog
    .filter((stamp) => {
      if (stamp.id === "review-clear") return input.reviewerPassed !== false;
      if (!stamp.focus) return true;
      return stamp.focus.some((area) => input.focusAreas.includes(area));
    })
    .map((stamp) => ({
      id: stamp.id,
      label: stamp.label,
      domain: stamp.domain,
      reason: stamp.focus
        ? `用户关注 ${stamp.focus.map((area) => area).join(" / ")}，${stamp.meaning}`
        : stamp.meaning,
      intensity: stamp.intensity,
    }));
}
