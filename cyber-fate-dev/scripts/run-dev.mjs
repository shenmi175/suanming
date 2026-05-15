#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { appDir, separatedEnv, writeRuntimeConfig } from "./env-utils.mjs";

const isWindows = process.platform === "win32";
const env = separatedEnv("dev");
writeRuntimeConfig(env);
const bin = (name) => path.join(appDir, "node_modules", ".bin", isWindows ? `${name}.cmd` : name);
const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
const spawnTool = (name, args) => {
  if (!isWindows) {
    return spawn(bin(name), args, {
      cwd: appDir,
      env,
      stdio: "inherit",
      shell: false,
    });
  }

  return spawn([quote(bin(name)), ...args.map(quote)].join(" "), {
    cwd: appDir,
    env,
    stdio: "inherit",
    shell: true,
  });
};

const children = [
  spawnTool("tsx", ["watch", "src/backend/server.ts"]),
  spawnTool("next", ["dev", "-H", env.FRONTEND_HOST || "0.0.0.0", "-p", env.FRONTEND_PORT || "3000"]),
];

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown("SIGTERM");
      process.exit(code);
    }
  });
}
