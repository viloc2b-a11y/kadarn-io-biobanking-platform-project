import type { ReactNode } from 'react'

interface SponsorPlaceholderProps {
  title: string
  question: string
  rhythm?: string
  children?: ReactNode
}

export function SponsorPlaceholder({ title, question, rhythm, children }: SponsorPlaceholderProps) {
  return (
    <article>
      <header style={{ marginBottom: 24 }}>
        <p style={eyebrowStyle}>Sponsor Workspace · Scaffold</p>
        <h1 style={titleStyle}>{title}</h1>
        <p style={questionStyle}>{question}</p>
        {rhythm && (
          <p style={metaStyle}>
            Rhythm: <span style={{ color: 'var(--txd)' }}>{rhythm}</span>
          </p>
        )}
      </header>
      {children ?? (
        <div style={cardStyle}>
          <p style={bodyStyle}>
            This surface will be specified in the KUX workspace documents. Content flows here;
            the environment persists around it (KUX-004).
          </p>
        </div>
      )}
    </article>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: 'var(--txdd)',
  fontWeight: 700,
  marginBottom: 8,
}

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: -0.5,
  marginBottom: 8,
  color: 'var(--tx)',
}

const questionStyle: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--txd)',
  lineHeight: 1.5,
  fontStyle: 'italic',
  marginBottom: 4,
}

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txdd)',
  marginTop: 8,
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  padding: '24px 28px',
}

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--txd)',
  lineHeight: 1.6,
  margin: 0,
}
