import { z } from "zod";
import {
  CopywriterOutputSchema,
  FusionOutputSchema,
  InterviewOutputSchema,
  ResearchOutputSchema,
  ReviewOutputSchema,
  VisualPromptOutputSchema,
  type ReviewOutput,
} from "@/lib/agents/schemas";
import { calculateFateSignals } from "@/lib/fate/signals";
import { selectStamps } from "@/lib/fate/stamps";
import { searchLocalKnowledge } from "@/lib/research/localKnowledge";
import { focusAreaLabels, IntakeProfileSchema, type FocusArea, type IntakeProfile } from "@/lib/schemas/intake";
import {
  buildUncertaintyNotes,
  createReportId,
  entertainmentNotice,
} from "@/lib/report/buildReport";
import { CyberFateReportSchema, type CyberFateReport, type ReportStamp } from "@/lib/report/reportSchema";
import { generatePerceptLeapImage } from "./perceptLeapClient";
import { perceptLeapRoleModelConfig, type AgentRole } from "./modelConfig";
import { generatePerceptLeapJson } from "./perceptLeapStructuredOutput";
import type { PipelineArtifact } from "@/lib/agents/pipelineTypes";
import { serverEnv } from "@/lib/env/serverEnv";

type SignalBundle = ReturnType<typeof calculateFateSignals>;

const ReportIdentitySchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  id: z.string(),
  generatedAt: z.string(),
  entertainmentNotice: z.string(),
});

function artifact<T>(role: AgentRole, label: string, output: T, model: string): PipelineArtifact<T> {
  return {
    role,
    label,
    status: "completed",
    output,
    createdAt: new Date().toISOString(),
    model,
  };
}

function currentShanghaiDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function focusLabels(focusAreas: FocusArea[]) {
  return focusAreas.map((area) => focusAreaLabels[area]);
}

function requiredChapterIds(profile: IntakeProfile) {
  const ids = ["cover", "summary", "wuxing", "stars_time", "iching"];
  if (profile.focusAreas.includes("career") || profile.focusAreas.includes("study")) ids.push("career");
  if (profile.focusAreas.includes("wealth")) ids.push("wealth");
  if (profile.focusAreas.includes("love") || profile.focusAreas.includes("relationships")) ids.push("relationships");
  if (profile.focusAreas.includes("family")) ids.push("family");
  ids.push("fengshui", "next_12_months", "stamps");
  return ids;
}

function reportUserProfile(profile: IntakeProfile, uncertaintyNotes: string[]) {
  return {
    displayName: profile.displayName,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || undefined,
    birthPlace: profile.birthPlace || undefined,
    currentCity: profile.currentCity || undefined,
    focusAreas: focusLabels(profile.focusAreas),
    uncertaintyNotes,
  };
}

function reportSignals(signals: SignalBundle) {
  return {
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
  };
}

function normalizeReview(review: ReviewOutput, extraIssues: CyberFateReport["reviewer"]["issues"] = []) {
  const severity = (value: ReviewOutput["issues"][number]["severity"]): CyberFateReport["reviewer"]["issues"][number]["severity"] => {
    if (value === "blocker") return "high";
    if (value === "major") return "medium";
    return "low";
  };

  return {
    passed: review.passed && review.renderReady && !review.issues.some((issue) => issue.severity === "blocker"),
    issues: [
      ...review.issues.map((issue) => ({
        severity: severity(issue.severity),
        message: `${issue.path}: ${issue.message}`,
        suggestedFix: issue.requiredAction,
      })),
      ...extraIssues,
    ],
  } satisfies CyberFateReport["reviewer"];
}

function mergeRequiredStamps(modelStamps: ReportStamp[], requiredStamps: ReportStamp[]) {
  const byId = new Map(modelStamps.map((stamp) => [stamp.id, stamp]));
  for (const stamp of requiredStamps) {
    if (!byId.has(stamp.id)) byId.set(stamp.id, stamp);
  }
  return Array.from(byId.values());
}

