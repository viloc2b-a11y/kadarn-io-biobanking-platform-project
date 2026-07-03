import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorPassportsPage() {
  return (
    <SponsorPlaceholder
      title="Institutional Passports"
      question="Who is this institution?"
      rhythm="Deep · explanatory"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Living institutional representation</h2>
          <p style={regionBodyStyle}>
            The Passport is constructed from evidence — not declared in fields. Every statement
            uses candidate language and descends to Claims and source evidence.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Temporal reading</h2>
          <p style={regionBodyStyle}>
            Passports are readable as of any moment — evolution is visible; past states are not
            silently overwritten.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Judgment work</h2>
          <p style={regionBodyStyle}>
            Accept, challenge, and enrich Claims in place — human judgments recorded with their
            evidentiary context.
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
