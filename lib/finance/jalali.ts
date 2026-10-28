
import {
  toJalaali,
  toGregorian,
  isValidJalaaliDate,
} from "jalaali-js";

export function formatJalaliDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error("فرمت تاریخ میلادی معتبر نیست.");
  }

  const [year, month, day] = isoDate.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("تاریخ میلادی معتبر نیست.");
  }

  const jalali = toJalaali(year, month, day);

  return `${jalali.jy}/${String(jalali.jm).padStart(2, "0")}/${String(
    jalali.jd,
  ).padStart(2, "0")}`;
}

export function jalaliToIsoDate(
  year: number,
  month: number,
  day: number,
): string {
  if (!isValidJalaaliDate(year, month, day)) {
    throw new Error("تاریخ شمسی معتبر نیست.");
  }

  const gregorian = toGregorian(year, month, day);

  return `${gregorian.gy}-${String(gregorian.gm).padStart(2, "0")}-${String(
    gregorian.gd,
  ).padStart(2, "0")}`;
}

export function getJalaliMonthRange(
  year: number,
  month: number,
): { start: string; end: string } {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("ماه شمسی باید عددی بین ۱ تا ۱۲ باشد.");
  }

  const lastDay =
    month <= 6 ? 31 : month <= 11 ? 30 : isValidJalaaliDate(year, 12, 30) ? 30 : 29;

  return {
    start: jalaliToIsoDate(year, month, 1),
    end: jalaliToIsoDate(year, month, lastDay),
  };
}
