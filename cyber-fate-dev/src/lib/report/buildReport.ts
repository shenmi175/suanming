import { format } from "date-fns";
import { focusAreaLabels, type FocusArea, type IntakeProfile } from "@/lib/schemas/intake";
import { calculateFateSignals } from "@/lib/fate/signals";
import { selectStamps } from "@/lib/fate/stamps";
import { searchLocalKnowledge } from "@/lib/research/localKnowledge";
import { CyberFateReportSchema, type CyberFateReport, type ReportChapter } from "./reportSchema";

const entertainmentNotice = "本报告为赛博玄学娱乐内容，仅供自我观察与灵感参考，不作为医学、法律、投资或人生重大决策依据。";

function createReportId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CF-${format(new Date(), "yyyyMMdd-HHmmss")}-${random}`;
}

function uncertaintyNotes(profile: IntakeProfile) {
  const notes: string[] = [];
  if (profile.birthTimeStatus !== "known") notes.push("出生时间未精确确认，时辰与高精度排盘相关内容已降级处理。");
  if (!profile.birthPlace) notes.push("未提供出生地，地域与时区相关信息只做默认处理。");
  if (!profile.currentCity) notes.push("未提供当前居住城市，空间建议以通用居家/工作场景取象。");
  notes.push("生肖按公历年份近似，未处理农历新年与立春边界。");
  notes.push("五行模块为象征规则侧写，不是专业八字排盘。");
  return notes;
}

function areaList(focusAreas: FocusArea[]) {
  return focusAreas.map((area) => focusAreaLabels[area]).join("、");
}

function chapter(input: {
  id: string;
  title: string;
  sealName?: string;
  summary: string;
  sections: ReportChapter["sections"];
}): ReportChapter {
  return input;
}

function focusChapters(profile: IntakeProfile, stamps: ReturnType<typeof selectStamps>): ReportChapter[] {
  const stampByDomain = new Map(stamps.map((stamp) => [stamp.domain, stamp.label]));
  const chapters: ReportChapter[] = [];

  if (profile.focusAreas.includes("career") || profile.focusAreas.includes("study")) {
    chapters.push(
      chapter({
        id: "career",
        title: profile.focusAreas.includes("study") ? "事业与学业：把生长写成系统" : "事业与创造力：把生长写成系统",
        sealName: stampByDomain.get("career"),
        summary: "你的行动主题偏向“先搭结构，再让表达发生”。",
        sections: [
          {
            heading: "象征解读",
            body: "木气负责伸展，金气负责裁剪。第一版把这组关系解释为：你适合把想法拆成周期、清单、作品与公开反馈，而不是只凭热情推进。",
            bullets: ["保留一个长期主线项目", "每周固定一次成果复盘", "让学习服务于可见作品"],
          },
          {
            heading: "行动提醒",
            body: "当任务过多时，先删掉不能形成作品或信用积累的分支。此处以象取意，不代表唯一职业路径。",
          },
        ],
      }),
    );
  }

  if (profile.focusAreas.includes("wealth")) {
    chapters.push(
      chapter({
        id: "wealth",
        title: "财帛与资源流动：让入口可见",
        sealName: stampByDomain.get("wealth"),
        summary: "财运章节不做投资判断，只观察资源秩序与流动习惯。",
        sections: [
          {
            heading: "象征解读",
            body: "土象征承载，水象征流动。二者一起出现时，适合把收入、订阅、账单、库存与时间成本放进同一个可查看系统。",
            bullets: ["固定一个现金流复盘日", "减少隐形订阅", "为创作或技能留出可持续预算"],
          },
          {
            heading: "边界声明",
            body: "本章节仅提供娱乐性资源管理提醒，不构成理财、税务或投资建议。",
          },
        ],
      }),
    );
  }

  if (profile.focusAreas.includes("love") || profile.focusAreas.includes("relationships")) {
    chapters.push(
      chapter({
        id: "relationships",
        title: "情感与人际磁场：把光调到可交流",
        sealName: stampByDomain.get("love"),
        summary: "关系主题强调表达温度与边界清晰并存。",
        sections: [
          {
            heading: "象征解读",
            body: "火带来可见度，水带来感受力。若只剩火，容易急于表达；若只剩水，容易过度揣测。关系中的关键是把真实需求说清楚。",
            bullets: ["重要关系中减少测试，增加具体请求", "给情绪一个缓冲窗口", "把承诺写成可执行的小动作"],
          },
          {
            heading: "行动提醒",
            body: "不要用本报告判断他人命运或替代真实沟通。关系需要双方的现实选择共同参与。",
          },
        ],
      }),
    );
  }

  if (profile.focusAreas.includes("family")) {
    chapters.push(
      chapter({
        id: "family",
        title: "家庭与内在秩序：重新定义承载",
        summary: "家庭议题适合从边界、责任分配和稳定节奏入手。",
        sections: [
          {
            heading: "象征解读",
            body: "土的主题不是无限承担，而是把承载变成可持续结构。你可以把“照顾”拆成时间、金钱、情绪与沟通四个层面逐一安排。",
          },
        ],
      }),
    );
  }

  return chapters;
}

export function buildCyberFateReport(profile: IntakeProfile, id = createReportId()): CyberFateReport {
  const signals = calculateFateSignals(profile);
  const notes = searchLocalKnowledge({
    systems: ["五行", "星座", "生肖", "易经", "风水"],
    limit: 8,
  });
  const stamps = selectStamps({ focusAreas: profile.focusAreas, reviewerPassed: true });
  const uncertainties = uncertaintyNotes(profile);
  const generatedAt = new Date().toISOString();

  const chapters: ReportChapter[] = [
    chapter({
      id: "cover",
      title: "封面：天机编号已生成",
      sealName: "天机初判印",
      summary: `${profile.displayName} 的赛博玄学白皮书已完成初始化。`,
      sections: [
        {
          heading: "报告声明",
          body: entertainmentNotice,
        },
        {
          heading: "输入回执",
          body: `关注领域：${areaList(profile.focusAreas)}。当前问题：${profile.question || "未填写具体问题，报告按综合主题生成。"}`,
        },
      ],
    }),
    chapter({
      id: "summary",
      title: "命盘摘要：正在发光的参数",
      sealName: "审阅无冲印",
      summary: `你的命运不是一条固定的线，而是一组正在发光的参数：${signals.western.sign}、${signals.chinese.label}、${signals.iching.name}卦与 ${signals.wuxing.dominantElements.join("、")} 气。`,
      sections: [
        {
          heading: "关键信号",
          body: `星座取 ${signals.western.sign}，生肖取 ${signals.chinese.label}。易象落在第 ${signals.iching.number} 卦「${signals.iching.name}」，主题为「${signals.iching.theme}」。`,
          bullets: signals.calculatedSignals.map((signal) => `${signal.label}: ${signal.value}`),
        },
        {
          heading: "不确定性",
          body: "本系统会在信息不足时降低确定性，而不是假装精准。",
          bullets: uncertainties,
        },
      ],
    }),
    chapter({
      id: "wuxing",
      title: "五行与气质：能量的主旋律",
      sealName: "五行参合印",
      summary: `当前侧写以 ${signals.wuxing.dominantElements.join("、")} 为主，${signals.wuxing.lackingElements.join("、")} 需要通过节奏与环境补位。`,
      sections: [
        {
          heading: "象征侧写",
          body: `当 ${signals.wuxing.dominantElements.join("、")} 被点亮，你更容易通过${profile.focusAreas.includes("career") ? "计划、作品与公开反馈" : "稳定节奏与清晰边界"}获得推进感。`,
          bullets: signals.wuxing.notes,
        },
        {
          heading: "资料摘录",
          body: notes
            .filter((note) => note.system === "五行")
            .map((note) => `${note.topic}: ${note.claim}`)
            .join(" "),
        },
      ],
    }),
    chapter({
      id: "stars_time",
      title: "星辰与时间：性格叙事入口",
      sealName: "星盘校验印",
      summary: `${signals.western.sign} 带来「${signals.western.theme}」的叙事气质；${signals.chinese.label} 作为年份象征参与年度主题。`,
      sections: [
        {
          heading: "星座取象",
          body: `此处把星座作为娱乐性原型语言：${signals.western.sign} 更像一组表达偏好与注意力方向，而不是固定人格标签。`,
        },
        {
          heading: "生肖取象",
          body: `${signals.chinese.label} 使用公历年份近似。若出生日期接近春节或立春，后续版本应接入成熟农历库再细化。`,
        },
      ],
    }),
    chapter({
      id: "iching",
      title: "易象启示：当前问题的变化镜头",
      sealName: "易象启示印",
      summary: `稳定 seed 指向第 ${signals.iching.number} 卦「${signals.iching.name}」：${signals.iching.theme}。`,
      sections: [
        {
          heading: "卦象主题",
          body: `「${signals.iching.name}」适合被读作处境镜头：它提醒你观察条件如何变化，而不是把结果提前钉死。`,
        },
        {
          heading: "映射到问题",
          body: profile.question
            ? `你提到「${profile.question}」。本报告将其理解为一个需要节奏、资源与关系共同校准的阶段性命题。`
            : "你没有填写具体问题，因此易象章节以未来 12 个月的综合主题展开。",
        },
      ],
    }),
    ...focusChapters(profile, stamps),
    chapter({
      id: "fengshui",
      title: "空间风水：低风险的场域整理",
      sealName: "风水取象印",
      summary: "没有户型图、坐向与现场测量时，本章节只做象征性空间建议。",
      sections: [
        {
          heading: "空间取象",
          body: signals.fengshuiThemes.join("；"),
        },
        {
          heading: "可执行调整",
          body: "把最常用的工作/学习位置清空到只剩当前任务，把票据、电子订阅、充电线与纸本资料放进固定收纳区，先让空间恢复可维护性。",
        },
      ],
    }),
    chapter({
      id: "next_12_months",
      title: "未来 12 个月主题：调试而非预言",
      summary: "未来主题不是绝对预测，而是一个适合反复校准的行动镜头。",
      sections: [
        {
          heading: "年度主线",
          body: `你的年度主题偏向「${signals.iching.theme}」。若把一年看成系统调试，重点不是一次性爆发，而是每季保留一次结构更新。`,
          bullets: ["第一季：清理承诺与工具", "第二季：公开一个可验证成果", "第三季：复盘资源流动", "第四季：收束并建立下一轮版本"],
        },
      ],
    }),
    chapter({
      id: "stamps",
      title: "算命印章页：模块通过记录",
      summary: "印章用于标记本报告启用的模块与审阅状态。",
      sections: [
        {
          heading: "已盖章",
          body: stamps.map((stamp) => `${stamp.label}：${stamp.reason}`).join(" / "),
        },
      ],
    }),
  ];

  const report = CyberFateReportSchema.parse({
    id,
    title: "Cyber Fate / 赛博天命局",
    subtitle: `${profile.displayName} 的命运白皮书`,
    generatedAt,
    entertainmentNotice,
    userProfile: {
      displayName: profile.displayName,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime || undefined,
      birthPlace: profile.birthPlace || undefined,
      currentCity: profile.currentCity || undefined,
      focusAreas: profile.focusAreas.map((area) => focusAreaLabels[area]),
      uncertaintyNotes: uncertainties,
    },
    signals: {
      westernZodiac: signals.western.sign,
      chineseZodiac: signals.chinese.label,
      wuxingProfile: {
        dominantElements: signals.wuxing.dominantElements,
        lackingElements: signals.wuxing.lackingElements,
        notes: signals.wuxing.notes,
      },
      ichingHexagram: {
        name: signals.iching.name,
        number: signals.iching.number,
        theme: signals.iching.theme,
      },
      fengshuiThemes: signals.fengshuiThemes,
    },
    executiveSummary: `这份报告以 ${areaList(profile.focusAreas)} 为重点，把星座、生肖、五行、易象与空间取象合成为一份娱乐性白皮书。系统已主动标记低确定性信息，避免把象征语言写成绝对判断。`,
    chapters,
    stamps,
    reviewer: {
      passed: true,
      issues: [
        {
          severity: "low",
          message: "第一版未接入专业农历/节气库，生肖与五行只能做近似象征。",
          suggestedFix: "后续可评估 lunar-javascript 等成熟库。",
        },
      ],
    },
    appendix: [
      {
        title: "计算说明",
        body: "Western Zodiac 按公历月日计算；生肖按公历年份近似；五行依据季节、关注领域与规则权重生成；易象由稳定 hash 映射 64 卦。",
      },
      {
        title: "知识库来源",
        body: notes.map((note) => `${note.id}(${note.source})`).join("、"),
      },
      {
        title: "娱乐声明",
        body: entertainmentNotice,
      },
    ],
  });

  return report;
}
