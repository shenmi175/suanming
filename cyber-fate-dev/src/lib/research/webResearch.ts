import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import iconv from "iconv-lite";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from "undici";
import { z } from "zod";
import { queryPostgres, postgresEnabled } from "@/lib/db/postgres";
import { serverEnv } from "@/lib/env/serverEnv";
import type { ResearchNote } from "@/lib/agents/schemas";
import { focusAreaLabels, type IntakeProfile } from "@/lib/schemas/intake";

const cacheDir = path.join(process.cwd(), ".cyber-fate-data", "web-research-cache");

const SearxngResponseSchema = z.object({
  results: z.array(z.object({
    title: z.string().optional(),
    url: z.string().optional(),
    content: z.string().optional(),
    engine: z.string().optional(),
    score: z.number().optional(),
  })).default([]),
});

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
  score?: number;
}

export interface ExtractedArticle {
  title: string;
  text: string;
  excerpt: string;
  qualityScore: number;
  status: "ok" | "low_quality";
  reason?: string;
}

export interface WebPageResult {
  url: string;
  title: string;
  excerpt: string;
  text: string;
  qualityScore: number;
  status: "ok" | "failed" | "low_quality";
  error?: string;
  source?: WebSearchResult;
  retrievedAt: string;
}

export interface WebResearchResult {
  query: string;
  provider: string;
  copyrightNotice: string;
  results: WebPageResult[];
  notes: ResearchNote[];
}

let webDispatcher: Dispatcher | undefined;
let webDispatcherUrl: string | undefined;

function nowIso() {
  return new Date().toISOString();
}

function ttlDate(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function cacheKey(...parts: string[]) {
  return sha256(parts.join("\u0000"));
}

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { expiresAt?: string; value?: T };
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) return null;
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

async function writeJsonFile<T>(file: string, value: T, expiresAt: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ value, expiresAt }, null, 2), "utf8");
}

