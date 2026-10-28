
const UNIT_LABEL = "هزار تومان";

export function validateAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("مبلغ باید یک عدد صحیح مثبت باشد.");
  }
}

export function formatAmount(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new Error("مبلغ برای نمایش باید یک عدد صحیح امن باشد.");
  }

  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} ${UNIT_LABEL}`;
}
