import type { FocusArea } from "@/lib/schemas/intake";

export type WuxingElement = "木" | "火" | "土" | "金" | "水";

const allElements: WuxingElement[] = ["木", "火", "土", "金", "水"];

const seasonElement: Record<number, WuxingElement> = {
  1: "水",
  2: "木",
  3: "木",
  4: "土",
  5: "火",
  6: "火",
  7: "土",
  8: "金",
  9: "金",
  10: "土",
  11: "水",
  12: "水",
};

const focusElementMap: Record<FocusArea, WuxingElement[]> = {
  career: ["木", "金"],
  wealth: ["土", "水"],
  love: ["火", "水"],
  relationships: ["木", "火"],
  family: ["土", "木"],
  study: ["水", "木"],
  fengshui: ["土", "金"],
  yearTheme: ["火", "水"],
};

export function calculateWuxingProfile(input: { birthDate: string; focusAreas: FocusArea[] }) {
  const month = Number(input.birthDate.split("-")[1]);
  const scores = new Map<WuxingElement, number>(allElements.map((element) => [element, 0]));
  const seasonal = seasonElement[month] ?? "土";

  scores.set(seasonal, (scores.get(seasonal) ?? 0) + 3);
  for (const area of input.focusAreas) {
    for (const element of focusElementMap[area] ?? []) {
      scores.set(element, (scores.get(element) ?? 0) + 1);
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const dominantElements = ranked.filter(([, score]) => score === ranked[0][1]).map(([element]) => element);
  const lowestScore = ranked[ranked.length - 1][1];
  const lackingElements = ranked.filter(([, score]) => score === lowestScore).map(([element]) => element);

  return {
    dominantElements,
    lackingElements,
    scores: Object.fromEntries(ranked),
    confidence: "medium" as const,
    notes: [
      `季节取象以 ${seasonal} 为主轴。`,
      "第一版五行侧写是象征规则系统，不是专业八字排盘。",
    ],
  };
}
