import { chromium } from "playwright";
import { existsSync } from "node:fs";
import type { CyberFateReport } from "@/lib/report/reportSchema";
import { serverEnv } from "@/lib/env/serverEnv";
import { renderReportHtml } from "./renderReportHtml";

function findSystemBrowser() {
  const configured = serverEnv.playwright.chromiumExecutablePath;
  const candidates = [
    configured,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => existsSync(candidate));
}

export async function generateReportPdf(report: CyberFateReport) {
  const executablePath = findSystemBrowser();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    const page = await browser.newPage();
    await page.setContent(renderReportHtml(report), { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
