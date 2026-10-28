
import { beforeEach, describe, expect, it } from "vitest";
import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "./repository";
import type { Transaction } from "./types";

const transaction: Transaction = {
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

describe("transaction repository", () => {
  it("تراکنش جدید را ثبت می‌کند", () => {
    expect(addTransaction(transaction)).toEqual([transaction]);
    expect(getTransactions()).toEqual([transaction]);
  });

  it("شناسه تکراری را نمی‌پذیرد", () => {
    addTransaction(transaction);

    expect(() => addTransaction(transaction)).toThrow();
    expect(getTransactions()).toEqual([transaction]);
  });

  it("تراکنش موجود را ویرایش می‌کند", () => {
    addTransaction(transaction);

    const updated = {
      ...transaction,
      amount: 120_000,
      description: "حقوق اصلاح‌شده",
    };

    updateTransaction(updated);

    expect(getTransactions()).toEqual([updated]);
  });

  it("تراکنش را حذف می‌کند", () => {
    addTransaction(transaction);

    expect(deleteTransaction("test-1")).toEqual([]);
    expect(getTransactions()).toEqual([]);
  });

  it("حذف تراکنش ناموجود را رد می‌کند", () => {
    expect(() => deleteTransaction("missing")).toThrow();
  });
});
