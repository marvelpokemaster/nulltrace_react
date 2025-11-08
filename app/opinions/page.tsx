"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Opinion {
  id: string;
  author: string | null;
  content: string;
  timestamp: string;
  sentiment?: string;
  rating?: number | string;
}

export default function OpinionsPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  const fetchOpinions = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5000/api/opinions");
      const data = await res.json();
      console.log("🧾 Raw API Response:", data);

      if (!res.ok) throw new Error(data.error || "Failed to load opinions");

      const processed = data.map((op: any, i: number) => {
        console.log(`➡️ Opinion[${i}]`, op);
        return {
          id: op.id || op.opinion_id,
          author: op.author || op.submitted_by || "Anonymous",
          content: op.content,
          timestamp: op.timestamp,
          sentiment: op.sentiment,
          rating:
            typeof op.rating === "string"
              ? parseInt(op.rating)
              : typeof op.rating === "number"
              ? op.rating
              : null,
        };
      });

      console.log("✅ Processed opinions:", processed);
      setOpinions(processed);
    } catch (err) {
      console.error("❌ Fetch opinions error:", err);
      setError(err instanceof Error ? err.message : "Failed to load opinions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchOpinions();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/opinions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitted_by: userId, content }),
      });

      const data = await res.json();
      console.log("📤 Submitted Opinion:", data);

      if (!res.ok) throw new Error(data.error || "Failed to post opinion");

      setContent("");
      await fetchOpinions();
    } catch (err) {
      console.error("❌ Post opinion error:", err);
      setError(err instanceof Error ? err.message : "Failed to post opinion");
    } finally {
      setSubmitting(false);
    }
  };

  const sentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-400 bg-green-500/10";
      case "negative":
        return "text-red-400 bg-red-500/10";
      default:
        return "text-zinc-400 bg-zinc-700/20";
    }
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-cyan-400 text-sm"
          >
            ← Back
          </button>
          <button
            onClick={fetchOpinions}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Refresh
          </button>
        </div>

        {/* Opinion Form */}
        <section className="bg-[#111] border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Share your opinion</h2>

          {username ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-red-500/30 bg-red-500/10 text-red-400 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your opinion..."
                rows={4}
                required
                className="w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Opinion"}
              </button>
            </form>
          ) : (
            <div className="text-center text-zinc-400 py-6 border border-zinc-800 rounded-lg bg-[#181818]">
              🔒 Please{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-400 underline hover:text-blue-300"
              >
                log in
              </button>{" "}
              to post an opinion.
            </div>
          )}
        </section>

        {/* Opinions list */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">
            Public Opinions ({opinions.length})
          </h2>

          {loading ? (
            <div className="text-center text-zinc-400">Loading opinions...</div>
          ) : opinions.length === 0 ? (
            <div className="text-center text-zinc-500">
              No opinions yet. Be the first!
            </div>
          ) : (
            <div className="space-y-4">
              {opinions.map((op) => (
                <div
                  key={op.id}
                  className="rounded-xl border border-zinc-800 bg-[#111] p-5 shadow hover:border-zinc-700 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-cyan-400">
                      {op.author
                        ? `User ${op.author.slice(0, 8)}`
                        : "Anonymous"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDate(op.timestamp)}
                    </span>
                  </div>
                  <p className="text-zinc-200 mb-3">{op.content}</p>

                  <div className="flex items-center gap-3 text-xs">
                    {op.sentiment && (
                      <span
                        className={`px-2 py-1 rounded ${sentimentColor(
                          op.sentiment
                        )}`}
                      >
                        {op.sentiment}
                      </span>
                    )}
                    {op.rating != null ? (
                      <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">
                        ⭐ {op.rating}/5
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                        No rating
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
