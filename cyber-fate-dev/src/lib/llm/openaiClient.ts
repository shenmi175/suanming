import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Set ENABLE_OPENAI=false to use the local fallback pipeline.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
