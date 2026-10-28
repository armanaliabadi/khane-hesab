
export type TransactionKind =
  | "income"
  | "expense"
  | "loan_payment"
  | "asset_purchase";

export type OwnerId = "arman" | "faezeh" | "shared";

export type Transaction = {
  id: string;
  kind: TransactionKind;
  date: string; // تاریخ میلادی به شکل YYYY-MM-DD
  amount: number; // مبلغ بر حسب هزار تومان، عدد صحیح مثبت
  ownerId: OwnerId;
  categoryId: string;
  description: string;
};

export type FinancialSummary = {
  totalIncome: number;
  totalExpenses: number;
  totalLoanPayments: number;
  totalAssetPurchases: number;
  netCashFlow: number;
};
