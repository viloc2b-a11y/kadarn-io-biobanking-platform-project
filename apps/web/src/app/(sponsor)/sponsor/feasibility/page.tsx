import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorFeasibilityPage() {
  return (
    <SponsorPlaceholder
      title="Feasibility Search"
      question="Who satisfies this need?"
      rhythm="Fast · exploratory"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Study requirements profile</h2>
          <p style={regionBodyStyle}>
            Explicit, inspectable requirements bound to the Claim Taxonomy — capability, geography,
            population, and confidence thresholds set by the sponsor.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Explainable matching</h2>
          <p style={regionBodyStyle}>
            Natural-language need decomposes visibly into requirement candidates. Results show
            per-requirement support with evidence — not self-reported questionnaire answers.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Shortlist and selection</h2>
          <p style={regionBodyStyle}>
            Focus narrows candidates; Compare holds finalists side by side on evidence; Decide
            records site selection with Decision Provenance.
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
