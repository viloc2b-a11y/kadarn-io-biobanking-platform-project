'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSponsorPassportContext } from './passport-context'
import type { InstitutionalPassport, PassportSectionId } from './passport-types'
import { PassportSectionNav } from './passport-section-nav'
import { badgeStyle, disabledButtonStyle, pageSubtitleStyle, pageTitleStyle } from './passport-styles'
import { IdentitySection } from './sections/identity-section'
import { CapabilitiesSection } from './sections/capabilities-section'
import { ClaimsSection } from './sections/claims-section'
import { RecommendationsSection } from './sections/recommendations-section'
import { HistorySection } from './sections/history-section'

export function PassportDetail({ passport }: { passport: InstitutionalPassport }) {
  const { setActivePassport } = useSponsorPassportContext()
  const [activeSection, setActiveSection] = useState<PassportSectionId>('identity')

  useEffect(() => {
    setActivePassport(passport)
    return () => setActivePassport(null)
  }, [passport, setActivePassport])

  useEffect(() => {
    const sectionIds: PassportSectionId[] = [
      'identity',
      'capabilities',
      'claims',
      'recommendations',
      'history',
    ]
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const el = document.getElementById(`passport-${id}`)
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection(id)
          })
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/sponsor/passports"
          style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}
        >
          ← Portfolio Passports
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={pageTitleStyle}>{passport.displayName}</h1>
            <p style={{ ...pageSubtitleStyle, marginBottom: 8 }}>
              Institutional Passport — Kadarn&apos;s living representation of this institution at this moment.
            </p>
            <div style={{ fontSize: 11, color: 'var(--txdd)' }}>
              Passport {passport.passportId}
              <span aria-hidden="true"> · </span>
              Institution {passport.institutionId}
            </div>
          </div>
          <span style={badgeStyle(passport.stability === 'Evidence Refresh Needed' ? 'attention' : 'fresh')}>
            {passport.stability}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {['Accept', 'Challenge', 'Request evidence', 'Re-discover', 'Add to comparison'].map((action) => (
          <button key={action} type="button" style={disabledButtonStyle} disabled title="Available in a future release">
            {action}
          </button>
        ))}
      </div>

      <PassportSectionNav activeSection={activeSection} />

      <IdentitySection identity={passport.identity} />
      <CapabilitiesSection capabilities={passport.capabilities} />
      <ClaimsSection claims={passport.claims} />
      <RecommendationsSection recommendations={passport.recommendations} />
      <HistorySection history={passport.history} />
    </div>
  )
}
