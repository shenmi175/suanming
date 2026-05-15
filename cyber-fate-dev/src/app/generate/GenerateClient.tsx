"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, Clipboard, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { backendApiUrl } from "@/lib/frontend/backendApi";
import { defaultIntakeProfile, IntakeProfileSchema } from "@/lib/schemas/intake";

const steps = [
  ["Interviewer Agent", "整理访谈摘要与不确定性（与检索并行）"],
  ["Researcher Agent", "选择本地玄学知识库 notes（与访谈并行）"],
  ["Fusion Analyst Agent", "融合命理 signals 与研究 notes"],
  ["Copywriter Agent", "生成结构化中文白皮书"],
  ["Image Director Agent", "生成报告视觉提示词"],
  ["Reviewer Agent", "检查边界、章节与印章理由"],
] as const;

type ApiErrorPayload = {
  error?: string;
  message?: string;
  traceId?: string;
  occurredAt?: string;
  mode?: string;
  hint?: string;
};

export function GenerateClient() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<ApiErrorPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const progress = useMemo(() => Math.round(((activeStep + 1) / steps.length) * 100), [activeStep]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, steps.length - 1));
    }, 800);

    async function generate() {
      try {
        const raw = sessionStorage.getItem("cyberFateIntake");
        const profile = raw ? IntakeProfileSchema.parse(JSON.parse(raw)) : defaultIntakeProfile;
        const response = await fetch(backendApiUrl("/api/reports", "browser"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(async () => ({
            message: await response.text(),
          }))) as ApiErrorPayload;
          setError(payload);
          return;
        }

        const data = (await response.json()) as { id: string };
        setActiveStep(steps.length - 1);
        window.setTimeout(() => router.push(`/report/${data.id}`), 900);
      } catch (generateError) {
        setError({
          error: "CLIENT_GENERATION_ERROR",
          message: generateError instanceof Error ? generateError.message : "生成失败，请返回 intake 重试。",
          occurredAt: new Date().toISOString(),
          hint: "浏览器侧请求失败，请检查本地服务是否仍在运行。",
        });
      }
    }

    void generate();
    return () => window.clearInterval(timer);
  }, [router]);

  const feedbackText = error
    ? JSON.stringify(
        {
          error: error.error,
          message: error.message,
          traceId: error.traceId,
          occurredAt: error.occurredAt,
          mode: error.mode,
          hint: error.hint,
        },
        null,
        2,
      )
    : "";

  async function copyError() {
    await navigator.clipboard.writeText(feedbackText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-paper">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.28em] text-aurora">Pipeline</p>
        <h1 className="mt-5 font-serif text-5xl">生成命运白皮书</h1>
        <p className="mt-4 max-w-2xl leading-8 text-bone">
          当前流程使用模型生成。访谈与资料检索并行启动；报告生成后，视觉导演与审阅并行执行。模型或代理异常会直接提示，不再自动降级到本地内容。
        </p>
        <div className="mt-8">
          <Progress value={progress} />
        </div>
        <div className="mt-8 grid gap-4">
          {steps.map(([title, description], index) => {
            const completed = index < activeStep;
            const active = index === activeStep;
            return (
              <div
                key={title}
                className="grid grid-cols-[32px_1fr] gap-4 border-b border-paper/10 pb-4"
              >
                <div className="pt-1">
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6 text-aurora" />
                  ) : active ? (
                    <Loader2 className="h-6 w-6 animate-spin text-cinnabar" />
                  ) : (
                    <CircleDashed className="h-6 w-6 text-bone/60" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-bone">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {error ? (
        <div
          data-testid="model-error-toast"
          className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-40px))] rounded-[8px] border border-cinnabar/60 bg-[#1b100c] p-4 text-paper shadow-2xl shadow-cinnabar/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cinnabar">Model error</p>
              <h2 className="mt-1 font-serif text-xl">生成失败</h2>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="grid h-8 w-8 place-items-center rounded-md border border-paper/15 text-bone hover:bg-paper/10"
              aria-label="关闭错误提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-bone">{error.message}</p>
          {error.traceId ? <p className="mt-2 font-mono text-xs text-aurora">Trace: {error.traceId}</p> : null}
          {error.hint ? <p className="mt-2 text-xs leading-5 text-bone/80">{error.hint}</p> : null}
          <button
            type="button"
            onClick={copyError}
            data-testid="copy-error-feedback"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-cinnabar px-3 text-xs font-semibold text-paper hover:bg-[#ef5a43]"
          >
            <Clipboard className="h-4 w-4" />
            {copied ? "已复制" : "复制反馈信息"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
