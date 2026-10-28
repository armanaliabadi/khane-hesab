
import * as XLSX from "xlsx";
import type {
  OwnerId,
  Transaction,
  TransactionKind,
} from "./types";

const SHEET_NAME = "تراکنش‌ها";

const HEADERS = [
  "شناسه تراکنش",
  "نوع تراکنش",
  "تاریخ میلادی",
  "مبلغ (هزار تومان)",
  "صاحب تراکنش",
  "شناسه دسته‌بندی",
  "توضیحات",
];

const VALID_KINDS: TransactionKind[] = [
  "income",
  "expense",
  "loan_payment",
  "asset_purchase",
];

const VALID_OWNERS: OwnerId[] = [
  "arman",
  "faezeh",
  "shared",
];

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isValidTransaction(
  value: Transaction,
): boolean {
  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    VALID_KINDS.includes(value.kind) &&
    isValidDate(value.date) &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0 &&
    VALID_OWNERS.includes(value.ownerId) &&
    typeof value.categoryId === "string" &&
    value.categoryId.trim().length > 0 &&
    typeof value.description === "string"
  );
}

export function downloadExcelBackup(
  transactions: Transaction[],
): void {
  const rows = transactions.map((transaction) => [
    transaction.id,
    transaction.kind,
    transaction.date,
    transaction.amount,
    transaction.ownerId,
    transaction.categoryId,
    transaction.description,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ...rows,
  ]);

  worksheet["!cols"] = [
    { wch: 38 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    SHEET_NAME,
  );

  const today = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(
    workbook,
    `khane-hesab-backup-${today}.xlsx`,
  );
}

export async function readExcelBackup(
  file: File,
): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
  });

  const worksheet = workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    throw new Error(
      `برگه «${SHEET_NAME}» در فایل پیدا نشد.`,
    );
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(
    worksheet,
    {
      header: 1,
      defval: "",
      raw: true,
    },
  );

  if (rows.length === 0) {
    throw new Error("فایل Excel خالی است.");
  }

  const headers = rows[0];

  if (
    !Array.isArray(headers) ||
    HEADERS.some(
      (header, index) => headers[index] !== header,
    )
  ) {
    throw new Error(
      "ساختار ستون‌های فایل معتبر نیست. از فایل پشتیبان خانه‌حساب استفاده کن.",
    );
  }

  const transactions: Transaction[] = [];
  const seenIds = new Set<string>();

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];

    if (
      !Array.isArray(row) ||
      row.every(
        (cell) => cell === "" || cell === null,
      )
    ) {
      continue;
    }

    const [
      id,
      kind,
      date,
      amount,
      ownerId,
      categoryId,
      description,
    ] = row;

    if (
      typeof id !== "string" ||
      typeof kind !== "string" ||
      typeof date !== "string" ||
      typeof amount !== "number" ||
      typeof ownerId !== "string" ||
      typeof categoryId !== "string" ||
      typeof description !== "string"
    ) {
      throw new Error(
        `اطلاعات ردیف ${index + 1} معتبر نیست.`,
      );
    }

    const transaction: Transaction = {
      id,
      kind: kind as TransactionKind,
      date,
      amount,
      ownerId: ownerId as OwnerId,
      categoryId,
      description,
    };

    if (!isValidTransaction(transaction)) {
      throw new Error(
        `اطلاعات ردیف ${index + 1} معتبر نیست. تاریخ، مبلغ، نوع یا صاحب تراکنش را بررسی کن.`,
      );
    }

    if (seenIds.has(transaction.id)) {
      throw new Error(
        `شناسه تراکنش در ردیف ${index + 1} تکراری است.`,
      );
    }

    seenIds.add(transaction.id);
    transactions.push(transaction);
  }

  if (transactions.length === 0) {
    throw new Error(
      "هیچ تراکنشی برای بازیابی در فایل پیدا نشد.",
    );
  }

  return transactions;
}
