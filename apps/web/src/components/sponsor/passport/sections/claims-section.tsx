'use client'

import type { PassportClaim } from '../passport-types'
import { useSponsorPassportContext } from '../passport-context'
import { cardStyle, cardTitleStyle, claimRowStyle, confidenceStyle } from '../passport-styles'

export function ClaimsSection({ claims }: { claims: PassportClaim[] }) {
  const { selectedClaim, selectClaim } = useSponsorPassportContext()

  return (
    <section id="passport-claims" style={cardStyle} aria-labelledby="passport-claims-heading">
      <h2 id="passport-claims-heading" style={cardTitleStyle}>Claims</h2>
      <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16, lineHeight: 1.45 }}>
        Evidence-backed statements Kadarn currently holds. Select a claim to inspect provenance in the reasoning context panel.
      </p>

      {claims.map((claim) => {
        const selected = selectedClaim?.id === claim.id
        return (
          <button
            key={claim.id}
            type="button"
            onClick={() => selectClaim(selected ? null : claim)}
            style={{
              ...claimRowStyle(selected),
              width: '100%',
              textAlign: 'left',
              font: 'inherit',
            }}
            aria-pressed={selected}
          >
            <div style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.45, marginBottom: 8 }}>
              {claim.statement}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--txdd)' }}>
              <span style={confidenceStyle(claim.confidence)}>{claim.confidence} confidence</span>
              <span aria-hidden="true">·</span>
              <span>{claim.taxonomyId}</span>
              {claim.contested && (
                <>
                  <span aria-hidden="true">·</span>
                  <span style={{ color: '#ffb450' }}>Counter-evidence on file</span>
                </>
              )}
            </div>
          </button>
        )
      })}
    </section>
  )
}
