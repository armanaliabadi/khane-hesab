
import { describe, it, expect } from "vitest";
import {
  formatJalaliDate,
  jalaliToIsoDate,
  getJalaliMonthRange,
} from "./jalali";

describe("formatJalaliDate", () => {
  it("تاریخ میلادی را به شمسی تبدیل می‌کند", () => {
    expect(formatJalaliDate("2026-03-21")).toBe("1405/01/01");
  });

  it("تاریخ نامعتبر را رد می‌کند", () => {
    expect(() => formatJalaliDate("2026-02-30")).toThrow();
  });
});

describe("jalaliToIsoDate", () => {
  it("تاریخ شمسی را به میلادی تبدیل می‌کند", () => {
    expect(jalaliToIsoDate(1405, 1, 1)).toBe("2026-03-21");
  });

  it("تاریخ شمسی نامعتبر را رد می‌کند", () => {
    expect(() => jalaliToIsoDate(1405, 13, 1)).toThrow();
  });
});

describe("getJalaliMonthRange", () => {
  it("ابتدا و انتهای ماه اول شمسی را برمی‌گرداند", () => {
    expect(getJalaliMonthRange(1405, 1)).toEqual({
      start: "2026-03-21",
      end: "2026-04-20",
    });
  });

  it("ماه نامعتبر را رد می‌کند", () => {
    expect(() => getJalaliMonthRange(1405, 13)).toThrow();
  });
});
