"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUsername = localStorage.getItem("username");
      if (savedUsername) {
        router.push("/");
      }
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Save username to localStorage
      localStorage.setItem("username", username.trim());
      
      // Dispatch custom event for auth change
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("authChange"));
      }
      
      // Redirect to home
      router.push("/");
    } catch (err) {
      setError("Failed to log in");
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(120,119,198,0.15),transparent_60%)]" />

      <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="w-full">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Login</h1>
          <p className="mb-8 text-zinc-400">
            Enter your username to continue
          </p>

          {error && (
            <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="block w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 shadow-sm outline-none ring-0 transition focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-black shadow-sm transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

