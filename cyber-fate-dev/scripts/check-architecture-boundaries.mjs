#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { appDir } from "./env-utils.mjs";

const frontendRoots = [
  "src/app",
  "src/components",
  "src/lib/frontend",
].map((item) => path.join(appDir, item));

const backendRoots = [
  "src/backend",
].map((item) => path.join(appDir, item));

const forbiddenFrontendPatterns = [
  { pattern: /@\/lib\/agents\b/, message: "frontend must not import agent orchestration" },
  { pattern: /@\/lib\/llm\b/, message: "frontend must not import model clients" },
  { pattern: /@\/lib\/pdf\b/, message: "frontend must not import PDF renderer/generator" },
  { pattern: /@\/lib\/env\/serverEnv\b/, message: "frontend must not import server env" },
  { pattern: /@\/lib\/report\/reportStore\b/, message: "frontend must not import report storage" },
  { pattern: /@\/backend\b/, message: "frontend must not import backend entrypoints" },
  { pattern: /fetch\(\s*["']\/api\//, message: "frontend must call backendApiUrl(), not relative Next API routes" },
];

const forbiddenBackendPatterns = [
  { pattern: /@\/app\b/, message: "backend must not import Next app routes/pages" },
  { pattern: /@\/components\b/, message: "backend must not import React components" },
  { pattern: /next\//, message: "backend must not depend on Next runtime APIs" },
];

function collectFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
      } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        results.push(next);
      }
    }
  }
  return results;
}

function checkFiles(roots, rules) {
  const errors = [];
  for (const file of roots.flatMap(collectFiles)) {
    const text = readFileSync(file, "utf8");
    const rel = path.relative(appDir, file).replaceAll("\\", "/");
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        errors.push(`${rel}: ${rule.message}`);
      }
    }
  }
  return errors;
}

function checkNoNextApiRoutes() {
  const apiDir = path.join(appDir, "src/app/api");
  if (!existsSync(apiDir)) return [];
  const files = collectFiles(apiDir);
  return files.map((file) => `${path.relative(appDir, file).replaceAll("\\", "/")}: Next API route is not allowed in split runtime`);
}

const errors = [
  ...checkFiles(frontendRoots, forbiddenFrontendPatterns),
  ...checkFiles(backendRoots, forbiddenBackendPatterns),
  ...checkNoNextApiRoutes(),
];

if (errors.length > 0) {
  console.error("Architecture boundary check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Architecture boundary check passed: frontend and backend remain separated.");
