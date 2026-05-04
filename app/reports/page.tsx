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
  member: { id: number; name: string };
}

interface Payroll {
  id: number;
  month: string;
  amount: number;
  type: string;
  member: { id: number; name: string };
}

interface MemberSummary {
  id: number;
  name: string;
  expenseTotal: number;
  payrollTotal: number;
  count: number;
  expenses: Expense[];
  payrolls: Payroll[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ReportsContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const monthStr = sp.get("month") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [summaries, setSummaries] = useState<MemberSummary[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/expenses?month=${monthStr}`).then((r) => r.json()),
      fetch(`/api/payroll?month=${monthStr}`).then((r) => r.json()),
    ]).then(([expenses, payrolls]: [Expense[], Payroll[]]) => {
      const map = new Map<number, MemberSummary>();
      for (const e of expenses) {
        const mid = e.member.id;
        if (!map.has(mid)) {
          map.set(mid, { id: mid, name: e.member.name, expenseTotal: 0, payrollTotal: 0, count: 0, expenses: [], payrolls: [] });
        }
        const s = map.get(mid)!;
        s.expenseTotal += e.amount;
        s.count++;
        s.expenses.push(e);
      }
      for (const p of payrolls) {
        const mid = p.member.id;
        if (!map.has(mid)) {
          map.set(mid, { id: mid, name: p.member.name, expenseTotal: 0, payrollTotal: 0, count: 0, expenses: [], payrolls: [] });
        }
        map.get(mid)!.payrollTotal += p.amount;
        map.get(mid)!.payrolls.push(p);
      }
      setSummaries([...map.values()].sort((a, b) => (b.expenseTotal + b.payrollTotal) - (a.expenseTotal + a.payrollTotal)));
      setLoading(false);
    });
  }, [monthStr]);

  const [year, month] = monthStr.split("-").map(Number);
  const monthLabel = `${year}年${month}月`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">担当者別集計・振込確認</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthStr}
            onChange={(e) => router.push(`/reports?month=${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="font-semibold text-blue-800 mb-1">{monthLabel}の振込一覧</div>
        {loading ? (
          <div className="text-blue-600 text-sm">読み込み中...</div>
        ) : summaries.length === 0 ? (
          <div className="text-blue-600 text-sm">データがありません</div>
        ) : (
          <div className="space-y-2">
            {summaries.map((s) => (
              <div key={s.id} className="text-sm">
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700">{s.name} さんへ振込</span>
                  <span className="font-bold text-blue-900">¥{(s.expenseTotal + s.payrollTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-500 pl-2">
                  {s.expenseTotal > 0 && <span>立替 ¥{s.expenseTotal.toLocaleString()}</span>}
                  {s.payrollTotal > 0 && <span>人件費 ¥{s.payrollTotal.toLocaleString()}</span>}
                  {s.expenseTotal === 0 && s.payrollTotal > 0 && <span></span>}
                </div>
              </div>
            ))}
            <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between font-bold">
              <span className="text-blue-800">合計振込額</span>
              <span className="text-blue-900">¥{summaries.reduce((s, m) => s + m.expenseTotal + m.payrollTotal, 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {summaries.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {s.name[0]}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.count}件の経費</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-lg text-red-600">¥{(s.expenseTotal + s.payrollTotal).toLocaleString()}</div>
                  <div className="text-xs text-gray-400 space-x-2">
                    {s.expenseTotal > 0 && <span>立替 ¥{s.expenseTotal.toLocaleString()}</span>}
                    {s.payrollTotal > 0 && <span>人件費 ¥{s.payrollTotal.toLocaleString()}</span>}
                  </div>
                </div>
                <span className="text-gray-400">{expanded === s.id ? "▲" : "▼"}</span>
              </div>
            </button>
            {expanded === s.id && (
              <div className="border-t border-gray-100">
                {s.expenses.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">日付</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">内容</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">勘定科目</th>
                        <th className="px-4 py-2 text-right text-gray-500 font-medium">金額</th>
                        <th className="px-4 py-2 text-center text-gray-500 font-medium">確認</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {s.expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="px-4 py-2">{formatDate(e.date)}</td>
                          <td className="px-4 py-2">{e.description}</td>
                          <td className="px-4 py-2 text-xs text-blue-700">{e.category}</td>
                          <td className="px-4 py-2 text-right">¥{e.amount.toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">{e.checked ? "✅" : "⬜"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {s.payrolls.length > 0 && (
                  <div className="border-t border-purple-100 bg-purple-50 px-4 py-3">
                    <div className="text-xs font-medium text-purple-600 mb-2">人件費</div>
                    <div className="space-y-1">
                      {s.payrolls.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-purple-700">{p.type}</span>
                          <span className="font-medium text-purple-900">¥{p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">読み込み中...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
