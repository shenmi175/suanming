import type { IntakeProfile } from "@/lib/schemas/intake";
import { getChineseZodiac, getWesternZodiac } from "./zodiac";
import { calculateWuxingProfile } from "./wuxing";
import { getIChingHexagram } from "./iching";
import { deriveFengshuiThemes } from "./fengshui";
import type { CalculatedSignal } from "@/lib/agents/schemas";

export function calculateFateSignals(profile: IntakeProfile) {
  const western = getWesternZodiac(profile.birthDate);
  const chinese = getChineseZodiac(profile.birthDate);
  const wuxing = calculateWuxingProfile({
    birthDate: profile.birthDate,
    focusAreas: profile.focusAreas,
  });
  const iching = getIChingHexagram(
    [
      profile.displayName,
      profile.birthDate,
      profile.birthTime ?? "unknown-time",
      profile.birthPlace ?? "unknown-birth-place",
      profile.currentCity ?? "unknown-current-city",
      profile.focusAreas.join(","),
      profile.question ?? "",
    ].join("|"),
  );
  const fengshuiThemes = deriveFengshuiThemes(profile);

  const calculatedSignals: CalculatedSignal[] = [
    {
      id: western.id,
      module: "western-zodiac",
      label: "西方星座",
      value: western.sign,
      confidence: western.confidence,
      notes: western.notes,
    },
    {
      id: chinese.id,
      module: "chinese-zodiac",
      label: "生肖",
      value: chinese.label,
      confidence: chinese.confidence,
      notes: chinese.notes,
    },
    {
      id: "wuxing-profile",
      module: "wuxing",
      label: "五行侧写",
      value: `主 ${wuxing.dominantElements.join("、")} / 待补 ${wuxing.lackingElements.join("、")}`,
      confidence: wuxing.confidence,
      notes: wuxing.notes,
    },
    {
      id: iching.id,
      module: "iching",
      label: "易象 seed",
      value: `${iching.number}. ${iching.name}`,
      confidence: iching.confidence,
      notes: iching.notes,
    },
    {
      id: "fengshui-themes",
      module: "fengshui",
      label: "空间取象",
      value: fengshuiThemes.slice(0, 2).join("；"),
      confidence: "low",
      notes: ["缺少户型图与坐向时仅提供低确定性的空间整理建议。"],
    },
  ];

  return {
    western,
    chinese,
    wuxing,
    iching,
    fengshuiThemes,
    calculatedSignals,
  };
}
