import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorRiskPage() {
  return (
    <SponsorPlaceholder
      title="Risk Monitoring"
      question="What requires attention?"
      rhythm="Reactive · when warranted"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Evidence-driven risks</h2>
          <p style={regionBodyStyle}>
            Each risk carries the evidence that generated it — decay, contradictions, operational
            signals — with response affordances for mitigate, accept, or escalate.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Decision basis watch</h2>
          <p style={regionBodyStyle}>
            When evidence supporting a past decision weakens, the environment surfaces it honestly:
            the basis of the decision has moved since commitment.
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
