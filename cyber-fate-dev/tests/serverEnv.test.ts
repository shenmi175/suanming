import { afterEach, describe, expect, it } from "vitest";
import { decryptEnvSecret, encryptEnvSecret, serverEnv } from "@/lib/env/serverEnv";

const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;
const originalFrontendPort = process.env.FRONTEND_PORT;
const originalBackendCorsOrigins = process.env.BACKEND_CORS_ORIGINS;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restoreEnv("FRONTEND_ORIGIN", originalFrontendOrigin);
  restoreEnv("FRONTEND_PORT", originalFrontendPort);
  restoreEnv("BACKEND_CORS_ORIGINS", originalBackendCorsOrigins);
});

describe("server env secret encryption", () => {
  it("round-trips API secrets with AES-GCM env format", () => {
    const encrypted = encryptEnvSecret("sk-test-secret", "local-passphrase");

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(decryptEnvSecret(encrypted, "local-passphrase")).toBe("sk-test-secret");
  });

  it("rejects a wrong encryption secret", () => {
    const encrypted = encryptEnvSecret("sk-test-secret", "correct-passphrase");

    expect(() => decryptEnvSecret(encrypted, "wrong-passphrase")).toThrow("Failed to decrypt API secret");
  });
});

describe("server env CORS origins", () => {
  it("derives a split-runtime frontend allowlist by default", () => {
    delete process.env.BACKEND_CORS_ORIGINS;
    process.env.FRONTEND_ORIGIN = "http://localhost:3200";
    process.env.FRONTEND_PORT = "3200";

    expect(serverEnv.backend.corsOrigins).toEqual([
      "http://localhost:3200",
      "http://127.0.0.1:3200",
    ]);
  });

  it("uses explicit BACKEND_CORS_ORIGINS when configured", () => {
    process.env.BACKEND_CORS_ORIGINS = "https://app.example.com, http://localhost:3000 ";

    expect(serverEnv.backend.corsOrigins).toEqual([
      "https://app.example.com",
      "http://localhost:3000",
    ]);
  });
});
