import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from "undici";
import { serverEnv } from "@/lib/env/serverEnv";

export interface PerceptLeapTextOptions {
  model: string;
  input: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface PerceptLeapImageOptions {
  model?: string;
  prompt: string;
  size?: string;
  quality?: string;
  outputFormat?: "png" | "jpeg" | "webp";
}

interface PerceptLeapResponsesPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  choices?: Array<{
    message?: {
      content?: string;
    };
    text?: string;
  }>;
}

interface PerceptLeapImagePayload {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

function apiKey() {
  const key = serverEnv.perceptLeap.apiKey;
  if (!key) throw new Error("Missing PERCEPTLEAP_API_KEY or PERCEPTLEAP_API_KEY_ENCRYPTED.");
  return key;
}

function apiUrl(pathname: string) {
  const base = serverEnv.perceptLeap.baseUrl;
  return `${base.replace(/\/$/, "")}${pathname}`;
}

let proxyDispatcher: Dispatcher | undefined;
let proxyDispatcherUrl: string | undefined;

function getDispatcher() {
  const proxyUrl = serverEnv.perceptLeap.proxyUrl || serverEnv.network.httpsProxy || serverEnv.network.httpProxy;
  if (!proxyUrl) return undefined;

  if (proxyDispatcher && proxyDispatcherUrl === proxyUrl) return proxyDispatcher;
  proxyDispatcher = new ProxyAgent(proxyUrl);
  proxyDispatcherUrl = proxyUrl;
  return proxyDispatcher;
}

function maxRetries() {
  return serverEnv.perceptLeap.maxRetries;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function postJsonOnce<T>(pathname: string, body: Record<string, unknown>) {
  const response = await undiciFetch(apiUrl(pathname), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    dispatcher: getDispatcher(),
  });

  if (!response.ok) {
    const text = await response.text();
    const detail = text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
    if (isRetryableStatus(response.status)) {
      throw new Error(`RETRYABLE_STATUS:${response.status}:${detail}`);
    }
    throw new Error(`PerceptLeap API ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(pathname: string, body: Record<string, unknown>) {
  const attempts = maxRetries() + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await postJsonOnce<T>(pathname, body);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = message.startsWith("RETRYABLE_STATUS:") || message.includes("fetch failed");
      if (!retryable || attempt === attempts - 1) break;
      await sleep(800 * (attempt + 1));
    }
  }

  if (lastError instanceof Error && lastError.message.startsWith("RETRYABLE_STATUS:")) {
    const [, status, detail] = lastError.message.split(":", 3);
    throw new Error(`PerceptLeap API ${status}: ${detail}`);
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function extractPerceptLeapText(payload: PerceptLeapResponsesPayload) {
  if (payload.output_text) return payload.output_text;

  const responseText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
  if (responseText) return responseText;

  const choiceText = payload.choices
    ?.map((choice) => choice.message?.content || choice.text)
    .filter(Boolean)
    .join("\n");
  if (choiceText) return choiceText;

  throw new Error("PerceptLeap response did not include assistant text.");
}

export async function callPerceptLeapText(options: PerceptLeapTextOptions) {
  const body: Record<string, unknown> = {
    model: options.model,
    input: options.input,
  };

  if (typeof options.temperature === "number") body.temperature = options.temperature;
  if (typeof options.maxOutputTokens === "number") body.max_output_tokens = options.maxOutputTokens;

  const payload = await postJson<PerceptLeapResponsesPayload>("/responses", body);
  return extractPerceptLeapText(payload);
}

export async function generatePerceptLeapImage(options: PerceptLeapImageOptions) {
  const model = options.model || serverEnv.perceptLeap.imageModel;
  const outputFormat = options.outputFormat || serverEnv.perceptLeap.imageOutputFormat;
  const payload = await postJson<PerceptLeapImagePayload>("/images/generations", {
    model,
    prompt: options.prompt,
    size: options.size || serverEnv.perceptLeap.imageSize,
    quality: options.quality || serverEnv.perceptLeap.imageQuality,
    output_format: outputFormat,
  });

  const first = payload.data?.[0];
  if (first?.b64_json) {
    return {
      dataUrl: `data:image/${outputFormat};base64,${first.b64_json}`,
      model,
    };
  }

  if (first?.url) {
    return {
      dataUrl: first.url,
      model,
    };
  }

  throw new Error("PerceptLeap image response did not include b64_json or url.");
}
