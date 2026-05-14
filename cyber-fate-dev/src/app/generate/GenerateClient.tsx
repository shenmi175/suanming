"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { defaultIntakeProfile, IntakeProfileSchema } from "@/lib/schemas/intake";

const steps = [
  ["Interviewer Agent", "整理访谈摘要与不确定性"],
  ["Researcher Agent", "读取本地玄学知识库"],
  ["Fusion Analyst Agent", "融合命理 signals 与研究 notes"],
  ["Copywriter Agent", "生成结构化中文白皮书"],
  ["Reviewer Agent", "检查边界、章节与印章理由"],
] as const;

export function GenerateClient() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progress = useMemo(() => Math.round(((activeStep + 1) / steps.length) * 100), [activeStep]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, steps.length - 1));
    }, 800);

    async function generate() {
      try {
        const raw = sessionStorage.getItem("cyberFateIntake");
        const profile = raw ? IntakeProfileSchema.parse(JSON.parse(raw)) : defaultIntakeProfile;
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "生成失败");
        }

        const data = (await response.json()) as { id: string };
        setActiveStep(steps.length - 1);
        window.setTimeout(() => router.push(`/report/${data.id}`), 900);
      } catch (generateError) {
        setError(generateError instanceof Error ? generateError.message : "生成失败，请返回 intake 重试。");
      }
    }

    void generate();
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-paper">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.28em] text-aurora">Pipeline</p>
        <h1 className="mt-5 font-serif text-5xl">生成命运白皮书</h1>
        <p className="mt-4 max-w-2xl leading-8 text-bone">
          当前流程按访谈、检索、融合、写作、审阅五个角色展示。API 不可用时会自动使用本地备用管线，仍会生成完整报告与 PDF。
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
        {error ? (
          <div className="mt-8 rounded-md border border-cinnabar/50 bg-cinnabar/10 p-4 text-sm text-paper">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}