function getWebDispatcher() {
  const proxyUrl = serverEnv.webResearch.fetchProxyUrl
    || serverEnv.network.httpsProxy
    || serverEnv.network.httpProxy;
  if (!proxyUrl) return undefined;
  if (webDispatcher && webDispatcherUrl === proxyUrl) return webDispatcher;
  webDispatcher = new ProxyAgent(proxyUrl);
  webDispatcherUrl = proxyUrl;
  return webDispatcher;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeText(text: string) {
  const seen = new Set<string>();
  const lines = text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => {
      if (line.length <= 2) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return lines.join("\n").trim();
}

function normalizeCharset(value?: string | null) {
  const charset = value?.trim().toLowerCase().replace(/^["']|["']$/g, "");
  if (!charset) return "utf-8";
  if (charset === "gb2312" || charset === "gbk" || charset === "gb18030") return "gb18030";
  if (charset === "utf8") return "utf-8";
  return charset;
}

function charsetFromHtml(buffer: Buffer) {
  const head = buffer.subarray(0, Math.min(buffer.byteLength, 4096)).toString("latin1");
  return /<meta[^>]+charset=["']?\s*([^"'>\s/]+)/i.exec(head)?.[1]
    ?? /<meta[^>]+content=["'][^"']*charset=([^"'>\s;]+)/i.exec(head)?.[1];
}

function decodeHtml(buffer: Buffer, contentType: string) {
  const headerCharset = /charset=([^;\s]+)/i.exec(contentType)?.[1];
  const charset = normalizeCharset(headerCharset ?? charsetFromHtml(buffer));
  if (charset === "utf-8" || charset === "utf-16le") {
    return buffer.toString(charset);
  }

  if (iconv.encodingExists(charset)) {
    return iconv.decode(buffer, charset);
  }

  return buffer.toString("utf8");
}

function domFallbackText(document: Document) {
  for (const selector of [
    "script",
    "style",
    "noscript",
    "svg",
    "canvas",
    "iframe",
    "form",
    "button",
    "nav",
    "footer",
    "aside",
    "[class*=ad]",
    "[id*=ad]",
    "[class*=advert]",
    "[id*=advert]",
    "[class*=cookie]",
    "[id*=cookie]",
  ]) {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  }

  return document.body?.textContent ?? "";
}

function articleQualityScore(input: {
  title: string;
  text: string;
  snippet?: string;
}) {
  const text = input.text;
  const charCount = text.length;
  const paragraphs = text.split(/\n+/).filter((line) => line.length >= 40).length;
  const lines = text.split(/\n+/).filter(Boolean);
  const uniqueRatio = lines.length === 0 ? 0 : new Set(lines.map((line) => line.toLowerCase())).size / lines.length;
  const adHits = [
    "广告",
    "免责声明",
    "版权所有",
    "cookie",
    "登录",
    "注册",
    "分享",
    "相关阅读",
    "点击下载",
    "APP",
  ].filter((term) => text.toLowerCase().includes(term.toLowerCase())).length;

  let score = 0;
  score += Math.min(35, Math.floor(charCount / 80));
  score += Math.min(25, paragraphs * 4);
  score += input.title ? 10 : 0;
  score += uniqueRatio >= 0.75 ? 15 : Math.floor(uniqueRatio * 15);

  if (input.snippet) {
    const snippetTokens = input.snippet
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2)
      .slice(0, 8);
    const matches = snippetTokens.filter((token) => text.includes(token)).length;
    score += Math.min(10, matches * 2);
  }

  score -= Math.min(25, adHits * 4);
  if (charCount < 300) score -= 30;
  if (paragraphs < 2) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function extractReadableArticle(input: {
  html: string;
  url: string;
  fallbackTitle?: string;
  snippet?: string;
  maxChars?: number;
}): ExtractedArticle {
  const dom = new JSDOM(input.html, { url: input.url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const fallbackDom = new JSDOM(input.html, { url: input.url });
  const title = normalizeText(article?.title || input.fallbackTitle || fallbackDom.window.document.title || "未命名网页")
    .replace(/\n/g, " ")
    .slice(0, 180);
  const rawText = article?.textContent || domFallbackText(fallbackDom.window.document);
  const maxChars = input.maxChars ?? serverEnv.webResearch.fetchMaxChars;
  const text = normalizeText(rawText).slice(0, maxChars);
  const qualityScore = articleQualityScore({ title, text, snippet: input.snippet });
  const excerpt = text.slice(0, Math.min(900, text.length));
  const status = (qualityScore >= 45 || (qualityScore >= 38 && text.length >= 900)) && text.length >= 300
    ? "ok"
    : "low_quality";

  return {
    title,
    text,
    excerpt,
    qualityScore,
    status,
    reason: status === "ok" ? undefined : "正文过短、段落不足或疑似导航/广告内容占比过高。",
  };
}

async function getCachedSearch(provider: string, query: string) {
  const key = cacheKey(provider, query);
  if (postgresEnabled()) {
    const result = await queryPostgres<{ results: unknown }>(
      "SELECT results FROM web_search_cache WHERE cache_key = $1 AND expires_at > now() LIMIT 1",
      [key],
    );
    return result.rows[0]?.results as WebSearchResult[] | undefined;
  }

  return readJsonFile<WebSearchResult[]>(path.join(cacheDir, "search", `${key}.json`));
}

async function saveCachedSearch(provider: string, query: string, results: WebSearchResult[]) {
  const key = cacheKey(provider, query);
  const expiresAt = ttlDate(serverEnv.webResearch.searchCacheTtlHours);
  if (postgresEnabled()) {
    await queryPostgres(
      `
        INSERT INTO web_search_cache (cache_key, provider, query, results, expires_at)
        VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz)
        ON CONFLICT (cache_key)
        DO UPDATE SET results = EXCLUDED.results, created_at = now(), expires_at = EXCLUDED.expires_at
      `,
      [key, provider, query, JSON.stringify(results), expiresAt],
    );
    return;
  }

  await writeJsonFile(path.join(cacheDir, "search", `${key}.json`), results, expiresAt);
}

async function getCachedPage(url: string) {
  if (postgresEnabled()) {
    const result = await queryPostgres<{
      url: string;
      status: WebPageResult["status"];
      title: string | null;
      excerpt: string | null;
      text: string | null;
      quality_score: number;
      error: string | null;
      source: unknown;
      retrieved_at: Date;
    }>(
      "SELECT * FROM web_page_cache WHERE url = $1 AND expires_at > now() LIMIT 1",
      [url],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      url: row.url,
      title: row.title ?? "",
      excerpt: row.excerpt ?? "",
      text: row.text ?? "",
      qualityScore: row.quality_score,
      status: row.status,
      error: row.error ?? undefined,
      source: row.source as WebSearchResult | undefined,
      retrievedAt: row.retrieved_at.toISOString(),
    } satisfies WebPageResult;
  }

  return readJsonFile<WebPageResult>(path.join(cacheDir, "pages", `${cacheKey(url)}.json`));
}

async function saveCachedPage(page: WebPageResult) {
  const expiresAt = ttlDate(page.status === "ok" ? serverEnv.webResearch.pageCacheTtlHours : 1);
  if (postgresEnabled()) {
    await queryPostgres(
      `
        INSERT INTO web_page_cache
          (url, status, title, excerpt, text, quality_score, error, source, retrieved_at, expires_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz)
        ON CONFLICT (url)
        DO UPDATE SET
          status = EXCLUDED.status,
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          text = EXCLUDED.text,
          quality_score = EXCLUDED.quality_score,
          error = EXCLUDED.error,
          source = EXCLUDED.source,
          retrieved_at = EXCLUDED.retrieved_at,
          expires_at = EXCLUDED.expires_at
      `,
      [
        page.url,
        page.status,
        page.title,
        page.excerpt,
        page.text,
        page.qualityScore,
        page.error ?? null,
        JSON.stringify(page.source ?? null),
        page.retrievedAt,
        expiresAt,
      ],
    );
    return;
  }

  await writeJsonFile(path.join(cacheDir, "pages", `${cacheKey(page.url)}.json`), page, expiresAt);
}

export async function searchSearxng(query: string, limit = serverEnv.webResearch.maxResults) {
  const cached = await getCachedSearch("searxng", query);
  if (cached) return cached.slice(0, limit);

  const baseUrl = trimTrailingSlash(serverEnv.webResearch.searxngBaseUrl);
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("language", serverEnv.webResearch.searxngLanguage);

  const response = await undiciFetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": serverEnv.webResearch.fetchUserAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`SearXNG search failed ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }

  const payload = SearxngResponseSchema.parse(await response.json());
  const seen = new Set<string>();
  const results = payload.results
    .flatMap((item) => {
      if (!item.url || !isHttpUrl(item.url)) return [];
      if (seen.has(item.url)) return [];
      seen.add(item.url);
      return [{
        title: item.title?.trim() || item.url,
        url: item.url,
        snippet: item.content?.trim() || "",
        engine: item.engine,
        score: item.score,
      } satisfies WebSearchResult];
    })
    .slice(0, limit);

  await saveCachedSearch("searxng", query, results);
  return results;
}

async function fetchPage(result: WebSearchResult): Promise<WebPageResult> {
  const cached = await getCachedPage(result.url);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = windowlessSetTimeout(() => controller.abort(), serverEnv.webResearch.fetchTimeoutMs);
  const retrievedAt = nowIso();

  try {
    const response = await undiciFetch(result.url, {
      signal: controller.signal,
      dispatcher: getWebDispatcher(),
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6",
        "User-Agent": serverEnv.webResearch.fetchUserAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > serverEnv.webResearch.fetchMaxBytes) {
      throw new Error(`Response too large: ${contentLength} bytes`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > serverEnv.webResearch.fetchMaxBytes) {
      throw new Error(`Response too large: ${buffer.byteLength} bytes`);
    }

    const article = extractReadableArticle({
      html: decodeHtml(buffer, contentType),
      url: result.url,
      fallbackTitle: result.title,
      snippet: result.snippet,
    });

    const page = {
      url: result.url,
      title: article.title,
      excerpt: article.excerpt,
      text: article.text,
      qualityScore: article.qualityScore,
      status: article.status,
      error: article.reason,
      source: result,
      retrievedAt,
    } satisfies WebPageResult;
    await saveCachedPage(page);
    return page;
  } catch (error) {
    const page = {
      url: result.url,
      title: result.title,
      excerpt: result.snippet,
      text: "",
      qualityScore: 0,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      source: result,
      retrievedAt,
    } satisfies WebPageResult;
    await saveCachedPage(page);
    return page;
  } finally {
    clearTimeout(timeout);
  }
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

function confidenceForScore(score: number): ResearchNote["confidence"] {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function pageToNote(page: WebPageResult, index: number): ResearchNote {
  const source = page.source?.engine ? `web:${page.source.engine}:${page.url}` : `web:${page.url}`;
  return {
    id: `web-${sha256(page.url).slice(0, 12)}-${index + 1}`,
    system: "联网资料",
    topic: page.title || page.source?.title || "网络资料",
    claim: page.excerpt.slice(0, 420),
    interpretiveUse: [
      `来源 URL：${page.url}`,
      `质量分：${page.qualityScore}/100。`,
      "只允许摘要引用和事实核对，不得大段复制原文。",
    ].join(" "),
    source,
    confidence: confidenceForScore(page.qualityScore),
  };
}

export async function searchWebForQuery(input: {
  query: string;
  limit?: number;
  fetchLimit?: number;
}) {
  if (serverEnv.webResearch.provider !== "searxng") {
    throw new Error(`Unsupported WEB_RESEARCH_PROVIDER: ${serverEnv.webResearch.provider}`);
  }

  const searchResults = await searchSearxng(input.query, input.limit ?? serverEnv.webResearch.maxResults);
  const pages = await Promise.all(
    searchResults
      .slice(0, input.fetchLimit ?? serverEnv.webResearch.fetchLimit)
      .map((result) => fetchPage(result)),
  );
  const usablePages = pages.filter((page) => page.status === "ok");

  return {
    query: input.query,
    provider: "searxng",
    copyrightNotice: serverEnv.webResearch.copyrightNotice,
    results: pages,
    notes: usablePages.map(pageToNote),
  } satisfies WebResearchResult;
}

export function buildWebResearchQueries(profile: IntakeProfile) {
  const focus = profile.focusAreas.map((area) => focusAreaLabels[area]).join(" ");
  const city = profile.currentCity || profile.birthPlace || "";
  const baseQuestion = profile.question?.trim();
  const queries = [
    baseQuestion ? `${baseQuestion} ${city} ${focus}` : "",
    city ? `${city} ${focus} 发展趋势 生活环境` : "",
    `${new Date().getFullYear()} 今日星座运势 ${focus}`,
    `${new Date().getFullYear()} 中国新闻热点 ${focus}`,
  ].filter(Boolean);

  return Array.from(new Set(queries)).slice(0, 3);
}

export async function collectWebResearchNotes(profile: IntakeProfile) {
  if (!serverEnv.webResearch.enabled) {
    return {
      notes: [],
      searches: [],
    };
  }

  const searches = await Promise.all(
    buildWebResearchQueries(profile).map((query) => searchWebForQuery({ query })),
  );
  const notes = searches.flatMap((search) => search.notes);

  if (serverEnv.webResearch.required && notes.length < serverEnv.webResearch.minSources) {
    throw new Error(
      `WEB_RESEARCH_INSUFFICIENT: expected at least ${serverEnv.webResearch.minSources} usable sources, got ${notes.length}.`,
    );
  }

  return { notes, searches };
}
