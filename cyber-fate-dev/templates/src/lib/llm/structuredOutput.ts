import { z } from "zod";
import { getOpenAIClient } from "./openaiClient";

export interface GenerateStructuredOutputOptions<T> {
  model: string;
  system: string;
  user: unknown;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateStructuredOutput<T>(
  options: GenerateStructuredOutputOptions<T>,
): Promise<T> {
  const client = getOpenAIClient();

  // Codex should verify exact syntax against current OpenAI docs when implementing.
  const response = await client.responses.create({
    model: options.model,
    input: [
      { role: "system", content: options.system },
      { role: "user", content: JSON.stringify(options.user) },
    ],
    temperature: options.temperature,
    max_output_tokens: options.maxOutputTokens,
    text: {
      format: {
        type: "json_schema",
        name: options.schemaName,
        strict: true,
        schema: options.jsonSchema,
      },
    },
  });

  const raw = response.output_text;
  if (!raw) throw new Error("OpenAI response did not contain output_text");

  const parsed = JSON.parse(raw);
  return options.zodSchema.parse(parsed);
}
