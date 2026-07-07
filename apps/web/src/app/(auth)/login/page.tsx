'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { defaultRedirect, resolveRole } from '@kadarn/auth'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setError(error?.message ?? 'Authentication failed')
      setLoading(false)
      return
    }

    const role = resolveRole(data.user.user_metadata)
    const hasMembership = Boolean(data.user.user_metadata?.active_org_id)
    const destination = next ?? defaultRedirect(role, hasMembership)

    router.push(destination)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy)',
    }}>
      <div style={{
        width: 380,
        padding: 40,
        borderRadius: 16,
        border: '1px solid var(--border)',
        background: 'var(--navy2)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
            <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
            <circle cx="28" cy="60" r="8" fill="#4467F2" />
            <circle cx="62" cy="20" r="8" fill="#4467F2" />
            <circle cx="72" cy="50" r="7" fill="#7B44FF" />
            <circle cx="62" cy="78" r="7" fill="#8B44FF" />
            <circle cx="45" cy="50" r="5" fill="url(#lgl)" />
            <defs>
              <linearGradient id="lgl" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0CC5C1" />
                <stop offset="100%" stopColor="#8B44FF" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontWeight: 900, fontSize: 20 }}>Kadarn</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginBottom: 28 }}>
          Access your workspace or marketplace.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </Field>

          {error && (
            <div style={{
              fontSize: 12,
              color: 'var(--red)',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,77,106,0.08)',
              border: '1px solid rgba(255,77,106,0.15)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: loading ? 'rgba(12,197,193,0.3)' : 'var(--teal)',
              color: 'var(--navy)',
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--txd)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <Link href="/join" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 800 }}>
            Register your organization
          </Link>
          <a href="/marketplace" style={{ fontSize: 12, color: 'var(--txdd)' }}>
            Browse marketplace without signing in →
          </a>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--txd)', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--navy3)',
  color: 'var(--tx)',
  fontSize: 14,
  outline: 'none',
}
