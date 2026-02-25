'use client'

import React, { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const [overview, setOverview] = useState(null)
  const [opinions, setOpinions] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [view, setView] = useState('overview')
  const [targetFilter, setTargetFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    const username = localStorage.getItem('username')
    if (!username) {
      alert('Unauthorized access! Please log in as admin.')
      window.location.href = '/login'
      return
    }

    const loadData = async () => {
      try {
        const headers = { 'X-Username': username }

        const [ov, op, fb] = await Promise.all([
          fetch(`${API}/api/admin/overview`, { headers }).then(r => r.json()),
          fetch(`${API}/api/admin/opinions`, { headers }).then(r => r.json()),
          fetch(`${API}/api/admin/feedbacks`, { headers }).then(r => r.json())
        ])

        setOverview(ov)
        setOpinions(op)
        setFeedbacks(fb.map(f => ({
          ...f,
          rating: f.rating ?? 3,
          sentiment: f.sentiment ?? 'neutral'
        })))
      } catch (err) {
        console.error('Failed to load admin data:', err)
      }
    }

    loadData()
  }, [API])

  if (!overview) return <p style={{ padding: 20 }}>Loading admin data...</p>

  const filteredAndSortedOpinions = (opinions || [])
    .filter(o => !targetFilter || o.target === targetFilter)
    .sort((a, b) => {
      const ra = a.rating ?? 0
      const rb = b.rating ?? 0
      return sortOrder === 'asc' ? ra - rb : rb - ra
    })

  const sentimentColor = s => {
    if (s === 'positive') return { color: '#22c55e' }
    if (s === 'negative') return { color: '#ef4444' }
    return { color: '#9ca3af' }
  }

  return (
    <main style={{ padding: 20, background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, color: '#22d3ee' }}>Admin Dashboard</h1>

      {/* View Switcher */}
      <div style={{ margin: '20px 0' }}>
        {['overview', 'opinions', 'feedbacks'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              marginRight: 10,
              background: view === v ? '#06b6d4' : '#111',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {view === 'overview' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15 }}>
          {[
            { label: 'Users', value: overview.users },
            { label: 'Targets', value: overview.targets },
            { label: 'Opinions', value: overview.opinions },
            { label: 'Feedbacks', value: overview.feedbacks }
          ].map(stat => (
            <div key={stat.label} style={{ background: '#111', padding: 15, borderRadius: 10, textAlign: 'center' }}>
              <p>{stat.label}</p>
              <h2 style={{ color: '#22d3ee' }}>{stat.value}</h2>
            </div>
          ))}
        </section>
      )}

      {/* Opinions Section */}
      {view === 'opinions' && (
        <section style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 15, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <select
              onChange={e => setTargetFilter(e.target.value)}
              style={{ background: '#111', color: '#fff', padding: 8, borderRadius: 6 }}
            >
              <option value="">All Targets</option>
              {[...new Set(opinions.map(o => o.target))].map(t => (
                <option key={t || 'unknown'} value={t}>{t || 'Unknown'}</option>
              ))}
            </select>

            <select
              onChange={e => setSortOrder(e.target.value)}
              style={{ background: '#111', color: '#fff', padding: 8, borderRadius: 6 }}
            >
              <option value="desc">Sort: Highest Rated</option>
              <option value="asc">Sort: Lowest Rated</option>
            </select>
          </div>

          {filteredAndSortedOpinions.length === 0 ? (
            <p style={{ color: '#888' }}>No opinions found.</p>
          ) : (
            filteredAndSortedOpinions.map(o => (
              <div
                key={o.opinion_id}
                style={{
                  border: '1px solid #222',
                  background: '#111',
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 10
                }}
              >
                <p><b style={{ color: '#22d3ee' }}>{o.user}</b> on <b>{o.target}</b></p>
                <p style={{ color: '#bbb' }}>{o.content}</p>
                <p style={{ fontSize: 13, marginTop: 5 }}>
                  <span style={sentimentColor(o.sentiment)}>{o.sentiment || 'neutral'}</span>{' '}
                  <span style={{ color: '#22d3ee' }}>⭐ {o.rating ?? 'N/A'}/5</span>
                </p>
              </div>
            ))
          )}
        </section>
      )}

      {/* Feedback Section */}
      {view === 'feedbacks' && (
        <section style={{ marginTop: 20 }}>
          {feedbacks.length === 0 ? (
            <p style={{ color: '#888' }}>No feedbacks yet.</p>
          ) : (
            feedbacks.map(f => (
              <div
                key={f.response_id}
                style={{
                  border: '1px solid #333',
                  background: '#111',
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 10
                }}
              >
                <p>
                  <b style={{ color: '#22d3ee' }}>Anonymous</b>{' '}
                  ({new Date(f.timestamp).toLocaleString()})
                </p>
                <p style={{ color: '#bbb', marginBottom: 5 }}>{f.content}</p>

                <p style={{ fontSize: 13 }}>
                  <span style={sentimentColor(f.sentiment || 'neutral')}>
                    {f.sentiment || 'neutral'}
                  </span>{' '}
                  <span style={{ color: '#22d3ee' }}>
                    ⭐ {f.rating != null ? f.rating : 'N/A'}/5
                  </span>
                </p>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  )
}
