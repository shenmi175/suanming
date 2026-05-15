import { describe, expect, it } from "vitest";
import { decryptEnvSecret, encryptEnvSecret } from "@/lib/env/serverEnv";

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
