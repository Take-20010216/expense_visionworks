import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const [expenses, sales, pendingExpenses, payroll] = await Promise.all([
    prisma.expense.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.count({
      where: { date: { gte: start, lt: end }, checked: false },
    }),
    prisma.payroll.aggregate({
      where: { month: monthStr },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return { expenses, sales, pendingExpenses, payroll };
}

async function getMemberSummary(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const members = await prisma.member.findMany({
    include: {
      expenses: {
        where: { date: { gte: start, lt: end } },
        select: { amount: true },
      },
    },
  });

  return members
    .map((m) => ({
      name: m.name,
      total: m.expenses.reduce((s, e) => s + e.amount, 0),
      count: m.expenses.length,
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.total - a.total);
}

function formatJPY(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

const MONTHS = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const monthStr = sp.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = monthStr.split("-").map(Number);

  const [stats, memberSummary] = await Promise.all([
    getStats(year, month),
    getMemberSummary(year, month),
  ]);

  const fiscalMonths = Array.from({ length: 12 }, (_, i) => {
    const m = ((i + 3) % 12) + 1;
    const y = m >= 4 ? year : year + 1;
    return { label: MONTHS[i], value: `${y}-${String(m).padStart(2, "0")}` };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex gap-2 flex-wrap">
          {fiscalMonths.map((m) => (
            <Link
              key={m.value}
              href={`/?month=${m.value}`}
              className={`px-3 py-1 text-sm rounded-full border ${
                m.value === monthStr
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">今月の経費合計</div>
          <div className="text-2xl font-bold text-red-600">
            {formatJPY(stats.expenses._sum.amount ?? 0)}
          </div>
          <div className="text-xs text-gray-400">{stats.expenses._count} 件</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">今月の売上合計</div>
          <div className="text-2xl font-bold text-green-600">
            {formatJPY(stats.sales._sum.amount ?? 0)}
          </div>
          <div className="text-xs text-gray-400">{stats.sales._count} 件</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">人件費合計</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatJPY(stats.payroll._sum.amount ?? 0)}
          </div>
          <div className="text-xs text-gray-400">{stats.payroll._count} 件</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">収支（売上－経費－人件費）</div>
          <div className={`text-2xl font-bold ${
            (stats.sales._sum.amount ?? 0) - (stats.expenses._sum.amount ?? 0) - (stats.payroll._sum.amount ?? 0) >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}>
            {formatJPY((stats.sales._sum.amount ?? 0) - (stats.expenses._sum.amount ?? 0) - (stats.payroll._sum.amount ?? 0))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-4">担当者別立替金額</h2>
          {memberSummary.length === 0 ? (
            <p className="text-gray-400 text-sm">データなし</p>
          ) : (
            <div className="space-y-3">
              {memberSummary.map((m) => (
                <div key={m.name} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.count}件</span>
                  </div>
                  <span className="font-bold text-red-600">{formatJPY(m.total)}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/reports" className="text-sm text-blue-600 hover:underline mt-4 block">
            振込確認 →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-4">クイックアクション</h2>
          <div className="space-y-2">
            <Link href="/expenses/new" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium">
              + 経費を入力する
            </Link>
            <Link href={`/freee?month=${monthStr}`} className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium">
              freee連携・CSV出力
            </Link>
            <Link href={`/expenses?month=${monthStr}`} className="block w-full border border-gray-300 text-center py-2 px-4 rounded-lg hover:bg-gray-50 text-sm">
              経費一覧を確認
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
