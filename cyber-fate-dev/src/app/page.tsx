import { ArrowRight, FileDown, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { Seal } from "@/components/report/Seal";
import { Button } from "@/components/ui/button";

const previewChapters = ["命盘摘要", "五行与气质", "易象启示", "事业/财帛/情感", "风水取象", "印章页"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="relative grid min-h-screen overflow-hidden px-5 py-6 md:px-10">
        <div className="oracle-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_60%_42%,rgba(213,68,47,.28),transparent_28%),radial-gradient(circle_at_46%_58%,rgba(46,230,166,.16),transparent_34%)]" />
        <nav className="relative z-10 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-wide">
            Cyber Fate / 赛博天命局
          </Link>
          <Link href="/report/sample" className="text-sm text-bone hover:text-paper">
            查看样例
          </Link>
        </nav>

        <div className="relative z-10 grid items-center gap-12 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-aurora">
              <ScanLine className="h-4 w-4" />
              Local-first cyber divination
            </p>
            <h1 className="mt-6 font-serif text-6xl leading-[0.96] md:text-8xl">
              Cyber Fate
              <span className="block text-cinnabar">赛博天命局</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-bone md:text-xl">
              输入昵称、出生信息、当前城市、关心领域与问题，生成一份赛博东方玄学风格的命运白皮书。无 API key 也能用 mock 模式完成报告与 PDF。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/intake">
                <Button>
                  开始生成白皮书
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/report/sample">
                <Button variant="secondary">
                  <FileDown className="h-4 w-4" />
                  预览样例报告
                </Button>
              </Link>
            </div>
          </div>

          <div className="scanline relative rounded-[8px] border border-brass/30 bg-paper p-5 text-ink shadow-2xl shadow-cinnabar/10">
            <div className="flex items-start justify-between border-b border-ink/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cinnabar">Whitepaper Snapshot</p>
                <h2 className="mt-2 font-serif text-3xl">命运白皮书结构</h2>
              </div>
              <Seal label="天机初判印" className="w-20" />
            </div>
            <div className="mt-5 grid gap-3">
              {previewChapters.map((chapter, index) => (
                <div key={chapter} className="grid grid-cols-[40px_1fr] items-center gap-4 border-b border-ink/10 pb-3">
                  <span className="font-mono text-xs text-ink/45">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-semibold">{chapter}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Seal label="五行参合印" className="w-full" />
              <Seal label="易象启示印" className="w-full" />
              <Seal label="审阅无冲印" className="w-full" />
            </div>
          </div>
        </div>

        <div className="relative z-10 grid gap-4 border-t border-paper/10 pt-5 text-sm text-bone md:grid-cols-3">
          <p className="flex gap-2">
            <Sparkles className="h-4 w-4 text-aurora" />
            Zod schema 约束报告 JSON
          </p>
          <p>五角色 pipeline：访谈、检索、融合、写作、审阅</p>
          <p>HTML print layout + Playwright PDF 下载</p>
        </div>
      </section>
    </main>
  );
}
