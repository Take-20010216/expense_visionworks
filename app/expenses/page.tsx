"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  memo: string | null;
  member: { name: string };
}

interface Member { id: number; name: string }

const MONTHS = [
  { label: "4月", m: "04" }, { label: "5月", m: "05" }, { label: "6月", m: "06" },
  { label: "7月", m: "07" }, { label: "8月", m: "08" }, { label: "9月", m: "09" },
  { label: "10月", m: "10" }, { label: "11月", m: "11" }, { label: "12月", m: "12" },
  { label: "1月", m: "01" }, { label: "2月", m: "02" }, { label: "3月", m: "03" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ExpensesContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const now = new Date();
  const monthStr = sp.get("month") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const memberFilter = sp.get("memberId") ?? "";

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: monthStr });
    if (memberFilter) params.set("memberId", memberFilter);
    const [expRes, memRes] = await Promise.all([
      fetch(`/api/expenses?${params}`),
      fetch("/api/members"),
    ]);
    setExpenses(await expRes.json());
    setMembers(await memRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [monthStr, memberFilter]);

  const toggleCheck = async (e: Expense) => {
    await fetch(`/api/expenses/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !e.checked }),
    });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("この経費を削除しますか？")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const [year, month] = monthStr.split("-").map(Number);
  const fiscalYear = month >= 4 ? year : year - 1;

  const fiscalMonths = MONTHS.map((m) => {
    const fy = parseInt(m.m) >= 4 ? fiscalYear : fiscalYear + 1;
    return { ...m, value: `${fy}-${m.m}` };
  });

  const setMonth = (val: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("month", val);
    router.push(`/expenses?${params}`);
  };

  const setMember = (val: string) => {
    const params = new URLSearchParams(sp.toString());
    if (val) params.set("memberId", val); else params.delete("memberId");
    router.push(`/expenses?${params}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">経費一覧</h1>
        <Link href="/expenses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + 経費入力
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setMonth(`${fiscalYear - 1}-04`)}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >←</button>
        <span className="text-sm font-medium text-gray-600">{fiscalYear}年度</span>
        <button
          onClick={() => setMonth(`${fiscalYear + 1}-04`)}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >→</button>
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {fiscalMonths.map((m) => (
          <button
            key={m.value}
            onClick={() => setMonth(m.value)}
            className={`px-3 py-1 text-sm rounded-full border ${
              m.value === monthStr ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center mb-4">
        <select
          value={memberFilter}
          onChange={(e) => setMember(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全員</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">合計: <strong>¥{total.toLocaleString()}</strong>（{expenses.length}件）</span>
      </div>

      {loading ? (
        <div className="p-6 text-gray-400 text-sm text-center">読み込み中...</div>
      ) : expenses.length === 0 ? (
        <div className="p-6 text-gray-400 text-sm text-center">データがありません</div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {expenses.map((e) => (
              <div key={e.id} className={`bg-white rounded-xl border p-3 ${e.checked ? "border-green-200 bg-green-50" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={e.checked} onChange={() => toggleCheck(e)} className="rounded shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                        <span className="text-xs text-gray-500">{e.member.name}</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e.category}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${e.receiptType === "紙" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>{e.receiptType}</span>
                      </div>
                      <div className="font-medium text-sm mt-0.5">{e.description}</div>
                      {e.memo && <div className="text-xs text-gray-400 mt-0.5">{e.memo}</div>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm">¥{e.amount.toLocaleString()}</div>
                    <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 text-xs mt-1">削除</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex justify-between font-semibold text-sm">
              <span>合計</span>
              <span className="font-bold text-base">¥{total.toLocaleString()}</span>
            </div>
          </div>

          {/* PC: テーブル表示 */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">確認</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">日付</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">担当者</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">内容</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">勘定科目</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">領収書</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">メモ</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className={e.checked ? "bg-green-50" : ""}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={e.checked} onChange={() => toggleCheck(e)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{e.member.name}</td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">¥{e.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${e.receiptType === "紙" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                          {e.receiptType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{e.memo}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-semibold">合計</td>
                    <td className="px-4 py-3 text-right font-bold text-lg">¥{total.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">読み込み中...</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
