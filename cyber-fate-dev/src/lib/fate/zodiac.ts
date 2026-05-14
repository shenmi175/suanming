const westernZodiac = [
  { sign: "摩羯座", start: [12, 22], end: [1, 19], element: "土", theme: "结构、责任、长期主义" },
  { sign: "水瓶座", start: [1, 20], end: [2, 18], element: "风", theme: "系统、革新、群体连接" },
  { sign: "双鱼座", start: [2, 19], end: [3, 20], element: "水", theme: "感受、想象、边界感" },
  { sign: "白羊座", start: [3, 21], end: [4, 19], element: "火", theme: "启动、直觉、行动" },
  { sign: "金牛座", start: [4, 20], end: [5, 20], element: "土", theme: "价值、稳定、感官" },
  { sign: "双子座", start: [5, 21], end: [6, 21], element: "风", theme: "表达、学习、交换" },
  { sign: "巨蟹座", start: [6, 22], end: [7, 22], element: "水", theme: "照顾、记忆、安全感" },
  { sign: "狮子座", start: [7, 23], end: [8, 22], element: "火", theme: "创造、舞台、心力" },
  { sign: "处女座", start: [8, 23], end: [9, 22], element: "土", theme: "修正、秩序、服务" },
  { sign: "天秤座", start: [9, 23], end: [10, 23], element: "风", theme: "平衡、关系、审美" },
  { sign: "天蝎座", start: [10, 24], end: [11, 22], element: "水", theme: "洞察、深度、转化" },
  { sign: "射手座", start: [11, 23], end: [12, 21], element: "火", theme: "远行、信念、扩张" },
] as const;

const chineseAnimals = [
  "鼠",
  "牛",
  "虎",
  "兔",
  "龙",
  "蛇",
  "马",
  "羊",
  "猴",
  "鸡",
  "狗",
  "猪",
] as const;

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid date: ${date}`);
  return { year, month, day };
}

function isWithin(month: number, day: number, start: readonly [number, number], end: readonly [number, number]) {
  const value = month * 100 + day;
  const startValue = start[0] * 100 + start[1];
  const endValue = end[0] * 100 + end[1];

  if (startValue <= endValue) return value >= startValue && value <= endValue;
  return value >= startValue || value <= endValue;
}

export function getWesternZodiac(date: string) {
  const { month, day } = parseDateParts(date);
  const match = westernZodiac.find((item) => isWithin(month, day, item.start, item.end)) ?? westernZodiac[0];

  return {
    id: "western-zodiac",
    sign: match.sign,
    element: match.element,
    theme: match.theme,
    confidence: "high" as const,
    notes: ["按公历月日计算太阳星座，用作娱乐性性格叙事入口。"],
  };
}

export function getChineseZodiac(date: string) {
  const { year } = parseDateParts(date);
  const index = ((year - 4) % 12 + 12) % 12;
  const animal = chineseAnimals[index];

  return {
    id: "chinese-zodiac",
    animal,
    label: `${animal}年`,
    confidence: "medium" as const,
    notes: ["第一版按公历年份近似计算生肖，未处理农历新年与立春边界。"],
  };
}
