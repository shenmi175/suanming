import { IntakeForm } from "./IntakeForm";

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-sm uppercase tracking-[0.28em] text-aurora">Intake</p>
          <h1 className="mt-5 font-serif text-5xl leading-tight md:text-6xl">访谈式输入</h1>
          <p className="mt-5 max-w-md leading-8 text-bone">
            不需要一次性给出完整命盘信息。缺少出生时间、出生地或户型细节时，系统会自动降级并在报告附录说明。
          </p>
          <div className="mt-8 border-l border-cinnabar pl-5 text-sm leading-7 text-bone">
            <p>仅供娱乐，不作为现实决策依据。</p>
            <p>默认 mock 模式可离线生成完整样例报告。</p>
          </div>
        </div>
        <IntakeForm />
      </section>
    </main>
  );
}
