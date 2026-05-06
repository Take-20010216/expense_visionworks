import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "経費管理",
  description: "経費管理・freee連携アプリ",
};

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/expenses", label: "経費一覧" },
  { href: "/expenses/new", label: "経費入力" },
  { href: "/reports", label: "担当者別集計" },
  { href: "/sales", label: "売上" },
  { href: "/payroll", label: "人件費" },
  { href: "/freee", label: "freee連携" },
  { href: "/members", label: "メンバー" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900" suppressHydrationWarning>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-14 overflow-x-auto">
            <span className="font-bold text-blue-600 mr-4 whitespace-nowrap">💼 経費管理</span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 whitespace-nowrap text-gray-700 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-6">{children}</main>
      </body>
    </html>
  );
}
