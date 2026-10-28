
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "داشبورد" },
  { href: "/transactions", label: "تراکنش‌ها" },
  { href: "/backup", label: "پشتیبان‌گیری" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold text-emerald-700"
        >
          خانه‌حساب
        </Link>

        <nav
          aria-label="منوی اصلی"
          className="flex flex-wrap gap-1"
        >
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
