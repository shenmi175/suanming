import type { CyberFateReport } from "@/lib/report/reportSchema";

const chapterIds = ["cover", "summary", "wuxing", "iching", "career", "stamps"];

export const reportFixture: CyberFateReport = {
  id: "CF-TEST-000001",
  title: "Cyber Fate / 赛博天命局",
  subtitle: "测试对象的命运白皮书",
  generatedAt: "2026-05-14T00:00:00.000Z",
  entertainmentNotice: "本报告为赛博玄学娱乐内容，仅供自我观察与灵感参考，不作为医学、法律、投资或人生重大决策依据。",
  userProfile: {
    displayName: "测试对象",
    birthDate: "1996-08-18",
    birthTime: "09:30",
    birthPlace: "杭州",
    currentCity: "上海",
    focusAreas: ["事业", "财帛", "空间风水"],
    uncertaintyNotes: ["测试夹具只用于 schema 与 renderer 校验。"],
  },
  signals: {
    westernZodiac: "狮子座",
    chineseZodiac: "鼠",
    wuxingProfile: {
      dominantElements: ["火", "土"],
      lackingElements: ["水"],
      notes: ["测试夹具中的象征说明。"],
    },
    ichingHexagram: {
      name: "既济",
      number: 63,
      theme: "阶段完成后的秩序维护",
    },
    fengshuiThemes: ["保持桌面明亮", "固定收纳区"],
  },
  executiveSummary: "这是一份用于自动化测试的结构化报告夹具，验证 renderer 和 schema 是否稳定。",
  chapters: chapterIds.map((id, index) => ({
    id,
    title: `测试章节 ${index + 1}`,
    sealName: index % 2 === 0 ? "天机校验印" : undefined,
    summary: "章节摘要用于测试排版。",
    sections: [
      {
        heading: "结构校验",
        body: "这段文字用于确认 HTML 和 PDF renderer 能够处理完整章节结构。",
        bullets: ["第一条", "第二条"],
      },
    ],
  })),
  stamps: [
    {
      id: "test-seal",
      label: "天机校验印",
      domain: "test",
      reason: "测试印章用于验证印章渲染。",
      intensity: "medium",
    },
  ],
  reviewer: {
    passed: true,
    issues: [],
  },
  appendix: [
    {
      title: "测试说明",
      body: "该对象只在测试环境中使用，不作为产品样例报告入口。",
    },
  ],
};
