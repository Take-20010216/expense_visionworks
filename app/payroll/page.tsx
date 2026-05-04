"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Payroll {
  id: number;
  month: string;
  amount: number;
  type: string;
  member: { name: string };
}

interface Member { id: number; name: string }

const PAYROLL_TYPES = ["給与", "賞与", "社会保険料（会社負担）", "交通費支給", "その他"];

function PayrollContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const monthStr = sp.get("month") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: monthStr, amount: "", type: "給与", memberId: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/payroll?month=${monthStr}`).then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([p, m]) => {
      setPayrolls(p);
      setMembers(m);
      if (m.length > 0 && !form.memberId) setForm((f) => ({ ...f, memberId: String(m[0].id) }));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [monthStr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberId) return;
    setSaving(true);
    await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month: monthStr }),
    });
    setSaving(false);
    setShowForm(false);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/payroll/${id}`, { method: "DELETE" });
    load();
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const total = payrolls.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">人件費管理</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={monthStr}
            onChange={(e) => router.push(`/payroll?month=${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + 人件費入力
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold">人件費を追加</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">担当者</label>
              <select required value={form.memberId} onChange={(e) => set("memberId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">選択...</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">種別</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {PAYROLL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">金額（円）</label>
            <input type="number" required min="1" value={form.amount} onChange={(e) => set("amount", e.target.value)}
              placeholder="例: 300000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              キャンセル
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-400 text-sm text-center">読み込み中...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-6 text-gray-400 text-sm text-center">データがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">月</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">担当者</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">種別</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.month}</td>
                  <td className="px-4 py-3">{p.member.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{p.type}</span></td>
                  <td className="px-4 py-3 text-right font-medium">¥{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold">合計</td>
                <td className="px-4 py-3 text-right font-bold text-lg">¥{total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

export default function PayrollPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">読み込み中...</div>}>
      <PayrollContent />
    </Suspense>
  );
}
