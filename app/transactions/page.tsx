
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  OwnerId,
  Transaction,
  TransactionKind,
} from "@/lib/finance/types";
import {
  addTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "@/lib/finance/repository";
import { formatAmount } from "@/lib/finance/money";
import {
  formatJalaliDate,
  getJalaliMonthRange,
} from "@/lib/finance/jalali";

const kindLabels: Record<TransactionKind, string> = {
  income: "درآمد",
  expense: "هزینه مصرفی",
  loan_payment: "پرداخت قسط",
  asset_purchase: "خرید دارایی",
};

const ownerLabels: Record<OwnerId, string> = {
  arman: "آرمان",
  faezeh: "فائزه",
  shared: "مشترک",
};

const categories: Record<
  TransactionKind,
  { id: string; label: string }[]
> = {
  income: [
    { id: "salary", label: "حقوق" },
    { id: "other_income", label: "سایر درآمدها" },
  ],
  expense: [
    { id: "groceries", label: "خواربار و خرید خانه" },
    { id: "housing", label: "مسکن و قبوض" },
    { id: "transport", label: "حمل‌ونقل" },
    { id: "health", label: "سلامت" },
    { id: "personal", label: "شخصی" },
    { id: "other_expense", label: "سایر هزینه‌ها" },
  ],
  loan_payment: [{ id: "loan", label: "قسط وام" }],
  asset_purchase: [
    { id: "investment", label: "سرمایه‌گذاری" },
    { id: "other_asset", label: "سایر دارایی‌ها" },
  ],
};

function todayIsoDate() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [ownerId, setOwnerId] = useState<OwnerId>("shared");
  const [categoryId, setCategoryId] = useState("groceries");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [availableMonths, setAvailableMonths] = useState<
    { value: string; label: string }[]
  >([]);
  const [filterKind, setFilterKind] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  useEffect(() => {
    const today = todayIsoDate();
    setDate(today);

    const [gregorianYear, gregorianMonth] = today.split("-").map(Number);
    const options: { value: string; label: string }[] = [];

    for (let offset = 0; offset < 24; offset++) {
      const currentDate = new Date(
        gregorianYear,
        gregorianMonth - 1 - offset,
        1,
      );

      const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
        year: "numeric",
        month: "numeric",
      }).formatToParts(currentDate);

      const jalaliYear = Number(
        parts.find((part) => part.type === "year")?.value,
      );
      const jalaliMonth = Number(
        parts.find((part) => part.type === "month")?.value,
      );

      options.push({
        value: `${jalaliYear}-${String(jalaliMonth).padStart(2, "0")}`,
        label: `${new Intl.NumberFormat("fa-IR").format(jalaliMonth)} / ${new Intl.NumberFormat("fa-IR").format(jalaliYear)}`,
      });
    }

    setAvailableMonths(options);

    try {
      setTransactions(getTransactions());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خواندن اطلاعات ذخیره‌شده ناموفق بود.",
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const availableCategories = categories[kind];

    if (!availableCategories.some((category) => category.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
    }
  }, [kind, categoryId]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((transaction) => {
        if (filterKind !== "all" && transaction.kind !== filterKind) {
          return false;
        }

        if (filterOwner !== "all" && transaction.ownerId !== filterOwner) {
          return false;
        }

        if (filterMonth !== "all") {
          const [year, month] = filterMonth.split("-").map(Number);
          const { start, end } = getJalaliMonthRange(year, month);

          if (transaction.date < start || transaction.date > end) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterKind, filterOwner, filterMonth]);

  function resetForm() {
    setEditingId(null);
    setKind("expense");
    setDate(todayIsoDate());
    setAmount("");
    setOwnerId("shared");
    setCategoryId("groceries");
    setDescription("");
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);

    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      setError("مبلغ باید عدد صحیح مثبت و برحسب هزار تومان باشد.");
      return;
    }

    if (!date) {
      setError("تاریخ تراکنش را وارد کن.");
      return;
    }

    const transaction: Transaction = {
      id: editingId ?? crypto.randomUUID(),
      kind,
      date,
      amount: numericAmount,
      ownerId,
      categoryId,
      description: description.trim(),
    };

    try {
      const updated =
        editingId !== null
          ? updateTransaction(transaction)
          : addTransaction(transaction);

      setTransactions(updated);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ذخیره تراکنش ناموفق بود.",
      );
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setKind(transaction.kind);
    setDate(transaction.date);
    setAmount(String(transaction.amount));
    setOwnerId(transaction.ownerId);
    setCategoryId(transaction.categoryId);
    setDescription(transaction.description);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    if (!window.confirm("این تراکنش حذف شود؟")) return;

    setError("");

    try {
      setTransactions(deleteTransaction(id));

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حذف تراکنش ناموفق بود.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تراکنش‌ها</h1>
        <p className="mt-2 text-sm text-slate-600">
          درآمدها و خروجی‌های مالی خانواده را ثبت و مدیریت کن.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">
          {editingId !== null ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            نوع تراکنش
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as TransactionKind)
              }
              className="rounded-lg border border-slate-300 p-2"
            >
              {Object.entries(kindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            مبلغ (هزار تومان)
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="مثلاً 1500"
              className="rounded-lg border border-slate-300 p-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            تاریخ
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            />
            <span className="text-xs text-slate-500">
              تاریخ در فهرست به شمسی نمایش داده می‌شود.
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            مربوط به
            <select
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value as OwnerId)}
              className="rounded-lg border border-slate-300 p-2"
            >
              {Object.entries(ownerLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            دسته‌بندی
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            >
              {categories[kind].map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm sm:col-span-2">
            توضیحات (اختیاری)
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              placeholder="مثلاً خرید هفتگی خانه"
              className="rounded-lg border border-slate-300 p-2"
            />
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={!ready}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {editingId !== null ? "ذخیره تغییرات" : "ثبت تراکنش"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50"
              >
                لغو ویرایش
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">فیلتر تراکنش‌ها</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            نوع تراکنش
            <select
              value={filterKind}
              onChange={(event) => setFilterKind(event.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            >
              <option value="all">همه انواع</option>
              {Object.entries(kindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            مربوط به
            <select
              value={filterOwner}
              onChange={(event) => setFilterOwner(event.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            >
              <option value="all">همه افراد</option>
              {Object.entries(ownerLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            ماه شمسی
            <select
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            >
              <option value="all">همه ماه‌ها</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            {filteredTransactions.length} تراکنش از {transactions.length} تراکنش
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterKind("all");
              setFilterOwner("all");
              setFilterMonth("all");
            }}
            className="text-sm text-emerald-800 underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">فهرست تراکنش‌ها</h2>

        {!ready ? (
          <p className="py-6 text-center text-sm text-slate-500">
            در حال خواندن اطلاعات...
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            تراکنشی مطابق فیلترهای انتخاب‌شده وجود ندارد.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {transaction.description.trim() ||
                      kindLabels[transaction.kind]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {kindLabels[transaction.kind]} ·{" "}
                    {ownerLabels[transaction.ownerId]} ·{" "}
                    {formatJalaliDate(transaction.date)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-left">
                    <p className="font-semibold tabular-nums">
                      {formatAmount(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {categories[transaction.kind].find(
                        (category) => category.id === transaction.categoryId,
                      )?.label ?? "بدون دسته‌بندی"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(transaction)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
