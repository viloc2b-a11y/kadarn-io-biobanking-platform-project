import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorDashboardPage() {
  return (
    <SponsorPlaceholder
      title="Dashboard"
      question="Where do I stand right now, and what should I do next?"
      rhythm="Calm re-entry"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Situational state</h2>
          <p style={regionBodyStyle}>
            Nothing meaningful changed since your last visit — monitored institutions remain
            stable. Evidence health across your portfolio is inspectable; no aggregate institution
            scores are shown here.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Open reasoning</h2>
          <p style={regionBodyStyle}>
            Reasoning sessions resume where evidence-based inquiry paused — each bound to one
            institutional question with honest aging when evidence moves.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Change since last visit</h2>
          <p style={regionBodyStyle}>
            Evidence-carrying changes grouped by institution — every entry links to the affected
            Passport or Claim with its provenance.
          </p>
        </section>
      </div>
    </SponsorPlaceholder>
  )
}

const regionStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  padding: '20px 24px',
}

const regionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--tx)',
  marginBottom: 8,
}

const regionBodyStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txd)',
  lineHeight: 1.55,
  margin: 0,
}
