"use client";

import React, { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Opinion {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

export default function OpinionsPage() {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  // Check login status and fetch opinions on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedUsername = localStorage.getItem("username");
      setUsername(savedUsername);
      setIsLoggedIn(!!savedUsername);
    }
    fetchOpinions();
  }, []);

  // Listen for login changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const savedUsername = localStorage.getItem("username");
        setUsername(savedUsername);
        setIsLoggedIn(!!savedUsername);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Listen for custom auth change event (same-tab logout)
    window.addEventListener("authChange", handleStorageChange);
    // Also check on focus in case login happened in another tab
    window.addEventListener("focus", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [mounted]);

  const fetchOpinions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/opinions");
      const data = await response.json();

      if (data.success) {
        setOpinions(data.opinions || []);
      } else {
        setError("Failed to load opinions");
      }
    } catch (err) {
      setError("Failed to load opinions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !isLoggedIn) return;

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Use logged-in username as author, or the custom author field if provided
      const finalAuthor = author.trim() || username || "Anonymous";

      const response = await fetch("/api/opinions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, author: finalAuthor }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to post opinion");
      }

      setSuccess(true);
      setContent("");
      setAuthor("");
      
      // Refresh opinions list
      await fetchOpinions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post opinion");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-cyan-400"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-zinc-100">Public Opinions</h1>

        {/* Post Opinion Form */}
        <section className="mb-10 rounded-xl border border-zinc-800 bg-[#111] p-6 shadow-xl">
          <h2 className="mb-6 text-xl font-medium text-zinc-100">Share Your Opinion</h2>

          {!mounted ? (
            <div className="text-center text-zinc-400">Loading...</div>
          ) : !isLoggedIn ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400 backdrop-blur-sm">
              Please{" "}
              <Link href="/login" className="font-medium underline hover:text-amber-300 transition-colors">
                log in
              </Link>{" "}
              to post an opinion.
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 backdrop-blur-sm">
                  Opinion posted successfully!
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 backdrop-blur-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="author" className="mb-2 block text-sm font-medium text-zinc-300">
                    Display Name (optional)
                  </label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={username || "Anonymous"}
                    className="block w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Leave empty to use your username ({username || "Not set"})
                  </p>
                </div>

                <div>
                  <label htmlFor="content" className="mb-2 block text-sm font-medium text-zinc-300">
                    Your Opinion
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    required
                    className="block w-full resize-y rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <p className="mt-1 text-xs text-zinc-500">{content.length}/1000 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:bg-cyan-600 hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-cyan-500"
                >
                  {submitting ? "Posting..." : "Post Opinion"}
                </button>
              </form>
            </>
          )}
        </section>

        {/* Opinions List */}
        <section>
          <h2 className="mb-6 text-xl font-medium text-zinc-100">
            {opinions.length === 0 ? "No opinions yet" : `Opinions (${opinions.length})`}
          </h2>

          {loading ? (
            <div className="text-center text-zinc-400">Loading opinions...</div>
          ) : opinions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-[#111] p-8 text-center text-zinc-400 shadow-xl">
              Be the first to share an opinion!
            </div>
          ) : (
            <div className="space-y-4">
              {opinions.map((opinion) => (
                <article
                  key={opinion.id}
                  className="rounded-xl border border-zinc-800 bg-[#111] p-5 shadow-lg transition-all duration-200 hover:border-zinc-700 hover:shadow-xl"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-400">
                      {opinion.author}
                    </span>
                    <time className="text-xs text-zinc-500">
                      {formatDate(opinion.timestamp)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{opinion.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

