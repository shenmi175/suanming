import type { CyberFateReport } from "@/lib/report/reportSchema";
import { Seal } from "./Seal";

export function ReportPrint({ report }: { report: CyberFateReport }) {
  return (
    <main className="bg-paper text-ink">
      <section className="min-h-screen px-14 py-16">
        <p className="text-xs uppercase tracking-[0.32em] text-cinnabar">Cyber Fate / 赛博天命局</p>
        <h1 className="mt-12 font-serif text-6xl leading-tight">{report.subtitle}</h1>
        <p className="mt-8 max-w-2xl text-xl leading-9">{report.executiveSummary}</p>
        <div className="mt-12 flex gap-6">
          {report.stamps.slice(0, 4).map((stamp) => (
            <Seal key={stamp.id} label={stamp.label} intensity={stamp.intensity} />
          ))}
        </div>
        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/20 pt-8 text-sm">
          <p>天机编号：{report.id}</p>
          <p>生成时间：{new Date(report.generatedAt).toLocaleString("zh-CN")}</p>
          <p>对象：{report.userProfile.displayName}</p>
          <p>领域：{report.userProfile.focusAreas.join("、")}</p>
        </div>
        <p className="mt-10 text-sm text-ink/60">{report.entertainmentNotice}</p>
      </section>

      <section className="break-before-page px-14 py-12">
        <h2 className="font-serif text-4xl">目录</h2>
        <ol className="mt-8 grid gap-3 text-lg">
          {report.chapters.map((chapter, index) => (
            <li key={chapter.id} className="flex justify-between border-b border-ink/10 pb-2">
              <span>
                {String(index + 1).padStart(2, "0")} {chapter.title}
              </span>
              <span>{chapter.sealName ?? "未盖章"}</span>
            </li>
          ))}
        </ol>
      </section>

      {report.chapters.map((chapter) => (
        <section key={chapter.id} className="break-before-page px-14 py-12">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/45">{chapter.id}</p>
              <h2 className="mt-3 font-serif text-4xl">{chapter.title}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/75">{chapter.summary}</p>
            </div>
            {chapter.sealName ? <Seal label={chapter.sealName} /> : null}
          </div>
          <div className="mt-10 space-y-6">
            {chapter.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-lg font-bold text-cinnabar">{section.heading}</h3>
                <p className="mt-2 leading-8 text-ink/82">{section.body}</p>
                {section.bullets ? (
                  <ul className="mt-3 grid gap-2 text-sm text-ink/70">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>· {bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="break-before-page px-14 py-12">
        <h2 className="font-serif text-4xl">印章与附录</h2>
        <div className="mt-8 grid grid-cols-3 gap-5">
          {report.stamps.map((stamp) => (
            <div key={stamp.id} className="border border-cinnabar/30 p-4">
              <Seal label={stamp.label} intensity={stamp.intensity} />
              <p className="mt-4 text-sm leading-6">{stamp.reason}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 space-y-5">
          {report.appendix.map((item) => (
            <div key={item.title}>
              <h3 className="font-bold text-cinnabar">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
