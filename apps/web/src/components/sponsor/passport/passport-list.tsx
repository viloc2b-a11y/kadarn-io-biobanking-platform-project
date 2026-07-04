'use client'

import Link from 'next/link'
import { getPortfolioInstitutions } from './passport-mock-data'
import {
  badgeStyle,
  linkCardStyle,
  metaRowStyle,
  pageSubtitleStyle,
  pageTitleStyle,
} from './passport-styles'

export function PassportList() {
  const institutions = getPortfolioInstitutions()

  return (
    <div>
      <h1 style={pageTitleStyle}>Institutional Passports</h1>
      <p style={pageSubtitleStyle}>
        Portfolio institutions with a living Passport — Kadarn&apos;s current understanding
        of who they are, what they can do, and what the evidence suggests.
      </p>

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
    </div>
  )
}
