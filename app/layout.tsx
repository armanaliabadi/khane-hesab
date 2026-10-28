
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "خانه‌حساب",
  description: "مدیریت مالی خانوار آرمان و فائزه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
