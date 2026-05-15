#!/usr/bin/env node
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";

const encryptionPrefix = "enc:v1";
const encryptionSalt = "cyber-fate-env-v1";

function encryptEnvSecret(value, secret) {
  if (!value) throw new Error("CYBER_FATE_SECRET_TO_ENCRYPT is empty.");
  if (!secret) throw new Error("CYBER_FATE_ENV_SECRET is empty.");

  const key = scryptSync(secret, encryptionSalt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    encryptionPrefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

const secret = process.env.CYBER_FATE_ENV_SECRET;
const value = process.env.CYBER_FATE_SECRET_TO_ENCRYPT;

if (!secret || !value) {
  console.error("Usage:");
  console.error("  CYBER_FATE_ENV_SECRET=<long-passphrase> CYBER_FATE_SECRET_TO_ENCRYPT=<api-key> node scripts/encrypt-env-secret.mjs");
  process.exit(1);
}

console.log(encryptEnvSecret(value, secret));
