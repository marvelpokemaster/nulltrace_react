"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("username");
      if (!username) {
        setRedirecting(true);
        router.push("/login");
      }
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError("");
    setResult(null);
    
    try {
      const res = await fetch("http://127.0.0.1:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
        }),
      });

      const data = await res.json();
      setResult(data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (redirecting) {
    return (
      <main className="min-h-screen bg-black px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="text-center text-zinc-400">Redirecting to login…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-cyan-400"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>
        
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-zinc-100">Feedback</h1>

        <div className="rounded-xl border border-zinc-800 bg-[#111] p-6 shadow-xl">
          {submitted && result && (
            <div className="mb-6 space-y-3">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 backdrop-blur-sm">
                Thanks for your feedback!
              </div>
              {result.sentiment && (
                <div className="rounded-lg border border-zinc-700 bg-[#1a1a1a] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">Sentiment:</span>
                    <span className="text-sm font-semibold text-blue-400">{result.sentiment}</span>
                  </div>
                  {result.rating !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">Rating:</span>
                      <span className="text-sm font-semibold text-cyan-400">{result.rating}/5</span>
                    </div>
                  )}
                  {result.hash && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">Hash:</span>
                      <span className="text-xs font-mono text-zinc-400 break-all">{result.hash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="block w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-zinc-300">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts..."
                rows={5}
                className="block w-full resize-y rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}


