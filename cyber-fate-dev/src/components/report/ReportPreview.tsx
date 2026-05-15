import { Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CyberFateReport } from "@/lib/report/reportSchema";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { Seal } from "./Seal";

export function ReportPreview({ report }: { report: CyberFateReport }) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="border-b border-ink/10 bg-ink px-5 py-5 text-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-aurora">Cyber Fate Report</p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl">{report.subtitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-bone">{report.entertainmentNotice}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/report/${report.id}/print`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-brass/50 px-4 text-sm font-semibold text-paper hover:bg-paper/10"
            >
              <Printer className="h-4 w-4" />
              打印版
            </Link>
            <PdfDownloadButton reportId={report.id} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="border-l-4 border-cinnabar pl-4">
            <p className="text-xs uppercase tracking-[0.24em] text-ink/50">天机编号</p>
            <p className="mt-2 font-mono text-sm">{report.id}</p>
          </div>
          <div>
            <h2 className="font-serif text-2xl">命盘摘要</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ink/55">昵称</dt>
                <dd>{report.userProfile.displayName}</dd>
              </div>
              <div>
                <dt className="text-ink/55">星座 / 生肖</dt>
                <dd>
                  {report.signals.westernZodiac} / {report.signals.chineseZodiac}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">易象</dt>
                <dd>
                  {report.signals.ichingHexagram?.number}. {report.signals.ichingHexagram?.name}
                </dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {report.stamps.slice(0, 4).map((stamp) => (
              <Seal key={stamp.id} label={stamp.label} intensity={stamp.intensity} className="w-full" />
            ))}
          </div>
        </aside>

        <article className="space-y-10">
          <section className="border-b border-ink/10 pb-8">
            <p className="text-sm text-cinnabar">总览</p>
            <h2 className="mt-2 font-serif text-4xl">正在发光的参数</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/78">{report.executiveSummary}</p>
            {report.coverImage?.dataUrl ? (
              <div className="mt-6 overflow-hidden rounded-[8px] border border-ink/10 bg-ink">
                <Image
                  src={report.coverImage.dataUrl}
                  alt={report.coverImage.altText}
                  width={1024}
                  height={1024}
                  unoptimized
                  className="aspect-square w-full object-cover"
                />
              </div>
            ) : null}
          </section>

          {report.chapters.map((chapter) => (
            <section key={chapter.id} className="grid gap-5 border-b border-ink/10 pb-8 md:grid-cols-[200px_1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/45">{chapter.id}</p>
                {chapter.sealName ? <Seal label={chapter.sealName} className="mt-4 w-20" /> : null}
              </div>
              <div>
                <h2 className="font-serif text-3xl">{chapter.title}</h2>
                <p className="mt-3 text-base leading-7 text-ink/70">{chapter.summary}</p>
                <div className="mt-6 space-y-5">
                  {chapter.sections.map((section) => (
                    <div key={section.heading}>
                      <h3 className="text-sm font-bold text-cinnabar">{section.heading}</h3>
                      <p className="mt-2 leading-7 text-ink/82">{section.body}</p>
                      {section.bullets ? (
                        <ul className="mt-3 grid gap-2 text-sm text-ink/70">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="border-l border-cinnabar/50 pl-3">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          <section className="grid gap-5 md:grid-cols-[200px_1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/45">review</p>
            </div>
            <div>
              <h2 className="font-serif text-3xl">Reviewer 状态</h2>
              <p className="mt-3 text-sm text-ink/70">
                {report.reviewer.passed ? "已通过基础审阅" : "需要人工复核"}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {report.reviewer.issues.map((issue) => (
                  <li key={issue.message} className="border-l border-brass pl-3">
                    [{issue.severity}] {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </article>
      </section>
    </main>
  );
}
