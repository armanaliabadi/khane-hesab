
import { describe, it, expect } from "vitest";
import { calculateSummary } from "./summary";
import type { Transaction } from "./types";

const transactions: Transaction[] = [
  {
    id: "1",
    kind: "income",
    date: "2026-10-01",
    amount: 100_000,
    ownerId: "arman",
    categoryId: "salary",
    description: "حقوق",
  },
  {
    id: "2",
    kind: "expense",
    date: "2026-10-02",
    amount: 30_000,
    ownerId: "shared",
    categoryId: "groceries",
    description: "خرید خانه",
  },
  {
    id: "3",
    kind: "loan_payment",
    date: "2026-10-03",
    amount: 20_000,
    ownerId: "shared",
    categoryId: "loan",
    description: "قسط وام",
  },
  {
    id: "4",
    kind: "asset_purchase",
    date: "2026-10-04",
    amount: 10_000,
    ownerId: "arman",
    categoryId: "investment",
    description: "خرید دارایی",
  },
];

describe("calculateSummary", () => {
  it("جمع درآمد، هزینه و جریان نقدی را درست محاسبه می‌کند", () => {
    expect(calculateSummary(transactions)).toEqual({
      totalIncome: 100_000,
      totalExpenses: 30_000,
      totalLoanPayments: 20_000,
      totalAssetPurchases: 10_000,
      netCashFlow: 40_000,
    });
  });

  it("برای فهرست خالی، همه مقادیر را صفر برمی‌گرداند", () => {
    expect(calculateSummary([])).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      totalLoanPayments: 0,
      totalAssetPurchases: 0,
      netCashFlow: 0,
    });
  });

  it("مبلغ صفر را نمی‌پذیرد", () => {
    expect(() =>
      calculateSummary([
        { ...transactions[0], amount: 0 },
      ]),
    ).toThrow();
  });
});
