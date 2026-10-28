
"use client";

import { useEffect, useMemo, useState } from "react";
import type { OwnerId, Transaction } from "@/lib/finance/types";
import { getTransactions } from "@/lib/finance/repository";
import { calculateSummary } from "@/lib/finance/summary";
import { formatAmount } from "@/lib/finance/money";
import { formatJalaliDate, getJalaliMonthRange } from "@/lib/finance/jalali";

const ownerLabels: Record<OwnerId, string> = {
  arman: "آرمان",
  faezeh: "فائزه",
  shared: "مشترک",
};

const kindLabels: Record<Transaction["kind"], string> = {
  income: "درآمد",
  expense: "هزینه مصرفی",
  loan_payment: "پرداخت قسط",
  asset_purchase: "خرید دارایی",
};

const expenseCategories: Record<string, string> = {
  groceries: "خواربار و خرید خانه",
  housing: "مسکن و قبوض",
  transport: "حمل‌ونقل",
  health: "سلامت",
  personal: "شخصی",
  other_expense: "سایر هزینه‌ها",
};

const comparisonMetrics: {
  key: "totalIncome" | "totalExpenses" | "totalLoanPayments" | "totalAssetPurchases" | "netCashFlow";
  label: string;
}[] = [
  { key: "totalIncome", label: "درآمد" },
  { key: "totalExpenses", label: "هزینه مصرفی" },
  { key: "totalLoanPayments", label: "اقساط" },
  { key: "totalAssetPurchases", label: "خرید دارایی" },
  { key: "netCashFlow", label: "خالص جریان نقدی" },
];

