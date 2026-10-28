
import type { Transaction } from "./types";

const STORAGE_KEY = "khane-hesab:data";
const DATA_VERSION = 1;

type StoredData = {
  version: number;
  transactions: Transaction[];
};

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    ["income", "expense", "loan_payment", "asset_purchase"].includes(
      String(item.kind),
    ) &&
    typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.amount === "number" &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    ["arman", "faezeh", "shared"].includes(String(item.ownerId)) &&
    typeof item.categoryId === "string" &&
    typeof item.description === "string"
  );
}

function isStoredData(value: unknown): value is StoredData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    data.version === DATA_VERSION &&
    Array.isArray(data.transactions) &&
    data.transactions.every(isTransaction)
  );
}

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "اطلاعات ذخیره‌شده قابل خواندن نیست. برای جلوگیری از حذف اطلاعات، آن را بازنویسی نکردیم.",
    );
  }

  if (!isStoredData(parsed)) {
    throw new Error(
      "ساختار اطلاعات ذخیره‌شده معتبر نیست یا نسخه آن پشتیبانی نمی‌شود.",
    );
  }

  return parsed.transactions;
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") {
    throw new Error("ذخیره‌سازی فقط در مرورگر امکان‌پذیر است.");
  }

  if (!transactions.every(isTransaction)) {
    throw new Error("حداقل یکی از تراکنش‌ها معتبر نیست.");
  }

  const data: StoredData = {
    version: DATA_VERSION,
    transactions,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
