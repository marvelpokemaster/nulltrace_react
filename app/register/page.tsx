"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Registration successful, redirect to login
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(59,130,246,0.1),transparent_60%)]" />

      <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="w-full rounded-xl border border-zinc-800 bg-[#111] p-8 shadow-2xl">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-100">Register</h1>
          <p className="mb-8 text-zinc-400">
            Create a new account
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 backdrop-blur-sm">
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
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="block w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="block w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
            >
              Already have an account? Log in
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

