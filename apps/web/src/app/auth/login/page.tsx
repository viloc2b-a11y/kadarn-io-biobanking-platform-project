'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/marketplace'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    getSupabaseClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next)
    })
  }, [next, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await getSupabaseClient().auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.replace(next)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy)',
    }}>
      <div style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <KadarnDots />
          <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--tx)' }}>Kadarn</span>
        </div>

        <div style={{
          padding: 28,
          borderRadius: 16,
          border: '1px solid var(--border)',
          background: 'var(--navy2)',
        }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--tx)' }}>Sign in</h1>
          <p style={{ fontSize: 12, color: 'var(--txdd)', margin: '0 0 24px' }}>
            Biospecimen network access
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txd)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@org.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--navy)',
                  color: 'var(--tx)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--txd)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--navy)',
                  color: 'var(--tx)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255,80,80,0.08)',
                border: '1px solid rgba(255,80,80,0.2)',
                fontSize: 12,
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                background: loading ? 'rgba(139,68,255,0.4)' : 'var(--purple)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--txdd)', marginTop: 20 }}>
          Kadarn Biospecimen Network · Access controlled
        </p>
      </div>
    </div>
  )
}

function KadarnDots() {
  return (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
      <circle cx="28" cy="60" r="8" fill="#4467F2" />
      <circle cx="62" cy="20" r="8" fill="#4467F2" />
      <circle cx="72" cy="50" r="7" fill="#7B44FF" />
      <circle cx="62" cy="78" r="7" fill="#8B44FF" />
      <circle cx="45" cy="50" r="5" fill="url(#lglogin)" />
      <defs>
        <linearGradient id="lglogin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0CC5C1" />
          <stop offset="100%" stopColor="#8B44FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