function EmptyState({
  message = "هنوز اطلاعاتی ثبت نشده است",
}: {
  message?: string;
}) {
  return (
    <p className="py-5 text-center text-sm text-slate-500">{message}</p>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function FinancialCard({
  title,
  amount,
  description,
}: {
  title: string;
  amount: number;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{title}</p>
      <p
        className={`mt-3 text-xl font-bold ${
          amount < 0 ? "text-red-600" : "text-slate-900"
        }`}
      >
        {amount < 0 ? "−" : ""}
        {formatAmount(Math.abs(amount))}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </section>
  );
}

function getOwnerSummary(transactions: Transaction[], ownerId: OwnerId) {
  return transactions
    .filter((transaction) => transaction.ownerId === ownerId)
    .reduce(
      (result, transaction) => {
        if (transaction.kind === "income") {
          result.income += transaction.amount;
        } else if (transaction.kind === "expense") {
          result.expenses += transaction.amount;
        } else if (transaction.kind === "loan_payment") {
          result.loanPayments += transaction.amount;
        } else if (transaction.kind === "asset_purchase") {
          result.assetPurchases += transaction.amount;
        }
        return result;
      },
      { income: 0, expenses: 0, loanPayments: 0, assetPurchases: 0 },
    );
}

function getPreviousMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  if (month === 1) {
    return `${year - 1}-12`;
  }

  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function getMonthTransactions(
  transactions: Transaction[],
  monthKey: string,
) {
  const [year, month] = monthKey.split("-").map(Number);
  const { start, end } = getJalaliMonthRange(year, month);

  return transactions.filter(
    (transaction) =>
      transaction.date >= start && transaction.date <= end,
  );
}

function getPercentageChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return "۰٪";
    return "جدید";
  }

  const percentage = ((current - previous) / Math.abs(previous)) * 100;
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 1,
  }).format(Math.abs(percentage));

  return `${percentage > 0 ? "+" : percentage < 0 ? "−" : ""}${formatted}٪`;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [months, setMonths] = useState<{ value: string; label: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const loadedTransactions = getTransactions();
      setTransactions(loadedTransactions);

      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
        year: "numeric",
        month: "numeric",
      }).formatToParts(now);

      const currentYear = Number(
        parts.find((part) => part.type === "year")?.value,
      );
      const currentMonth = Number(
        parts.find((part) => part.type === "month")?.value,
      );
      const currentMonthKey =
        `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

      setSelectedMonth(currentMonthKey);

      const options: { value: string; label: string }[] = [];

      for (let offset = 0; offset < 24; offset++) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const monthParts = new Intl.DateTimeFormat("en-u-ca-persian", {
          year: "numeric",
          month: "numeric",
        }).formatToParts(date);

        const year = Number(
          monthParts.find((part) => part.type === "year")?.value,
        );
        const month = Number(
          monthParts.find((part) => part.type === "month")?.value,
        );

        options.push({
          value: `${year}-${String(month).padStart(2, "0")}`,
          label: `${new Intl.NumberFormat("fa-IR").format(month)} / ${new Intl.NumberFormat("fa-IR").format(year)}`,
        });
      }

      setMonths(options);
    } catch {
      setError("خواندن اطلاعات مالی با مشکل مواجه شد.");
    } finally {
      setReady(true);
    }
  }, []);

  const monthTransactions = useMemo(
    () =>
      selectedMonth
        ? getMonthTransactions(transactions, selectedMonth)
        : [],
    [transactions, selectedMonth],
  );

  const previousMonthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return getMonthTransactions(
      transactions,
      getPreviousMonth(selectedMonth),
    );
  }, [transactions, selectedMonth]);

  const summary = useMemo(
    () => calculateSummary(monthTransactions),
    [monthTransactions],
  );

  const previousSummary = useMemo(
    () => calculateSummary(previousMonthTransactions),
    [previousMonthTransactions],
  );

  const ownerSummaries = useMemo(
    () => ({
      arman: getOwnerSummary(monthTransactions, "arman"),
      faezeh: getOwnerSummary(monthTransactions, "faezeh"),
      shared: getOwnerSummary(monthTransactions, "shared"),
    }),
    [monthTransactions],
  );

  const expenseBreakdown = useMemo(() => {
    const totalExpenses = summary.totalExpenses;

    return Object.entries(expenseCategories)
      .map(([categoryId, label]) => {
        const matching = monthTransactions.filter(
          (transaction) =>
            transaction.kind === "expense" &&
            transaction.categoryId === categoryId,
        );

        const total = matching.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        );

        const ownerAmounts: Record<OwnerId, number> = {
          arman: 0,
          faezeh: 0,
          shared: 0,
        };

        for (const transaction of matching) {
          ownerAmounts[transaction.ownerId] += transaction.amount;
        }

        return {
          categoryId,
          label,
          total,
          share: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
          ownerAmounts,
        };
      })
      .filter((category) => category.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthTransactions, summary.totalExpenses]);

  const recentTransactions = useMemo(
    () =>
      [...monthTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [monthTransactions],
  );

  if (!ready) {
    return (
      <p className="py-10 text-center text-slate-500">
        در حال بارگذاری اطلاعات...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }

  const monthLabel =
    months.find((month) => month.value === selectedMonth)?.label ?? selectedMonth;
  const previousMonthLabel =
    months.find((month) => month.value === getPreviousMonth(selectedMonth))
      ?.label ?? getPreviousMonth(selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            سلام آرمان و فائزه
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            وضعیت مالی خانواده و گزارش هزینه‌ها
          </p>
        </div>

        <div className="w-full sm:w-56">
          <label
            htmlFor="dashboard-month"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            ماه گزارش
          </label>
          <select
            id="dashboard-month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FinancialCard
          title="مجموع درآمد"
          amount={summary.totalIncome}
          description="درآمدهای ثبت‌شده در این ماه"
        />
        <FinancialCard
          title="هزینه‌های مصرفی"
          amount={summary.totalExpenses}
          description="مخارج روزمره و مصرفی"
        />
        <FinancialCard
          title="پرداخت اقساط"
          amount={summary.totalLoanPayments}
          description="اقساط پرداخت‌شده"
        />
        <FinancialCard
          title="خرید دارایی"
          amount={summary.totalAssetPurchases}
          description="مبالغ صرف‌شده برای خرید دارایی"
        />
        <FinancialCard
          title="خالص جریان نقدی"
          amount={summary.netCashFlow}
          description="درآمد منهای تمام خروجی‌های نقدی"
        />
      </div>

      <Section title="وضعیت مالی اعضای خانواده">
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["arman", "آرمان"],
              ["faezeh", "فائزه"],
              ["shared", "درآمد و هزینه‌های مشترک"],
            ] as const
          ).map(([ownerId, label]) => {
            const data = ownerSummaries[ownerId];

            return (
              <div key={ownerId} className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-800">{label}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">درآمد</span>
                    <span>{formatAmount(data.income)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">هزینه مصرفی</span>
                    <span>{formatAmount(data.expenses)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">اقساط</span>
                    <span>{formatAmount(data.loanPayments)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">خرید دارایی</span>
                    <span>{formatAmount(data.assetPurchases)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={`گزارش هزینه‌ها بر اساس دسته‌بندی · ${monthLabel}`}>
        {expenseBreakdown.length === 0 ? (
          <EmptyState message="در این ماه هزینه مصرفی ثبت نشده است." />
        ) : (
          <div className="space-y-5">
            {expenseBreakdown.map((category) => (
              <div key={category.categoryId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {category.label}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatAmount(category.total)}{" "}
                    <span className="font-normal text-slate-500">
                      ({new Intl.NumberFormat("fa-IR", {
                        maximumFractionDigits: 1,
                      }).format(category.share)}٪)
                    </span>
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${category.share}%` }}
                  />
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <p>آرمان: {formatAmount(category.ownerAmounts.arman)}</p>
                  <p>فائزه: {formatAmount(category.ownerAmounts.faezeh)}</p>
                  <p>مشترک: {formatAmount(category.ownerAmounts.shared)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold">
          مجموع هزینه‌های مصرفی: {formatAmount(summary.totalExpenses)}
        </div>
      </Section>

      <Section title={`مقایسه با ماه قبل · ${previousMonthLabel}`}>
        <p className="mb-4 text-sm text-slate-500">
          مقایسه‌ی {monthLabel} با {previousMonthLabel}
        </p>

        <div className="space-y-3">
          {comparisonMetrics.map((metric) => {
            const current = summary[metric.key];
            const previous = previousSummary[metric.key];
            const difference = current - previous;

            return (
              <div
                key={metric.key}
                className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr]"
              >
                <p className="font-medium text-slate-800">{metric.label}</p>
                <p className="text-sm">
                  <span className="text-slate-500 sm:block">ماه انتخاب‌شده</span>
                  {current < 0 ? "−" : ""}
                  {formatAmount(Math.abs(current))}
                </p>
                <p className="text-sm">
                  <span className="text-slate-500 sm:block">ماه قبل</span>
                  {previous < 0 ? "−" : ""}
                  {formatAmount(Math.abs(previous))}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    difference > 0
                      ? "text-emerald-700"
                      : difference < 0
                        ? "text-red-600"
                        : "text-slate-500"
                  }`}
                >
                  <span className="text-slate-500 sm:block">تغییر</span>
                  {difference > 0 ? "+" : difference < 0 ? "−" : ""}
                  {formatAmount(Math.abs(difference))}
                  <span className="mt-1 block text-xs font-normal">
                    {getPercentageChange(current, previous)}
                  </span>
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          افزایش درآمد معمولاً مثبت است، اما افزایش هزینه به‌معنای خرج بیشتر است؛
          علامت تغییر را متناسب با نوع شاخص تفسیر کن.
        </p>
      </Section>

      <Section title="آخرین تراکنش‌های این ماه">
        {recentTransactions.length === 0 ? (
          <EmptyState message="در این ماه تراکنشی ثبت نشده است." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {transaction.description.trim() ||
                      kindLabels[transaction.kind]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {kindLabels[transaction.kind]} ·{" "}
                    {ownerLabels[transaction.ownerId]} ·{" "}
                    {formatJalaliDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={`font-semibold ${
                    transaction.kind === "income"
                      ? "text-emerald-700"
                      : "text-slate-800"
                  }`}
                >
                  {transaction.kind === "income" ? "+" : "−"}
                  {formatAmount(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        <a
          href="/transactions"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          مشاهده و مدیریت همه تراکنش‌ها ←
        </a>
      </Section>
    </div>
  );
}
