"use client";

import React, { useState, FormEvent, useEffect } from "react";
import Link from "next/link";

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Public Opinions</h1>

      {/* Post Opinion Form */}
      <section className="mb-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-medium">Share Your Opinion</h2>

        {!mounted ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : !isLoggedIn ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            Please{" "}
            <Link href="/login" className="font-medium underline hover:text-amber-900">
              log in
            </Link>{" "}
            to post an opinion.
          </div>
        ) : (
          <>
            {success && (
              <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-800">
                Opinion posted successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="author" className="mb-1 block text-sm font-medium text-gray-700">
                  Display Name (optional)
                </label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={username || "Anonymous"}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use your username ({username || "Not set"})
                </p>
              </div>

              <div>
                <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">{content.length}/1000 characters</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Posting..." : "Post Opinion"}
              </button>
            </form>
          </>
        )}
      </section>

      {/* Opinions List */}
      <section>
        <h2 className="mb-4 text-xl font-medium">
          {opinions.length === 0 ? "No opinions yet" : `Opinions (${opinions.length})`}
        </h2>

        {loading ? (
          <div className="text-center text-gray-500">Loading opinions...</div>
        ) : opinions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            Be the first to share an opinion!
          </div>
        ) : (
          <div className="space-y-4">
            {opinions.map((opinion) => (
              <article
                key={opinion.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {opinion.author}
                  </span>
                  <time className="text-xs text-gray-500">
                    {formatDate(opinion.timestamp)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{opinion.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

