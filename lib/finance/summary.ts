
import type { Transaction, FinancialSummary } from "./types";

export function calculateSummary(
  transactions: Transaction[],
): FinancialSummary {
  const summary: FinancialSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    totalLoanPayments: 0,
    totalAssetPurchases: 0,
    netCashFlow: 0,
  };

  for (const transaction of transactions) {
    const { kind, amount } = transaction;

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(
        `مبلغ تراکنش باید عدد صحیح مثبت باشد: ${transaction.id}`,
      );
    }

    switch (kind) {
      case "income":
        summary.totalIncome += amount;
        break;

      case "expense":
        summary.totalExpenses += amount;
        break;

      case "loan_payment":
        summary.totalLoanPayments += amount;
        break;

      case "asset_purchase":
        summary.totalAssetPurchases += amount;
        break;

      default:
        throw new Error(`نوع تراکنش نامعتبر است: ${kind}`);
    }
  }

  summary.netCashFlow =
    summary.totalIncome -
    summary.totalExpenses -
    summary.totalLoanPayments -
    summary.totalAssetPurchases;

  return summary;
}
