
"use client";

import { useEffect, useState } from "react";
import {
  downloadExcelBackup,
  readExcelBackup,
} from "@/lib/finance/backup";
import {
  getTransactions,
} from "@/lib/finance/repository";
import { saveTransactions } from "@/lib/finance/storage";
import type { Transaction } from "@/lib/finance/types";

export default function BackupPage() {
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<
    Transaction[] | null
  >(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    try {
      setCurrentCount(getTransactions().length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خواندن اطلاعات فعلی ناموفق بود.",
      );
    }
  }, []);

  function handleDownload() {
    setError("");
    setMessage("");

    try {
      const transactions = getTransactions();
      downloadExcelBackup(transactions);
      setMessage(
        `فایل پشتیبان شامل ${transactions.length.toLocaleString("fa-IR")} تراکنش آماده شد.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ساخت فایل پشتیبان ناموفق بود.",
      );
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setPendingTransactions(null);
    setError("");
    setMessage("");

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("لطفاً یک فایل با پسوند xlsx انتخاب کن.");
      event.target.value = "";
      return;
    }

    setIsReading(true);

    try {
      const transactions = await readExcelBackup(file);
      setPendingTransactions(transactions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خواندن فایل پشتیبان ناموفق بود.",
      );
    } finally {
      setIsReading(false);
      event.target.value = "";
    }
  }

  function handleRestore() {
    if (!pendingTransactions) {
      return;
    }

    setError("");
    setMessage("");

    try {
      saveTransactions(pendingTransactions);
      setCurrentCount(pendingTransactions.length);
      setMessage(
        `بازیابی با موفقیت انجام شد. ${pendingTransactions.length.toLocaleString("fa-IR")} تراکنش جایگزین اطلاعات قبلی شد.`,
      );
      setPendingTransactions(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "بازیابی اطلاعات ناموفق بود.",
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          پشتیبان‌گیری و بازیابی
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          از اطلاعات خانه‌حساب فایل Excel بگیر یا اطلاعات را از فایل پشتیبان
          قبلی بازیابی کن.
        </p>
      </div>

      {currentCount !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">تعداد تراکنش‌های فعلی</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {currentCount.toLocaleString("fa-IR")}
          </p>
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">
          دریافت فایل پشتیبان
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          تمام تراکنش‌ها همراه با شناسه، تاریخ، مبلغ، دسته‌بندی و توضیحات
          در یک فایل Excel ذخیره می‌شوند. مبلغ‌ها برحسب هزار تومان هستند.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          دانلود فایل Excel
        </button>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">
          بازیابی از فایل پشتیبان
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          فایل Excel پشتیبانی را که قبلاً از خانه‌حساب گرفته‌ای انتخاب کن.
          ابتدا محتویات آن بررسی می‌شود و سپس می‌توانی جایگزینی را تأیید کنی.
        </p>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            انتخاب فایل با پسوند xlsx
          </span>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={isReading}
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm file:me-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2"
          />
        </label>

        {isReading && (
          <p role="status" className="text-sm text-slate-600">
            در حال بررسی فایل...
          </p>
        )}

        {pendingTransactions && (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <h3 className="font-bold text-amber-900">
              تأیید بازیابی
            </h3>
            <p className="text-sm leading-6 text-amber-900">
              فایل معتبر است و شامل{" "}
              <strong>
                {pendingTransactions.length.toLocaleString("fa-IR")}
              </strong>{" "}
              تراکنش است. با تأیید، تمام اطلاعات فعلی جایگزین اطلاعات این فایل
              می‌شود؛ این عملیات، ادغام اطلاعات نیست.
            </p>
            <button
              type="button"
              onClick={handleRestore}
              className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
            >
              تأیید و جایگزینی اطلاعات فعلی
            </button>
            <button
              type="button"
              onClick={() => setPendingTransactions(null)}
              className="ms-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white"
            >
              انصراف
            </button>
          </div>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
        >
          {message}
        </p>
      )}

      <p className="text-sm leading-6 text-slate-500">
        نکته: فایل پشتیبان را در محلی امن، جدا از این مرورگر نگه‌دار. پاک‌شدن
        داده‌های مرورگر ممکن است اطلاعات ذخیره‌شده در خانه‌حساب را از بین ببرد.
      </p>
    </main>
  );
}
