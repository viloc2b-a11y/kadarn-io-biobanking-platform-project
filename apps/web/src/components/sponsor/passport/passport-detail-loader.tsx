'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ApiClientError, fetchInstitutionalPassport } from './passport-api'
import { PassportDetail } from './passport-detail'
import { pageSubtitleStyle, pageTitleStyle } from './passport-styles'

export function PassportDetailLoader({ institutionId }: { institutionId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [passport, setPassport] = useState<Awaited<ReturnType<typeof fetchInstitutionalPassport>> | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)
    setNotFound(false)
    setPassport(null)

    fetchInstitutionalPassport(institutionId)
      .then((data) => {
        if (!cancelled) setPassport(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true)
          return
        }
        const message = err instanceof Error ? err.message : 'Unable to load passport'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [institutionId])

  if (loading) {
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--txd)' }}>Loading institutional passport…</p>
        <div
          style={{
            marginTop: 16,
            height: 160,
            borderRadius: 12,
            background: 'var(--navy2)',
            border: '1px solid var(--border)',
          }}
          aria-hidden="true"
        />
      </div>
    )
  }

  if (notFound) {
    return (
      <div>
        <h1 style={pageTitleStyle}>Passport not found</h1>
        <p style={pageSubtitleStyle}>
          No institutional passport exists for this institution in your portfolio.
        </p>
        <Link href="/sponsor/passports" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
          ← Back to portfolio passports
        </Link>
      </div>
    )
  }

  if (error || !passport) {
    return (
      <div>
        <h1 style={pageTitleStyle}>Unable to load passport</h1>
        <p style={pageSubtitleStyle}>
          {error ?? 'The passport could not be loaded. Check your connection and try again.'}
        </p>
        <Link href="/sponsor/passports" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
          ← Back to portfolio passports
        </Link>
      </div>
    )
  }

  return <PassportDetail passport={passport} />
}
