'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithCSRF } from '@/lib/csrf'

export default function FeedbackPage() {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    const storedUserId = localStorage.getItem('user_id')
    if (!storedUserId || !storedUsername) {
      router.push('/login')
      return
    }
    setUsername(storedUsername)
  }, [router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const userId = localStorage.getItem('user_id')
    if (!userId) {
      setError('Please log in first.')
      router.push('/login')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let body, headers;

      if (file) {
        const formData = new FormData();
        formData.append('submitted_by', userId);
        formData.append('content', message);
        formData.append('file', file);
        body = formData;
        // Omit Content-Type to let browser generate boundary for multipart/form-data
        headers = {};
      } else {
        body = JSON.stringify({
          submitted_by: userId,
          content: message
        });
        headers = { 'Content-Type': 'application/json' };
      }

      const res = await fetchWithCSRF('http://127.0.0.1:5000/api/feedback', {
        method: 'POST',
        headers,
        body
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')

      setSubmitted(true)
      setMessage('')
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-cyan-400 text-sm"
          >
            ← Back
          </button>
        </div>

        <h1 className="text-3xl font-semibold mb-2">Feedback</h1>
        <p className="mb-8 text-zinc-400 text-sm">
          Logged in as <span className="text-blue-400">{username}</span>
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-[#111] border border-zinc-800 p-6 rounded-xl shadow-xl"
        >
          {submitted && (
            <div className="border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 rounded-lg text-sm">
              ✅ Thanks for your feedback!
            </div>
          )}

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your feedback..."
            rows={5}
            className="w-full rounded-lg border border-zinc-700 bg-[#222] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required={!file}
          />

          <div className="flex flex-col gap-2 text-sm bg-[#1a1a1a] p-4 rounded-lg border border-zinc-800">
            <label className="text-zinc-400 font-medium">Or upload a .txt file:</label>
            <input 
              type="file" 
              accept=".txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-600 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </main>
  )
}
