import { describe, expect, it } from "vitest";
import { extractPerceptLeapText } from "@/lib/llm/perceptLeapClient";
import { extractJsonFromText } from "@/lib/llm/perceptLeapStructuredOutput";

describe("PerceptLeap response helpers", () => {
  it("extracts assistant text from Responses API output content", () => {
    const text = extractPerceptLeapText({
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "2026年5月14日" }],
        },
      ],
    });

    expect(text).toBe("2026年5月14日");
  });

  it("parses fenced JSON and ignores surrounding prose", () => {
    expect(extractJsonFromText("```json\n{\"ok\":true}\n```")).toEqual({ ok: true });
    expect(extractJsonFromText("结果如下：\n{\"role\":\"reviewer\",\"passed\":true}\n请查收")).toEqual({
      role: "reviewer",
      passed: true,
    });
  });
});
