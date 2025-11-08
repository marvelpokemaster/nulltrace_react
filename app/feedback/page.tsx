"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, message }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Feedback</h1>

      {submitted && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-800">
          Thanks for your feedback!
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts..."
            rows={5}
            className="block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 transition hover:text-gray-900"
        >
          ← Go back to Home
        </Link>
      </div>
    </main>
  );
}


