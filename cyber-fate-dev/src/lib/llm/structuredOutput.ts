import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getOpenAIClient } from "./openaiClient";

export interface StructuredOutputOptions<T> {
  model: string;
  system: string;
  user: unknown;
  schemaName: string;
  zodSchema: z.ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateStructuredOutput<T>(options: StructuredOutputOptions<T>) {
  const client = getOpenAIClient();
  const schema = zodToJsonSchema(options.zodSchema, options.schemaName) as Record<string, unknown>;

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
        schema,
      },
    },
  });

  const raw = response.output_text;
  if (!raw) throw new Error("OpenAI response did not include output_text.");

  return options.zodSchema.parse(JSON.parse(raw));
}
