"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Auto-redirect if already logged in
  useEffect(() => {
  if (typeof window !== "undefined") {
    const savedUsername = localStorage.getItem("username");
    const savedUserId = localStorage.getItem("user_id");

    if (savedUsername && savedUserId) {
      if (savedUsername.toLowerCase() === "admin") {
        router.push("/admin");
      } else {
        router.push("/opinions");
      }
    }
  }
}, [router]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid username or password");

      // Save user session to localStorage
      localStorage.setItem("username", data.name || username);
      localStorage.setItem("user_id", data.user_id);
      window.dispatchEvent(new CustomEvent("authChange"));
      if (data.name && data.name.toLowerCase() === "admin") {
  router.push("/admin");
} else {
  router.push("/opinions");
}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(59,130,246,0.1),transparent_60%)]" />
      <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="w-full rounded-xl border border-zinc-800 bg-[#111] p-8 shadow-2xl">
          <h1 className="mb-2 text-3xl font-semibold text-zinc-100">Login</h1>
          <p className="mb-8 text-zinc-400">Enter your credentials to continue</p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/register" className="text-sm text-zinc-400 hover:text-blue-400">
              Don’t have an account? Register
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
