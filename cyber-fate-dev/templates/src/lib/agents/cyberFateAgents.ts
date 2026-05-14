import { Agent, fileSearchTool, run, tool, webSearchTool } from '@openai/agents';
import { z } from 'zod';
import {
  CalculatedSignalSchema,
  CopywriterOutputSchema,
  FusionOutputSchema,
  IntakeProfileSchema,
  InterviewOutputSchema,
  ResearchOutputSchema,
  ReviewOutputSchema,
  type CalculatedSignal,
  type IntakeProfile,
} from './schemas';

export type CyberFateAgentOptions = {
  enableWebSearch?: boolean;
  vectorStoreId?: string;
  modelDefault?: string;
  modelInterviewer?: string;
  modelResearcher?: string;
  modelFusion?: string;
  modelCopywriter?: string;
  modelReviewer?: string;
};

export const localMetaphysicsSearchTool = tool({
  name: 'local_metaphysics_search',
  description: 'Search curated local metaphysics notes by system/topic. Replace the placeholder implementation with a content/metaphysics lookup.',
  parameters: z.object({
    systems: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(20).default(8),
  }),
  async execute({ systems = [], topics = [], limit }) {
    return {
      source: 'local:content/metaphysics',
      query: { systems, topics, limit },
      notes: [],
    };
  },
});

function model(name: string | undefined, fallback: string | undefined) {
  return name ?? fallback;
}

export function createCyberFateAgents(options: CyberFateAgentOptions = {}) {
  const modelDefault = options.modelDefault ?? process.env.OPENAI_MODEL_DEFAULT;

  const interviewer = new Agent({
    name: 'Cyber Fate Interviewer',
    model: model(options.modelInterviewer ?? process.env.OPENAI_MODEL_INTERVIEWER, modelDefault),
    instructions: [
      '你是赛博算命网站的访谈 agent。',
      '把用户信息整理成结构化 profile，最多列出缺失字段，不写最终命理文案。',
      '如果出生时间未知，标记 uncertainty，不要阻塞报告。',
    ].join('\n'),
    outputType: InterviewOutputSchema,
  });

  const researcherTools = [
    localMetaphysicsSearchTool,
    ...(options.enableWebSearch || process.env.ENABLE_WEB_SEARCH === 'true'
      ? [webSearchTool({ searchContextSize: 'medium' })]
      : []),
    ...(options.vectorStoreId ?? process.env.OPENAI_VECTOR_STORE_ID
      ? [fileSearchTool((options.vectorStoreId ?? process.env.OPENAI_VECTOR_STORE_ID)!, { maxNumResults: 5 })]
      : []),
  ];

  const researcher = new Agent({
    name: 'Cyber Fate Researcher',
    model: model(options.modelResearcher ?? process.env.OPENAI_MODEL_RESEARCHER, modelDefault),
    instructions: [
      '你是资料检索 agent。只返回 ResearchNote[]，不要写最终报告。',
      '优先使用本地知识库；只有启用 webSearchTool 时才检索实时资料。',
      '每条 note 必须说明 system、topic、claim、interpretiveUse、source。',
    ].join('\n'),
    tools: researcherTools,
    outputType: ResearchOutputSchema,
  });

  const fusion = new Agent({
    name: 'Cyber Fate Fusion Analyst',
    model: model(options.modelFusion ?? process.env.OPENAI_MODEL_FUSION, modelDefault),
    instructions: [
      '你是融合分析 agent。把用户 profile、确定性 signals、ResearchNote[] 融合成章节蓝图。',
      '区分 calculated signals 和 symbolic interpretation。',
      '遇到冲突时解释为不同视角，不要宣布某一体系绝对正确。',
    ].join('\n'),
    outputType: FusionOutputSchema,
  });

  const copywriter = new Agent({
    name: 'Cyber Fate Copywriter',
    model: model(options.modelCopywriter ?? process.env.OPENAI_MODEL_COPYWRITER, modelDefault),
    instructions: [
      '你是中文白皮书文案 agent。风格是赛博、神秘、清晰。',
      '输出结构化报告草稿，不要直接生成 PDF。',
      '避免绝对化预测；所有章节都要有 summary、body、confidence、stampIds。',
    ].join('\n'),
    outputType: CopywriterOutputSchema,
  });

  const reviewer = new Agent({
    name: 'Cyber Fate Reviewer',
    model: model(options.modelReviewer ?? process.env.OPENAI_MODEL_REVIEWER, modelDefault),
    instructions: [
      '你是审阅 agent。检查逻辑矛盾、缺失输入、过度确定性、unsupported claims、章节缺失、stamp reason 缺失、PDF render readiness。',
      '只输出 review JSON，不重写整份报告。',
    ].join('\n'),
    outputType: ReviewOutputSchema,
  });

  return { interviewer, researcher, fusion, copywriter, reviewer };
}

export async function generateCyberFateReport(input: {
  profile: IntakeProfile;
  calculatedSignals: CalculatedSignal[];
}, options: CyberFateAgentOptions = {}) {
  const agents = createCyberFateAgents(options);

  const profile = IntakeProfileSchema.parse(input.profile);
  const calculatedSignals = z.array(CalculatedSignalSchema).parse(input.calculatedSignals);

  const interview = await run(agents.interviewer, JSON.stringify({ profile }));
  const research = await run(
    agents.researcher,
    JSON.stringify({ profile: interview.finalOutput.profile, calculatedSignals }),
  );
  const fusion = await run(
    agents.fusion,
    JSON.stringify({
      profile: interview.finalOutput.profile,
      calculatedSignals,
      researchNotes: research.finalOutput.notes,
    }),
  );
  const draft = await run(
    agents.copywriter,
    JSON.stringify({
      profile: interview.finalOutput.profile,
      calculatedSignals,
      researchNotes: research.finalOutput.notes,
      blueprint: fusion.finalOutput,
    }),
  );
  const review = await run(
    agents.reviewer,
    JSON.stringify({
      profile: interview.finalOutput.profile,
      calculatedSignals,
      researchNotes: research.finalOutput.notes,
      draft: draft.finalOutput,
    }),
  );

  return {
    interview: interview.finalOutput,
    research: research.finalOutput,
    fusion: fusion.finalOutput,
    draft: draft.finalOutput,
    review: review.finalOutput,
  };
}
