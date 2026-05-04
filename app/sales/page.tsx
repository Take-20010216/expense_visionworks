"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Sale {
  id: number;
  date: string;
  amount: number;
  description: string;
  client: string | null;
  category: string;
}

const SALE_CATEGORIES = ["売上高", "受取利息", "雑収入", "その他収益"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function SalesContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const monthStr = sp.get("month") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    client: "",
    category: "売上高",
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/sales?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => { setSales(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [monthStr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ date: new Date().toISOString().slice(0, 10), amount: "", description: "", client: "", category: "売上高" });
    setShowForm(false);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    load();
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const total = sales.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">売上管理</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthStr}
            onChange={(e) => router.push(`/sales?month=${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            + 売上入力
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold">売上を追加</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">日付</label>
              <input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">金額（円）</label>
              <input type="number" required min="1" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                placeholder="例: 100000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">内容</label>
              <input type="text" required value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="例: ウェブサイト制作費" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">取引先（任意）</label>
              <input type="text" value={form.client} onChange={(e) => set("client", e.target.value)}
                placeholder="例: 株式会社〇〇" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">勘定科目</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {SALE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
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
        ) : sales.length === 0 ? (
          <div className="p-6 text-gray-400 text-sm text-center">データがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">日付</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">内容</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">取引先</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">勘定科目</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">{s.description}</td>
                  <td className="px-4 py-3 text-gray-500">{s.client ?? "—"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{s.category}</span></td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">¥{s.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(s.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-semibold">合計</td>
                <td className="px-4 py-3 text-right font-bold text-lg text-green-600">¥{total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">読み込み中...</div>}>
      <SalesContent />
    </Suspense>
  );
}
