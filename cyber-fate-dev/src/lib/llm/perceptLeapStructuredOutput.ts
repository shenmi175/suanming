import { z, type ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { callPerceptLeapText } from "./perceptLeapClient";

export interface PerceptLeapStructuredOutputOptions<T> {
  model: string;
  schemaName: string;
  zodSchema: ZodType<T>;
  system: string;
  user: unknown;
  temperature?: number;
  maxOutputTokens?: number;
}

export function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fence?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const objectStart = candidate.indexOf("{");
    const objectEnd = candidate.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(candidate.slice(objectStart, objectEnd + 1)) as unknown;
    }

    const arrayStart = candidate.indexOf("[");
    const arrayEnd = candidate.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(candidate.slice(arrayStart, arrayEnd + 1)) as unknown;
    }

    throw new Error("Model output did not contain parseable JSON.");
  }
}

function buildPrompt<T>(options: PerceptLeapStructuredOutputOptions<T>, repair?: { raw: string; error: string }) {
  const schema = zodToJsonSchema(options.zodSchema as z.ZodTypeAny, options.schemaName);
  const payload = repair
    ? {
        task: "修复上一次输出，使其严格符合 JSON Schema。只输出修复后的 JSON，不要解释。",
        validationError: repair.error,
        previousOutput: repair.raw.slice(0, 50000),
      }
    : options.user;

  return [
    options.system,
    "",
    "输出规则：",
    "1. 只输出一个 JSON 值，不要 markdown，不要代码围栏，不要解释。",
    "2. 所有字段名必须使用 schema 中的英文键名。",
    "3. 不要输出 undefined；可选字段没有值时直接省略。",
    "4. 中文文案要完整、可读、避免绝对预测，必须保留娱乐与不确定性边界。",
    "",
    `JSON Schema (${options.schemaName}):`,
    JSON.stringify(schema),
    "",
    "输入：",
    JSON.stringify(payload),
  ].join("\n");
}

export async function generatePerceptLeapJson<T>(options: PerceptLeapStructuredOutputOptions<T>) {
  const raw = await callPerceptLeapText({
    model: options.model,
    input: buildPrompt(options),
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
  });

  try {
    return options.zodSchema.parse(extractJsonFromText(raw));
  } catch (firstError) {
    const errorText = firstError instanceof Error ? firstError.message : String(firstError);
    const repaired = await callPerceptLeapText({
      model: options.model,
      input: buildPrompt(options, { raw, error: errorText }),
      temperature: 0,
      maxOutputTokens: options.maxOutputTokens,
    });

    try {
      return options.zodSchema.parse(extractJsonFromText(repaired));
    } catch (secondError) {
      const message = secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`PerceptLeap structured output failed schema validation: ${message}`);
    }
  }
}
