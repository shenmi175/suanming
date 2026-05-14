import type { CyberFateReport } from "@/lib/report/reportSchema";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderReportHtml(report: CyberFateReport) {
  const chapters = report.chapters
    .map(
      (chapter) => `
        <section class="page chapter">
          <div class="chapter-head">
            <div>
              <p class="kicker">${escapeHtml(chapter.id)}</p>
              <h2>${escapeHtml(chapter.title)}</h2>
              <p class="summary">${escapeHtml(chapter.summary)}</p>
            </div>
            ${chapter.sealName ? `<div class="seal">${escapeHtml(chapter.sealName)}</div>` : ""}
          </div>
          ${chapter.sections
            .map(
              (section) => `
                <div class="section">
                  <h3>${escapeHtml(section.heading)}</h3>
                  <p>${escapeHtml(section.body)}</p>
                  ${
                    section.bullets
                      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
                      : ""
                  }
                </div>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");

  const stamps = report.stamps
    .map(
      (stamp) => `
        <div class="stamp-card">
          <div class="seal">${escapeHtml(stamp.label)}</div>
          <p>${escapeHtml(stamp.reason)}</p>
        </div>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.subtitle)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f4eddf;
      color: #170f0b;
      font-family: "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 22mm;
      break-after: page;
      position: relative;
      overflow: hidden;
    }
    .cover {
      background:
        linear-gradient(90deg, rgba(213,68,47,.08) 1px, transparent 1px),
        linear-gradient(rgba(46,230,166,.08) 1px, transparent 1px),
        #140f0b;
      background-size: 12mm 12mm;
      color: #f4eddf;
    }
    .cover::after {
      content: "";
      position: absolute;
      right: -24mm;
      bottom: -24mm;
      width: 120mm;
      height: 120mm;
      border: 1px solid rgba(46,230,166,.45);
      transform: rotate(45deg);
    }
    .kicker {
      color: #d5442f;
      font-size: 10px;
      letter-spacing: .24em;
      text-transform: uppercase;
      margin: 0 0 12px;
    }
    .cover .kicker { color: #2ee6a6; }
    h1 {
      font-family: Georgia, "SimSun", serif;
      font-size: 54px;
      line-height: 1.08;
      margin: 34mm 0 0;
      max-width: 150mm;
    }
    h2 {
      font-family: Georgia, "SimSun", serif;
      font-size: 32px;
      line-height: 1.2;
      margin: 0;
    }
    h3 {
      color: #d5442f;
      font-size: 15px;
      margin: 0 0 8px;
    }
    p {
      line-height: 1.78;
    }
    .summary {
      font-size: 17px;
      color: rgba(23,15,11,.72);
    }
    .cover .summary { color: rgba(244,237,223,.82); max-width: 145mm; font-size: 19px; }
    .cover-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 34mm;
      padding-top: 10mm;
      border-top: 1px solid rgba(244,237,223,.2);
      font-size: 13px;
    }
    .chapter-head {
      display: grid;
      grid-template-columns: 1fr 30mm;
      gap: 12mm;
      align-items: start;
      border-bottom: 1px solid rgba(23,15,11,.12);
      padding-bottom: 10mm;
      margin-bottom: 10mm;
    }
    .section {
      margin: 0 0 9mm;
    }
    ul {
      margin: 4mm 0 0;
      padding-left: 5mm;
    }
    li {
      margin-bottom: 2mm;
      line-height: 1.6;
    }
    .seal {
      width: 26mm;
      height: 26mm;
      border: 1px solid rgba(213,68,47,.72);
      color: #d5442f;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 3mm;
      font-family: Georgia, "SimSun", serif;
      font-weight: 700;
      line-height: 1.25;
      box-shadow: inset 0 0 0 1px rgba(213,68,47,.25);
    }
    .stamp-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7mm;
      margin-top: 12mm;
    }
    .stamp-card {
      border: 1px solid rgba(213,68,47,.28);
      padding: 6mm;
      min-height: 54mm;
    }
    .stamp-card p {
      font-size: 12px;
    }
    .notice {
      color: rgba(244,237,223,.72);
      max-width: 140mm;
      margin-top: 8mm;
    }
    .cover-art {
      width: 74mm;
      height: 74mm;
      margin-top: 10mm;
      border: 1px solid rgba(46,230,166,.32);
      object-fit: cover;
    }
  </style>
</head>
<body>
  <section class="page cover">
    <p class="kicker">Cyber Fate / 赛博天命局</p>
    <h1>${escapeHtml(report.subtitle)}</h1>
    <p class="summary">${escapeHtml(report.executiveSummary)}</p>
    ${
      report.coverImage?.dataUrl
        ? `<img class="cover-art" src="${escapeHtml(report.coverImage.dataUrl)}" alt="${escapeHtml(report.coverImage.altText)}" />`
        : ""
    }
    <p class="notice">${escapeHtml(report.entertainmentNotice)}</p>
    <div class="cover-meta">
      <p>天机编号<br />${escapeHtml(report.id)}</p>
      <p>生成时间<br />${escapeHtml(new Date(report.generatedAt).toLocaleString("zh-CN"))}</p>
      <p>星座 / 生肖<br />${escapeHtml(`${report.signals.westernZodiac ?? ""} / ${report.signals.chineseZodiac ?? ""}`)}</p>
      <p>易象<br />${escapeHtml(`${report.signals.ichingHexagram?.number ?? ""}. ${report.signals.ichingHexagram?.name ?? ""}`)}</p>
    </div>
  </section>
  <section class="page">
    <p class="kicker">Contents</p>
    <h2>目录</h2>
    ${report.chapters
      .map((chapter, index) => `<p>${String(index + 1).padStart(2, "0")} · ${escapeHtml(chapter.title)}</p>`)
      .join("")}
  </section>
  ${chapters}
  <section class="page">
    <p class="kicker">Stamps & Appendix</p>
    <h2>印章与附录</h2>
    <div class="stamp-grid">${stamps}</div>
    ${report.appendix
      .map((item) => `<div class="section"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div>`)
      .join("")}
  </section>
</body>
</html>`;
}
