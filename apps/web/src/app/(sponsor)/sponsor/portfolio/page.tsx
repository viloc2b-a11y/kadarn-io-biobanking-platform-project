import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorPortfolioPage() {
  return (
    <SponsorPlaceholder
      title="Portfolio Intelligence"
      question="What is happening across my institution portfolio, and where should I focus next?"
      rhythm="Slow · analytical"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Population view</h2>
          <p style={regionBodyStyle}>
            Continuously evidenced view of institutions you observe together — coverage, freshness,
            and attention conditions, each explainable down to member Passports.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Attention queue</h2>
          <p style={regionBodyStyle}>
            Conditions requiring attention — evidence decay, contradictions, open gaps — prioritized
            by decision impact, not by ordering institutions above one another.
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
