// @ts-ignore env-utils is an ESM command helper used by local scripts.
import { loadLocalEnv } from "./env-utils.mjs";
import { searchWebForQuery } from "../src/lib/research/webResearch";

loadLocalEnv();

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error("Usage: pnpm research:search \"搜索关键词\"");
  process.exit(1);
}

async function main() {
  const result = await searchWebForQuery({ query });
  console.log(JSON.stringify({
    query: result.query,
    provider: result.provider,
    copyrightNotice: result.copyrightNotice,
    usableSources: result.notes.length,
    results: result.results.map((item) => ({
      status: item.status,
      qualityScore: item.qualityScore,
      title: item.title,
      url: item.url,
      excerpt: item.excerpt.slice(0, 700),
      error: item.error,
    })),
    notes: result.notes,
  }, null, 2));
}

void main();
