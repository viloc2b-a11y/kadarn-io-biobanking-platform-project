import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>
          <KadarnDots />
          <span style={{ fontWeight: 900, fontSize: 20 }}>Kadarn</span>
        </div>

        <p style={eyebrowStyle}>Account access</p>
        <h1 style={titleStyle}>Forgot password?</h1>
        <p style={bodyStyle}>
          Password recovery will use Supabase Auth reset flows once PCP-1.1g is
          implemented.
        </p>
        <p style={noticeStyle}>
          Password reset is not active yet. This page is a safe placeholder and
          does not send email, modify credentials, or change authentication
          settings.
        </p>

        <div style={actionsStyle}>
          <Link href="/login" style={primaryLinkStyle}>Back to sign in</Link>
          <Link href="/join" style={secondaryLinkStyle}>Register your organization</Link>
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
  maxWidth: 520,
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
