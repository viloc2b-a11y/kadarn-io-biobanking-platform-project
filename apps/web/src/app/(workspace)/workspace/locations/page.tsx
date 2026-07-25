'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Location {
  id: string; name: string; location_type: string; institution_id: string
  address_line1: string; city: string; state_province: string; postal_code: string; country: string
  status: string; created_at: string; updated_at: string
}

const LOCATION_TYPES = ['clinic', 'laboratory', 'warehouse', 'phase1_unit', 'office', 'pharmacy', 'storage', 'other']

export default function LocationsPage() {
  const { user } = useSession()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [form, setForm] = useState({ name: '', location_type: 'other', address_line1: '', city: '', state_province: '', postal_code: '', country: '' })

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchLocations = async (token: string, org: string) => {
    try {
      const res = await fetch(`${API}/api/v1/institutions/${org}/locations`, { headers: headers(token) })
      const json = await res.json()
      if (json.data) setLocations(json.data)
      else setError(json.error ?? 'Failed to load')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!user) return
    const token = (user as any).access_token
    // Fetch user's active org
    fetch(`${API}/api/v1/me`, { headers: headers(token) })
      .then(r => r.json())
      .then(j => {
        const id = j.data?.org_id ?? j.data?.organization_id ?? ''
        setOrgId(id)
        if (id) fetchLocations(token, id)
        else { setLoading(false); setError('No organization found') }
      })
      .catch(() => { setLoading(false); setError('Failed to load organization') })
  }, [user])

  const createLocation = async () => {
    if (!user || !form.name || !form.address_line1 || !orgId) return
    const token = (user as any).access_token
    try {
      const res = await fetch(`${API}/api/v1/institutions/${orgId}/locations`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.data) {
        setLocations(p => [...p, json.data])
        setShowForm(false)
        setForm({ name: '', location_type: 'other', address_line1: '', city: '', state_province: '', postal_code: '', country: '' })
      } else setError(json.error ?? 'Failed to create')
    } catch { setError('Network error') }
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>Sign in to manage Locations</div>

  return (
    <div>
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
            Foundation Directory
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Locations</h1>
          <p style={{ fontSize: 13, color: 'var(--txd)', maxWidth: 680 }}>
            Institutional facilities, laboratories, and offices.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : 'Add Location'}
        </button>
      </header>

      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{error}</div>}

      {showForm && (
        <div style={{ padding: 20, marginBottom: 24, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg2)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>New Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <select value={form.location_type} onChange={e => setForm(f => ({ ...f, location_type: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}>
              {LOCATION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <input placeholder="Address Line 1 *" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <input placeholder="State" value={form.state_province} onChange={e => setForm(f => ({ ...f, state_province: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <input placeholder="ZIP" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
            <input placeholder="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
          </div>
          <button onClick={createLocation}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Create Location
          </button>
        </div>
      )}

      {loading && <div style={{ color: 'var(--txd)', fontSize: 13 }}>Loading...</div>}

      {!loading && locations.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)', fontSize: 13 }}>
          No locations found. Add your first location to get started.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {locations.map(l => (
          <div key={l.id} style={{ padding: '14px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
              <div style={{ fontSize: 12, color: 'var(--txd)', marginTop: 2 }}>
                {l.address_line1}, {l.city}, {l.state_province} {l.postal_code} · {l.location_type.replace('_', ' ')}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: l.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.12)', color: l.status === 'active' ? '#16a34a' : 'var(--txd)' }}>
              {l.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
