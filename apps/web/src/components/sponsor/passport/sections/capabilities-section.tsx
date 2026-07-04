import type { PassportCapability } from '../passport-types'
import { badgeStyle, cardStyle, cardTitleStyle, confidenceStyle } from '../passport-styles'

export function CapabilitiesSection({ capabilities }: { capabilities: PassportCapability[] }) {
  return (
    <section id="passport-capabilities" style={cardStyle} aria-labelledby="passport-capabilities-heading">
      <h2 id="passport-capabilities-heading" style={cardTitleStyle}>Capabilities</h2>
      <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16, lineHeight: 1.45 }}>
        What this institution can do — candidate statements derived from supporting claims.
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {capabilities.map((cap) => (
          <li
            key={cap.id}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{cap.label}</span>
              <span style={badgeStyle(cap.temporalState === 'fresh' ? 'fresh' : 'attention')}>
                {cap.temporalState}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.45, margin: '0 0 8px' }}>
              {cap.candidateStatement}
            </p>
            <div style={{ fontSize: 11, color: 'var(--txdd)' }}>
              Taxonomy: {cap.taxonomyId}
              <span aria-hidden="true"> · </span>
              Confidence: <span style={confidenceStyle(cap.confidence)}>{cap.confidence}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
