import { existsSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const rootDir = path.resolve(appDir, "..");
const inheritedEnvKeys = new Set(Object.keys(process.env));

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
  if (!match) return null;

  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [match[1], value];
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [name, value] = parsed;
    if (inheritedEnvKeys.has(name)) continue;
    if (value === "") continue;
    process.env[name] = value;
  }
}

export function ensureLocalEnvFiles() {
  const rootEnv = path.join(rootDir, ".env");
  const rootExample = path.join(rootDir, ".env.example");
  if (!existsSync(rootEnv) && existsSync(rootExample)) {
    copyFileSync(rootExample, rootEnv);
    console.log(`Created ${rootEnv}. Fill API keys before model generation.`);
  }

  const appEnv = path.join(appDir, ".env.local");
  const appExample = path.join(appDir, ".env.example");
  if (!existsSync(appEnv) && existsSync(appExample)) {
    copyFileSync(appExample, appEnv);
    console.log(`Created ${appEnv}. Fill API keys before model generation.`);
  }
}

export function loadLocalEnv() {
  ensureLocalEnvFiles();
  loadEnvFile(path.join(rootDir, ".env"));
  loadEnvFile(path.join(rootDir, ".env.local"));
  loadEnvFile(path.join(appDir, ".env"));
  loadEnvFile(path.join(appDir, ".env.local"));
}

export function separatedEnv(mode) {
  loadLocalEnv();

  const frontendPort = process.env.FRONTEND_PORT || process.env.PORT || "3000";
  const backendPort = process.env.BACKEND_PORT || "4000";
  const frontendHost = process.env.FRONTEND_HOST || (mode === "dev" ? "0.0.0.0" : "0.0.0.0");
  const backendHost = process.env.BACKEND_HOST || "0.0.0.0";

  return {
    ...process.env,
    PORT: frontendPort,
    FRONTEND_PORT: frontendPort,
    BACKEND_PORT: backendPort,
    FRONTEND_HOST: frontendHost,
    BACKEND_HOST: backendHost,
    APP_BASE_URL: process.env.APP_BASE_URL || `http://localhost:${frontendPort}`,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || `http://localhost:${frontendPort}`,
    BACKEND_API_BASE_URL: process.env.BACKEND_API_BASE_URL || `http://127.0.0.1:${backendPort}`,
    NEXT_PUBLIC_BACKEND_PORT: process.env.NEXT_PUBLIC_BACKEND_PORT || backendPort,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  };
}

export function writeRuntimeConfig(env) {
  const publicDir = path.join(appDir, "public");
  mkdirSync(publicDir, { recursive: true });

  const config = {
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL || "",
    backendPort: env.NEXT_PUBLIC_BACKEND_PORT || env.BACKEND_PORT || "4000",
  };
  const json = JSON.stringify(config).replace(/</g, "\\u003c");

  writeFileSync(
    path.join(publicDir, "runtime-config.js"),
    `window.__CYBER_FATE_CONFIG__ = ${json};\n`,
    "utf8",
  );
}
