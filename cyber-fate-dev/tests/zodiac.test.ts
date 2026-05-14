import { describe, expect, it } from "vitest";
import { getChineseZodiac, getWesternZodiac } from "@/lib/fate/zodiac";

describe("zodiac signals", () => {
  it("calculates western zodiac by Gregorian month/day", () => {
    expect(getWesternZodiac("1996-08-18").sign).toBe("狮子座");
    expect(getWesternZodiac("1996-12-25").sign).toBe("摩羯座");
  });

  it("uses Gregorian-year approximation for Chinese zodiac", () => {
    expect(getChineseZodiac("2020-05-01").animal).toBe("鼠");
    expect(getChineseZodiac("2024-05-01").animal).toBe("龙");
  });
});
