import OpenAI from "openai";
import { serverEnv } from "@/lib/env/serverEnv";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const apiKey = serverEnv.openAI.apiKey;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY or OPENAI_API_KEY_ENCRYPTED. openai-direct mode requires a model API key.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
