
import { beforeEach, describe, expect, it } from "vitest";
import {
  loadTransactions,
  saveTransactions,
} from "./storage";
import type { Transaction } from "./types";

const STORAGE_KEY = "khane-hesab:data";

const sampleTransaction: Transaction = {
  id: "test-1",
  kind: "income",
  date: "2026-10-01",
  amount: 100_000,
  ownerId: "arman",
  categoryId: "salary",
  description: "حقوق",
};

beforeEach(() => {
  localStorage.clear();
});

describe("transaction storage", () => {
  it("وقتی داده‌ای وجود ندارد، فهرست خالی برمی‌گرداند", () => {
    expect(loadTransactions()).toEqual([]);
  });

  it("تراکنش‌ها را ذخیره و دوباره بازیابی می‌کند", () => {
    saveTransactions([sampleTransaction]);

    expect(loadTransactions()).toEqual([sampleTransaction]);
  });

  it("داده خراب را بدون بازنویسی رد می‌کند", () => {
    const corruptedData = "{invalid json";
    localStorage.setItem(STORAGE_KEY, corruptedData);

    expect(() => loadTransactions()).toThrow();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(corruptedData);
  });

  it("مبلغ نامعتبر را ذخیره نمی‌کند", () => {
    const invalidTransaction = {
      ...sampleTransaction,
      amount: 0,
    };

    expect(() =>
      saveTransactions([invalidTransaction]),
    ).toThrow();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
