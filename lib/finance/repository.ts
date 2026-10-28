
import type { Transaction } from "./types";
import {
  loadTransactions,
  saveTransactions,
} from "./storage";

export function getTransactions(): Transaction[] {
  return loadTransactions();
}

export function addTransaction(
  transaction: Transaction,
): Transaction[] {
  const transactions = loadTransactions();

  if (transactions.some((item) => item.id === transaction.id)) {
    throw new Error("شناسه این تراکنش قبلاً ثبت شده است.");
  }

  const updatedTransactions = [...transactions, transaction];

  saveTransactions(updatedTransactions);

  return updatedTransactions;
}

export function updateTransaction(
  transaction: Transaction,
): Transaction[] {
  const transactions = loadTransactions();
  const exists = transactions.some(
    (item) => item.id === transaction.id,
  );

  if (!exists) {
    throw new Error("تراکنش موردنظر پیدا نشد.");
  }

  const updatedTransactions = transactions.map((item) =>
    item.id === transaction.id ? transaction : item,
  );

  saveTransactions(updatedTransactions);

  return updatedTransactions;
}

export function deleteTransaction(id: string): Transaction[] {
  const transactions = loadTransactions();

  const updatedTransactions = transactions.filter(
    (item) => item.id !== id,
  );

  if (updatedTransactions.length === transactions.length) {
    throw new Error("تراکنش موردنظر پیدا نشد.");
  }

  saveTransactions(updatedTransactions);

  return updatedTransactions;
}
