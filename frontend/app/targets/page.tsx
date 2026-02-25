"use client";
import React, { useState, useEffect, FormEvent } from "react";

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  async function fetchTargets() {
    const res = await fetch(`${API}/api/targets`);
    setTargets(await res.json());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch(`${API}/api/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });
    setName("");
    setCategory("");
    fetchTargets();
  }

  useEffect(() => {
    fetchTargets();
  }, []);

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6">
      <h1 className="text-2xl mb-4">Manage Opinion Targets</h1>
      <form onSubmit={handleSubmit} className="space-x-3 mb-6">
        <input
          placeholder="Target name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 bg-[#222] border border-zinc-700 rounded"
          required
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-[#222] border border-zinc-700 rounded"
        />
        <button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {targets.map((t: any) => (
          <li key={t.target_id} className="text-zinc-400">
            {t.name} {t.category && <span>({t.category})</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}