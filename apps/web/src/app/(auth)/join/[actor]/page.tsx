import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizationRegistrationForm } from '@/components/auth/organization-registration-form'
import { getJoinActorSlugs, isJoinActorSlug, JOIN_ACTORS } from '@/lib/join/actor-types'

export function generateStaticParams() {
  return getJoinActorSlugs().map(actor => ({ actor }))
}

export default async function JoinActorPage({ params }: { params: Promise<{ actor: string }> }) {
  const { actor } = await params
  if (!isJoinActorSlug(actor)) notFound()

  const detail = JOIN_ACTORS[actor]

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>
          <KadarnDots />
          <span style={{ fontWeight: 900, fontSize: 20 }}>Kadarn</span>
        </div>

        <OrganizationRegistrationForm
          actorSlug={actor}
          actorName={detail.name}
          actorDescription={detail.formDescription}
        />

        <div style={actionsStyle}>
          <Link href="/join" style={primaryLinkStyle}>Choose another type</Link>
          <Link href="/login" style={secondaryLinkStyle}>Back to sign in</Link>
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
  maxWidth: 760,
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
