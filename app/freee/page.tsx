"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Expense {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string;
  receiptType: string;
  checked: boolean;
  freeeId: string | null;
  member: { name: string };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function FreeeContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const monthStr = sp.get("month") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/expenses?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => { setExpenses(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [monthStr]);

  const downloadCSV = (type: "freee" | "simple") => {
    window.location.href = `/api/export?month=${monthStr}&type=${type}`;
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">freee連携・まとめビュー</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthStr}
            onChange={(e) => router.push(`/freee?month=${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => downloadCSV("freee")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            freee用CSV
          </button>
          <button
            onClick={() => downloadCSV("simple")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
          >
            シンプルCSV
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-3 text-sm text-gray-500">勘定科目別集計</h2>
          <div className="space-y-2">
            {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center">
                <span className="text-sm px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{cat}</span>
                <span className="font-medium">¥{amt.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && (
              <div className="text-gray-400 text-sm">データなし</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-3 text-sm text-gray-500">合計</h2>
          <div className="text-3xl font-bold text-red-600">¥{total.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">{expenses.length}件</div>
          <div className="mt-4 text-xs text-gray-400">
            <div>freeeへのCSVインポート手順:</div>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>CSVダウンロード</li>
              <li>freee → 取引 → インポート</li>
              <li>CSVファイルを選択</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">全経費一覧（日付順・freee入力用）</h2>
          <span className="text-sm text-gray-400">{expenses.length}件</span>
        </div>
        {loading ? (
          <div className="p-6 text-gray-400 text-sm text-center">読み込み中...</div>
        ) : expenses.length === 0 ? (
          <div className="p-6 text-gray-400 text-sm text-center">データがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">借方勘定科目</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">借方金額</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">摘要</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">担当者</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">領収書</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">確認</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e.id} className={e.freeeId ? "bg-green-50" : ""}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">¥{e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{e.member.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${e.receiptType === "紙" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                        {e.receiptType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{e.checked ? "✅" : "⬜"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold">合計</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">¥{total.toLocaleString()}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FreeePage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">読み込み中...</div>}>
      <FreeeContent />
    </Suspense>
  );
}
