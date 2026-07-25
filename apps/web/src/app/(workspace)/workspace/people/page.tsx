'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Person {
  id: string; email: string; first_name: string; last_name: string
  middle_name: string | null; suffix: string | null; phone: string | null
  orcid: string | null; npi: string | null; status: string
  created_at: string; updated_at: string
}

export default function PeoplePage() {
  const { user } = useSession()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '' })

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchPeople = async (token: string) => {
    try {
      const res = await fetch(`${API}/api/v1/people`, { headers: headers(token) })
      const json = await res.json()
      if (json.data) setPeople(json.data)
      else setError(json.error ?? 'Failed to load')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!user) return
    const token = (user as any).access_token
    fetchPeople(token)
  }, [user])

  const createPerson = async () => {
    if (!user || !form.email || !form.first_name || !form.last_name) return
    const token = (user as any).access_token
    try {
      const res = await fetch(`${API}/api/v1/people`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.data) {
        setPeople(p => [json.data, ...p])
        setShowForm(false)
        setForm({ email: '', first_name: '', last_name: '' })
      } else setError(json.error ?? 'Failed to create')
    } catch { setError('Network error') }
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>Sign in to manage People</div>

  return (
    <div>
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
            Foundation Directory
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>People</h1>
          <p style={{ fontSize: 13, color: 'var(--txd)', maxWidth: 680 }}>
            Institutional personnel and their role assignments.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : 'Add Person'}
        </button>
      </header>

      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{error}</div>}

      {showForm && (
        <div style={{ padding: 20, marginBottom: 24, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg2)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>New Person</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <input placeholder="First Name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <input placeholder="Last Name *" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
          </div>
          <button onClick={createPerson}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Create Person
          </button>
        </div>
      )}

      {loading && <div style={{ color: 'var(--txd)', fontSize: 13 }}>Loading...</div>}

      {!loading && people.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)', fontSize: 13 }}>
          No people found. Add your first person to get started.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {people.map(p => (
          <div key={p.id} style={{ padding: '14px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.first_name} {p.last_name}{p.suffix ? `, ${p.suffix}` : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--txd)', marginTop: 2 }}>{p.email} {p.phone ? `· ${p.phone}` : ''}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: p.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.12)', color: p.status === 'active' ? '#16a34a' : 'var(--txd)' }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
