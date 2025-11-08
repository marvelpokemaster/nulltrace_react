"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Opinion {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  sentiment?: string;
  rating?: number;
  hash?: string;
}

export default function OpinionsPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch feedback on mount
  useEffect(() => {
    fetchOpinions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOpinions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://127.0.0.1:5000/api/feedback");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load feedback");
      }

      // Transform feedback data to match our Opinion interface
      const feedbacks = Array.isArray(data) ? data : (data.feedbacks || data.feedback || []);
      setOpinions(feedbacks.map((item: any) => ({
        id: item.id || item.hash || Math.random().toString(),
        content: item.message || item.content || "",
        author: item.email || item.author || "Anonymous",
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        sentiment: item.sentiment,
        rating: item.rating,
        hash: item.hash,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
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
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-zinc-100">Feedback List</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Feedback List */}
        <section>
          <h2 className="mb-6 text-xl font-medium text-zinc-100">
            {opinions.length === 0 ? "No feedback yet" : `Feedback (${opinions.length})`}
          </h2>

          {loading ? (
            <div className="text-center text-zinc-400">Loading feedback...</div>
          ) : opinions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-[#111] p-8 text-center text-zinc-400 shadow-xl">
              No feedback yet. Be the first to submit feedback!
            </div>
          ) : (
            <div className="space-y-4">
              {opinions.map((opinion) => (
                <article
                  key={opinion.id}
                  className="rounded-xl border border-zinc-800 bg-[#111] p-5 shadow-lg transition-all duration-200 hover:border-zinc-700 hover:shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-400">
                      {opinion.author}
                    </span>
                    <time className="text-xs text-zinc-500">
                      {formatDate(opinion.timestamp)}
                    </time>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-zinc-300 leading-relaxed">{opinion.content}</p>
                  {(opinion.sentiment || opinion.rating !== undefined || opinion.hash) && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-3 text-xs">
                      {opinion.sentiment && (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                          Sentiment: {opinion.sentiment}
                        </span>
                      )}
                      {opinion.rating !== undefined && (
                        <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                          Rating: {opinion.rating}/5
                        </span>
                      )}
                      {opinion.hash && (
                        <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {opinion.hash.substring(0, 16)}...
                        </span>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

