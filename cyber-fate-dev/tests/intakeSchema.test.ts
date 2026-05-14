import { describe, expect, it } from "vitest";
import { defaultIntakeProfile, IntakeProfileSchema } from "@/lib/schemas/intake";

describe("IntakeProfileSchema", () => {
  it("accepts the default profile", () => {
    expect(IntakeProfileSchema.parse(defaultIntakeProfile).displayName).toBe("匿名访客");
  });

  it("rejects impossible dates and empty focus areas", () => {
    const result = IntakeProfileSchema.safeParse({
      ...defaultIntakeProfile,
      birthDate: "1999-02-31",
      focusAreas: [],
    });

    expect(result.success).toBe(false);
  });
});
