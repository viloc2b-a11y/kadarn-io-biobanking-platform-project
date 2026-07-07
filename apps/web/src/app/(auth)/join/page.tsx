import Link from 'next/link'
import { JOIN_ACTORS } from '@/lib/join/actor-types'

const actorCards = Object.values(JOIN_ACTORS)

export default function JoinPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>
          <KadarnDots />
          <span style={{ fontWeight: 900, fontSize: 20 }}>Kadarn</span>
        </div>

        <p style={eyebrowStyle}>Organization-first onboarding</p>
        <h1 style={titleStyle}>Register your organization</h1>
        <p style={bodyStyle}>
          Choose the type of organization you want to create. Kadarn provisions
          organizations first, then gives users access through memberships and
          roles.
        </p>
        <p style={noticeStyle}>
          Choose your organization type to begin. Your full workspace will be provisioned after you complete onboarding.
        </p>

        <div style={gridStyle}>
          {actorCards.map(actor => (
            <Link key={actor.href} href={actor.href} style={actorCardStyle}>
              <span style={actorNameStyle}>{actor.name}</span>
              <span style={actorDescriptionStyle}>{actor.description}</span>
              <span style={actorMetaStyle}>
                <strong>For:</strong> {actor.audience}
              </span>
              <span style={actorOutcomeStyle}>
                <strong>Outcome:</strong> {actor.outcome}
              </span>
            </Link>
          ))}
        </div>

        <div style={actionsStyle}>
          <Link href="/login" style={primaryLinkStyle}>Back to sign in</Link>
          <Link href="/marketplace" style={secondaryLinkStyle}>Browse marketplace</Link>
        </div>
      </section>
    </main>
  )
}

function KadarnDots() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
      <circle cx="28" cy="60" r="8" fill="#4467F2" />
      <circle cx="62" cy="20" r="8" fill="#4467F2" />
      <circle cx="72" cy="50" r="7" fill="#7B44FF" />
      <circle cx="62" cy="78" r="7" fill="#8B44FF" />
    </svg>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--navy)',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 920,
  padding: 40,
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: 'var(--navy2)',
}

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 28,
}

const eyebrowStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  color: 'var(--teal)',
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 24,
  fontWeight: 900,
  color: 'var(--tx)',
}

const bodyStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--txd)',
}

const noticeStyle: React.CSSProperties = {
  margin: 0,
  padding: 14,
  borderRadius: 12,
  border: '1px solid rgba(12,197,193,0.22)',
  background: 'rgba(12,197,193,0.08)',
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--txd)',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 14,
  marginTop: 24,
}

const actorCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minHeight: 218,
  padding: 18,
  borderRadius: 14,
  border: '1px solid rgba(68,103,242,0.2)',
  background: 'rgba(68,103,242,0.06)',
  color: 'var(--tx)',
  textDecoration: 'none',
}

const actorNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: 'var(--tx)',
}

const actorDescriptionStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--txd)',
}

const actorMetaStyle: React.CSSProperties = {
  marginTop: 'auto',
  fontSize: 12,
  lineHeight: 1.45,
  color: 'var(--txdd)',
}

const actorOutcomeStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: 'var(--teal)',
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 24,
}

const primaryLinkStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  background: 'var(--teal)',
  color: 'var(--navy)',
  fontSize: 13,
  fontWeight: 800,
  textDecoration: 'none',
}

const secondaryLinkStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  color: 'var(--txd)',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
}
