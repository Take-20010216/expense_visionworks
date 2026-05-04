"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "旅費交通費", "消耗品費", "通信費", "会議費", "接待交際費",
  "外注費", "福利厚生費", "広告宣伝費", "事務用品費", "地代家賃", "車両費", "雑費", "その他経費",
];

interface Member { id: number; name: string }

export default function NewExpensePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    amount: "",
    description: "",
    category: "消耗品費",
    receiptType: "紙",
    memo: "",
    memberId: "",
    checked: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMethod, setAiMethod] = useState<"ai" | "keyword" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then((data) => {
      setMembers(data);
      if (data.length > 0) setForm((f) => ({ ...f, memberId: String(data[0].id) }));
    });
  }, []);

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const autoCategory = async () => {
    if (!form.description) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description }),
      });
      const data = await res.json();
      if (data.category) {
        set("category", data.category);
        setAiMethod(data.method ?? "keyword");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberId) return alert("担当者を選択してください");
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      router.push("/expenses?month=" + form.date.slice(0, 7));
    } catch (e) {
      setSaveError("保存失敗: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">経費入力</h1>

      <form onSubmit={submit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）</label>
            <input
              type="number"
              required
              min="1"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="例: 1000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="例: 電車代、コピー用紙"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={autoCategory}
              disabled={aiLoading || !form.description}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 disabled:opacity-50 whitespace-nowrap"
            >
              {aiLoading ? "判定中..." : "🤖 自動分類"}
            </button>
          </div>
          {aiMethod && (
            <p className="text-xs text-gray-400 mt-1">
              {aiMethod === "ai" ? "✨ Claude AIで分類しました" : "🔍 キーワードで分類しました（変更可）"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">勘定科目</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
            <select
              required
              value={form.memberId}
              onChange={(e) => set("memberId", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">領収書種別</label>
            <select
              value={form.receiptType}
              onChange={(e) => set("receiptType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="紙">紙</option>
              <option value="電子">電子</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
            placeholder="備考"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="checked"
            checked={form.checked}
            onChange={(e) => set("checked", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="checked" className="text-sm text-gray-700">領収書確認済み</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/expenses")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
