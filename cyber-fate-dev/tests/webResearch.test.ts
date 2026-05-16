import { describe, expect, it } from "vitest";
import { extractReadableArticle } from "@/lib/research/webResearch";

describe("web research extraction", () => {
  it("extracts readable article text and scores it usable", () => {
    const html = `
      <html>
        <head><title>今日星座观察</title></head>
        <body>
          <nav>首页 登录 注册 广告</nav>
          <article>
            <h1>今日星座观察</h1>
            <p>今天的星象主题更适合把注意力放在沟通、复盘和节奏修正上。不同星座可以从工作安排、人际互动和自我照顾三个层面观察变化。</p>
            <p>白羊座需要降低即时反应，金牛座适合整理资源，双子座可以处理积压信息，巨蟹座更适合关注家庭和居住空间的稳定感。</p>
            <p>这些内容只适合作为娱乐性参考，不应该替代医学、法律、投资或其他重大人生决策。读者应结合自己的真实处境进行判断。</p>
            <p>从年度主题来看，个人计划最好拆分成可以执行的小步骤，并在每周固定时间复盘，避免被单一情绪带动。</p>
            <p>如果把它用于白皮书生成，比较成熟的写法是说明资料来源、解释不确定性，并把星座文本放在自我观察框架下，而不是宣称某件事必然发生。</p>
            <p>这类资料还可以和城市生活、职业节奏、关系沟通等现实背景结合，形成更完整的语境摘要，让读者知道哪些内容来自网页，哪些内容来自本地规则。</p>
          </article>
          <footer>版权所有 广告合作 相关阅读</footer>
        </body>
      </html>
    `;

    const article = extractReadableArticle({
      html,
      url: "https://example.com/horoscope",
      snippet: "今日星座观察 工作安排 人际互动",
    });

    expect(article.status).toBe("ok");
    expect(article.text).toContain("星象主题");
    expect(article.text).not.toContain("广告合作");
    expect(article.qualityScore).toBeGreaterThanOrEqual(45);
  });

  it("rejects navigation-heavy pages as low quality", () => {
    const html = `
      <html>
        <head><title>导航页</title></head>
        <body>
          <nav>首页 新闻 星座 娱乐 登录 注册 广告 广告 广告</nav>
          <main>
            <a href="/a">热点一</a>
            <a href="/b">热点二</a>
            <a href="/c">热点三</a>
          </main>
          <footer>版权所有 免责声明 cookie</footer>
        </body>
      </html>
    `;

    const article = extractReadableArticle({
      html,
      url: "https://example.com/nav",
    });

    expect(article.status).toBe("low_quality");
    expect(article.qualityScore).toBeLessThan(45);
  });
});
