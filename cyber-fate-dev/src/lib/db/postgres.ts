import { Pool, type QueryResultRow } from "pg";
import { serverEnv } from "@/lib/env/serverEnv";

let pool: Pool | undefined;
let initialized = false;

function getPool() {
  if (!serverEnv.database.url) return undefined;
  if (!pool) {
    pool = new Pool({
      connectionString: serverEnv.database.url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export function postgresEnabled() {
  return Boolean(serverEnv.database.url);
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const activePool = getPool();
  if (!activePool) throw new Error("DATABASE_URL is not configured.");

  if (!initialized) {
    await initializePostgres();
  }

  return activePool.query<T>(text, values);
}

export async function initializePostgres() {
  const activePool = getPool();
  if (!activePool || initialized) return;

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS cyber_reports (
      id TEXT PRIMARY KEY,
      report JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS web_search_cache (
      cache_key TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      query TEXT NOT NULL,
      results JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS web_page_cache (
      url TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      title TEXT,
      excerpt TEXT,
      text TEXT,
      quality_score INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      source JSONB,
      retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      profile JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_web_search_cache_expires_at ON web_search_cache(expires_at);
    CREATE INDEX IF NOT EXISTS idx_web_page_cache_expires_at ON web_page_cache(expires_at);
    CREATE INDEX IF NOT EXISTS idx_cyber_reports_created_at ON cyber_reports(created_at);
  `);

  initialized = true;
}
