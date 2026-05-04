"use client";

import { useEffect, useState } from "react";

interface Member {
  id: number;
  name: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMembers(await res.json());
    } catch (e) {
      setError("読み込み失敗: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setNewName("");
      await load();
    } catch (e) {
      setError("追加失敗: " + (e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("削除しますか？関連する経費データも削除されます。")) return;
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">メンバー管理</h1>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold mb-3">メンバーを追加</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="名前を入力"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={add}
            disabled={adding || !newName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "追加中..." : "追加"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-5 text-gray-400 text-sm">読み込み中...</div>
        ) : members.length === 0 ? (
          <div className="p-5 text-gray-400 text-sm">メンバーがいません</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-medium">{m.name}</span>
                <button
                  onClick={() => remove(m.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
