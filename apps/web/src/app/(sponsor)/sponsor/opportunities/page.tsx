import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorOpportunitiesPage() {
  return (
    <SponsorPlaceholder
      title="Opportunity Discovery"
      question="What opportunities am I not yet seeing?"
      rhythm="Attentive · progressive"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Originated matches</h2>
          <p style={regionBodyStyle}>
            Opportunities arise from evidence events toward a stated need — never from opaque
            similarity alone. Each carries action, reason, expected impact, and linked Passport.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Sponsor curation</h2>
          <p style={regionBodyStyle}>
            Kadarn originates; the sponsor curates. Review, dismiss with recorded rationale, or
            route into Feasibility and Portfolio workflows.
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