async function callRole<T>(input: {
  role: AgentRole;
  label: string;
  schemaName: string;
  zodSchema: z.ZodType<T>;
  system: string;
  user: unknown;
}) {
  const config = perceptLeapRoleModelConfig[input.role];
  const output = await generatePerceptLeapJson({
    model: config.model,
    schemaName: input.schemaName,
    zodSchema: input.zodSchema,
    system: input.system,
    user: input.user,
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });

  return {
    output,
    artifact: artifact(input.role, input.label, output, config.model),
  };
}

export async function runPerceptLeapPipeline(profile: IntakeProfile) {
  const reportId = createReportId();
  const generatedAt = new Date().toISOString();
  const currentDate = currentShanghaiDate();
  const signals = calculateFateSignals(profile);
  const uncertaintyNotes = buildUncertaintyNotes(profile);
  const candidateNotes = searchLocalKnowledge({
    systems: ["五行", "星座", "生肖", "易经", "风水"],
    query: profile.question ?? undefined,
    limit: 12,
  });
  const requiredStamps = selectStamps({ focusAreas: profile.focusAreas, reviewerPassed: true });
  const identity = ReportIdentitySchema.parse({
    id: reportId,
    title: "Cyber Fate / 赛博天命局",
    subtitle: `${profile.displayName} 的命运白皮书`,
    generatedAt,
    entertainmentNotice,
  });

  const interviewPromise = callRole({
    role: "interviewer",
    label: "PerceptLeap Interviewer",
    schemaName: "InterviewOutput",
    zodSchema: InterviewOutputSchema,
    system:
      "你是 Cyber Fate 的访谈整理角色。只整理用户输入、识别缺失字段、提炼主题，不写最终报告。不要改写 birthDate、focusAreas 等结构字段。",
    user: {
      currentDate,
      profile,
      rules: [
        "birthTimeStatus 不是 known 时，必须把出生时间精度列入 missingFields 或 userThemes。",
        "缺少 birthPlace/currentCity/homeLayoutNotes 时，只标记不确定性，不阻塞生成。",
        "readyForReport 只要 displayName、birthDate、focusAreas 有效就应为 true。",
      ],
    },
  });

  const researchPromise = callRole({
    role: "researcher",
    label: "PerceptLeap Researcher",
    schemaName: "ResearchOutput",
    zodSchema: ResearchOutputSchema,
    system:
      "你是 Researcher。只能从 candidateNotes 中选择、排序和少量压缩 ResearchNote；不要编造新 id、source 或未经提供的玄学资料；不要写最终报告。",
    user: {
      currentDate,
      profile,
      calculatedSignals: signals.calculatedSignals,
      candidateNotes,
      selectionTarget: "选择 6 到 10 条最适合本用户关注领域和 signals 的 notes。",
    },
  });

  const [interview, research] = await Promise.all([interviewPromise, researchPromise]);
  const artifacts: PipelineArtifact[] = [interview.artifact, research.artifact];
  const interviewProfile = IntakeProfileSchema.parse(interview.output.profile);

  const fusion = await callRole({
    role: "fusion",
    label: "PerceptLeap Fusion Analyst",
    schemaName: "FusionOutput",
    zodSchema: FusionOutputSchema,
    system:
      "你是 Fusion Analyst。把用户输入、命理 signals 和 ResearchNote 融合成章节蓝图。所有结论都应是象征性、自我观察式，不做绝对预测。",
    user: {
      currentDate,
      profile: interviewProfile,
      calculatedSignals: signals.calculatedSignals,
      researchNotes: research.output.notes,
      requiredChapterIds: requiredChapterIds(interviewProfile),
      uncertaintyNotes,
    },
  });
  artifacts.push(fusion.artifact);

  const copywriter = await callRole({
    role: "copywriter",
    label: "PerceptLeap Copywriter",
    schemaName: "CopywriterOutput",
    zodSchema: CopywriterOutputSchema,
    system:
      "你是 Cyber Fate 中文白皮书 Copywriter。必须生成全新的结构化报告文案，不要复用本地样例或模板句。风格是赛博东方玄学白皮书：有仪式感、有结构、可读，但始终承认娱乐属性和不确定性。",
    user: {
      currentDate,
      identity,
      profile: interviewProfile,
      normalizedUserProfile: reportUserProfile(interviewProfile, uncertaintyNotes),
      normalizedSignals: reportSignals(signals),
      calculatedSignals: signals.calculatedSignals,
      researchNotes: research.output.notes,
      fusion: fusion.output,
      requiredChapterIds: requiredChapterIds(interviewProfile),
      requiredStamps,
      writingRules: [
        "title 必须是 Cyber Fate / 赛博天命局。",
        "subtitle 使用用户昵称，格式接近“某某 的命运白皮书”。",
        "chapters 至少 8 章；每章至少 1 个 section；重点领域必须有独立章节。",
        "sections.body 用完整中文段落，不要只有关键词。",
        "stamps 必须解释为什么盖章，不能空泛。",
        "appendix 必须包含计算说明、资料来源、娱乐声明。",
        "不要给医学、法律、投资或重大人生决策建议。",
      ],
    },
  });
  artifacts.push(copywriter.artifact);

  let report = CyberFateReportSchema.parse({
    ...copywriter.output,
    ...identity,
    userProfile: reportUserProfile(interviewProfile, uncertaintyNotes),
    signals: reportSignals(signals),
    stamps: mergeRequiredStamps(copywriter.output.stamps, requiredStamps),
    reviewer: {
      passed: true,
      issues: [],
    },
  });

  const visualPromise = callRole({
    role: "image-director",
    label: "PerceptLeap Image Director",
    schemaName: "VisualPromptOutput",
    zodSchema: VisualPromptOutputSchema,
    system:
      "你是报告视觉导演。为 gpt-image-2 写一条封面/信息图生成提示词，图像要服务于报告，不生成不可读的长段文字。",
    user: {
      currentDate,
      reportSummary: report.executiveSummary,
      userProfile: report.userProfile,
      signals: report.signals,
      stamps: report.stamps,
      visualRules: [
        "1024x1024 方图。",
        "赛博东方玄学、黑金、霓虹青绿、朱印、白皮书封面质感。",
        "画面包含命盘参数、符号化星轨、朱印、数据层，不要做普通分栏。",
        "如出现文字，只使用少量清晰中文短标签。",
      ],
    },
  });

  const reviewPromise = callRole({
    role: "reviewer",
    label: "PerceptLeap Reviewer",
    schemaName: "ReviewOutput",
    zodSchema: ReviewOutputSchema,
    system:
      "你是 Reviewer。检查结构化报告是否章节完整、边界清晰、没有绝对断言、印章理由匹配、PDF 渲染可用。只输出审阅 JSON。",
    user: {
      currentDate,
      requiredChapterIds: requiredChapterIds(interviewProfile),
      requiredStamps,
      report,
      checks: [
        "报告必须有娱乐声明。",
        "缺少出生时间、出生地、户型图时必须有不确定性说明。",
        "不得出现保证发财、保证复合、诊断疾病、投资指令等内容。",
        "章节与印章必须服务于用户 focusAreas。",
      ],
    },
  });

  const [visual, review] = await Promise.all([visualPromise, reviewPromise]);
  artifacts.push(visual.artifact, review.artifact);

  report = CyberFateReportSchema.parse({
    ...report,
    coverImage: {
      prompt: visual.output.prompt,
      altText: visual.output.altText,
    },
  });

  if (serverEnv.perceptLeap.enableImage || serverEnv.perceptLeap.generateReportImage) {
    const image = await generatePerceptLeapImage({
      prompt: visual.output.prompt,
    });
    report = CyberFateReportSchema.parse({
      ...report,
      coverImage: {
        prompt: visual.output.prompt,
        altText: visual.output.altText,
        dataUrl: image.dataUrl,
        model: image.model,
        createdAt: new Date().toISOString(),
      },
    });
  }

  const reviewOutput = ReviewOutputSchema.parse(review.output);
  const reviewedReport = CyberFateReportSchema.parse({
    ...report,
    reviewer: normalizeReview(reviewOutput),
  });

  return {
    mode: "perceptleap" as const,
    report: reviewedReport,
    artifacts,
  };
}
