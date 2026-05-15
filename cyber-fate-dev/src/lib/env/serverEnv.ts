import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const encryptionPrefix = "enc:v1";
const encryptionSalt = "cyber-fate-env-v1";

type ImageOutputFormat = "png" | "jpeg" | "webp";

function readEnv(name: string) {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readBooleanEnv(name: string, fallback = false) {
  const value = readEnv(name);
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function readNumberEnv(name: string, fallback: number) {
  const value = Number(readEnv(name));
  return Number.isFinite(value) ? value : fallback;
}

function deriveKey(secret: string) {
  return scryptSync(secret, encryptionSalt, 32);
}

export function encryptEnvSecret(value: string, secret: string) {
  if (!value) throw new Error("Cannot encrypt an empty API secret.");
  if (!secret) throw new Error("Missing CYBER_FATE_ENV_SECRET for API secret encryption.");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    encryptionPrefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptEnvSecret(value: string, secret: string) {
  if (!secret) throw new Error("Missing CYBER_FATE_ENV_SECRET for encrypted API secret.");

  const [prefix, version, ivText, tagText, encryptedText] = value.split(":");
  if (`${prefix}:${version}` !== encryptionPrefix || !ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted API secret format. Expected enc:v1:<iv>:<tag>:<ciphertext>.");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Failed to decrypt API secret. Check CYBER_FATE_ENV_SECRET and encrypted env value.");
  }
}

function readSecretEnv(plainName: string, encryptedName: string) {
  const encrypted = readEnv(encryptedName);
  if (encrypted) {
    const encryptionSecret = readEnv("CYBER_FATE_ENV_SECRET");
    if (!encryptionSecret) {
      throw new Error(`缺少 CYBER_FATE_ENV_SECRET，无法解密 ${encryptedName}。`);
    }
    return decryptEnvSecret(encrypted, encryptionSecret);
  }

  return readEnv(plainName);
}

function readImageOutputFormat() {
  const value = readEnv("PERCEPTLEAP_IMAGE_OUTPUT_FORMAT");
  if (value === "png" || value === "jpeg" || value === "webp") return value;
  return "png" satisfies ImageOutputFormat;
}

function readCsvEnv(name: string) {
  return (readEnv(name) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const serverEnv = {
  cyberFate: {
    get llmMode() {
      return readEnv("CYBER_FATE_LLM_MODE") ?? "perceptleap";
    },
    get envSecretConfigured() {
      return Boolean(readEnv("CYBER_FATE_ENV_SECRET"));
    },
  },
  app: {
    get baseUrl() {
      return readEnv("APP_BASE_URL") ?? "http://localhost:3000";
    },
    get frontendOrigin() {
      return readEnv("FRONTEND_ORIGIN") ?? "http://localhost:3000";
    },
    get frontendPort() {
      return readEnv("FRONTEND_PORT") ?? readEnv("PORT") ?? "3000";
    },
  },
  backend: {
    get corsOrigins() {
      const configured = readCsvEnv("BACKEND_CORS_ORIGINS");
      if (configured.length > 0) return configured;

      return Array.from(new Set([
        serverEnv.app.frontendOrigin,
        `http://localhost:${serverEnv.app.frontendPort}`,
        `http://127.0.0.1:${serverEnv.app.frontendPort}`,
      ]));
    },
  },
  openAI: {
    get apiKey() {
      return readSecretEnv("OPENAI_API_KEY", "OPENAI_API_KEY_ENCRYPTED");
    },
    get enabled() {
      return readBooleanEnv("ENABLE_OPENAI", false);
    },
    get modelDefault() {
      return readEnv("OPENAI_MODEL_DEFAULT") ?? "gpt-4.1-mini";
    },
    get modelInterviewer() {
      return readEnv("OPENAI_MODEL_INTERVIEWER");
    },
    get modelResearcher() {
      return readEnv("OPENAI_MODEL_RESEARCHER");
    },
    get modelFusion() {
      return readEnv("OPENAI_MODEL_FUSION");
    },
    get modelCopywriter() {
      return readEnv("OPENAI_MODEL_COPYWRITER");
    },
    get modelReviewer() {
      return readEnv("OPENAI_MODEL_REVIEWER");
    },
    get modelImageDirector() {
      return readEnv("OPENAI_MODEL_IMAGE_DIRECTOR");
    },
    get vectorStoreId() {
      return readEnv("OPENAI_VECTOR_STORE_ID");
    },
    get webSearchEnabled() {
      return readBooleanEnv("ENABLE_WEB_SEARCH", false);
    },
  },
  perceptLeap: {
    get apiKey() {
      return readSecretEnv("PERCEPTLEAP_API_KEY", "PERCEPTLEAP_API_KEY_ENCRYPTED");
    },
    get enabled() {
      return readBooleanEnv("ENABLE_PERCEPTLEAP", true);
    },
    get baseUrl() {
      return readEnv("PERCEPTLEAP_BASE_URL") ?? "https://api.perceptleap.com/v1";
    },
    get textModel() {
      return readEnv("PERCEPTLEAP_TEXT_MODEL") ?? "gpt-5.4";
    },
    get modelInterviewer() {
      return readEnv("PERCEPTLEAP_MODEL_INTERVIEWER");
    },
    get modelResearcher() {
      return readEnv("PERCEPTLEAP_MODEL_RESEARCHER");
    },
    get modelFusion() {
      return readEnv("PERCEPTLEAP_MODEL_FUSION");
    },
    get modelCopywriter() {
      return readEnv("PERCEPTLEAP_MODEL_COPYWRITER");
    },
    get modelReviewer() {
      return readEnv("PERCEPTLEAP_MODEL_REVIEWER");
    },
    get modelImageDirector() {
      return readEnv("PERCEPTLEAP_MODEL_IMAGE_DIRECTOR");
    },
    get imageModel() {
      return readEnv("PERCEPTLEAP_IMAGE_MODEL") ?? "gpt-image-2";
    },
    get imageSize() {
      return readEnv("PERCEPTLEAP_IMAGE_SIZE") ?? "1024x1024";
    },
    get imageQuality() {
      return readEnv("PERCEPTLEAP_IMAGE_QUALITY") ?? "low";
    },
    get imageOutputFormat() {
      return readImageOutputFormat();
    },
    get enableImage() {
      return readBooleanEnv("ENABLE_PERCEPTLEAP_IMAGE", false);
    },
    get generateReportImage() {
      return readBooleanEnv("GENERATE_REPORT_IMAGE", false);
    },
    get proxyUrl() {
      return readEnv("PERCEPTLEAP_PROXY_URL");
    },
    get maxRetries() {
      return Math.max(0, readNumberEnv("PERCEPTLEAP_MAX_RETRIES", 2));
    },
  },
  playwright: {
    get chromiumExecutablePath() {
      return readEnv("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH");
    },
  },
  network: {
    get httpProxy() {
      return readEnv("HTTP_PROXY") ?? readEnv("http_proxy");
    },
    get httpsProxy() {
      return readEnv("HTTPS_PROXY") ?? readEnv("https_proxy");
    },
    get noProxy() {
      return readEnv("NO_PROXY") ?? readEnv("no_proxy");
    },
  },
};
