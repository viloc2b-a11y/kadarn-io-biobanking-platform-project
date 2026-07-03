import { SponsorPlaceholder } from '@/components/sponsor/sponsor-placeholder'

export default function SponsorNotificationsPage() {
  return (
    <SponsorPlaceholder
      title="Notifications"
      question="What changed that concerns me?"
      rhythm="Ambient"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Evidence-carrying change</h2>
          <p style={regionBodyStyle}>
            One stream, one entry point — grouped by institution and change type. Every notification
            states what changed, shows the evidence that moved, and links to the affected object.
          </p>
        </section>
        <section style={regionStyle}>
          <h2 style={regionTitleStyle}>Quiet is a designed state</h2>
          <p style={regionBodyStyle}>
            When nothing meaningful changed, the surface says so honestly — stillness is not an
            empty inbox.
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
