'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchPassportPortfolioIndex } from './passport-api'
import type { PassportInstitutionSummary } from './passport-types'
import {
  badgeStyle,
  linkCardStyle,
  metaRowStyle,
  pageSubtitleStyle,
  pageTitleStyle,
} from './passport-styles'

export function PassportList() {
  const [institutions, setInstitutions] = useState<PassportInstitutionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchPassportPortfolioIndex()
      .then((items) => {
        if (!cancelled) setInstitutions(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unable to load portfolio passports'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 style={pageTitleStyle}>Institutional Passports</h1>
      <p style={pageSubtitleStyle}>
        Portfolio institutions with a living Passport — Kadarn&apos;s current understanding
        of who they are, what they can do, and what the evidence suggests.
      </p>

      {loading && (
        <p style={{ fontSize: 13, color: 'var(--txd)' }}>Loading portfolio passports…</p>
      )}

      {error && !loading && (
        <p style={{ fontSize: 13, color: '#ffb450', lineHeight: 1.5 }} role="alert">
          {error}
        </p>
      )}

      {!loading && !error && institutions.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--txd)' }}>
          No institutions in your portfolio yet.
        </p>
      )}

      {!loading && !error && institutions.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {institutions.map((inst) => (
            <li key={inst.institutionId}>
              <Link
                href={`/sponsor/passports/${inst.institutionId}`}
                style={linkCardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 4 }}>
                      {inst.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 8 }}>{inst.location}</div>
                    <p style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.45, margin: 0 }}>
                      {inst.summary}
                    </p>
                  </div>
                  <span style={badgeStyle(inst.stability === 'Evidence Refresh Needed' ? 'attention' : 'neutral')}>
                    {inst.stability}
                  </span>
                </div>
                <div style={{ ...metaRowStyle, marginTop: 12, marginBottom: 0 }}>
                  <span>Portfolio member since {inst.memberSince}</span>
                  <span aria-hidden="true">·</span>
                  <span>Passport {inst.passportId}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
