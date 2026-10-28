
import { describe, it, expect } from "vitest";
import { validateAmount, formatAmount } from "./money";

describe("validateAmount", () => {
  it("مبلغ صحیح و مثبت را می‌پذیرد", () => {
    expect(() => validateAmount(1500)).not.toThrow();
  });

  it("مبلغ صفر را رد می‌کند", () => {
    expect(() => validateAmount(0)).toThrow();
  });

  it("مبلغ منفی را رد می‌کند", () => {
    expect(() => validateAmount(-100)).toThrow();
  });

  it("مبلغ اعشاری را رد می‌کند", () => {
    expect(() => validateAmount(12.5)).toThrow();
  });
});

describe("formatAmount", () => {
  it("مبلغ را با ارقام فارسی و واحد صحیح نمایش می‌دهد", () => {
    expect(formatAmount(1500)).toBe("۱٬۵۰۰ هزار تومان");
  });
});
