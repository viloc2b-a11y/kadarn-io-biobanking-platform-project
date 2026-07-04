'use client'

import { useSponsorPassportContextOptional } from './passport-context'
import { confidenceStyle } from './passport-styles'

export function PassportReasoningPanel() {
  const ctx = useSponsorPassportContextOptional()
  const claim = ctx?.selectedClaim

  if (!claim) {
    return (
      <>
        <div style={panelHeaderStyle}>Reasoning context</div>
        <p style={panelBodyStyle}>
          Select a claim in the Passport to inspect provenance, confidence rationale, and supporting evidence —
          without leaving this surface.
        </p>
        <p style={panelHintStyle}>
          Institution remains the persistent object; the Passport is its living representation at this moment.
        </p>
      </>
    )
  }

  return (
    <>
      <div style={panelHeaderStyle}>Explain · selected claim</div>
      <p style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.5, marginBottom: 12, fontWeight: 600 }}>
        {claim.statement}
      </p>

      <div style={fieldBlockStyle}>
        <span style={fieldLabelStyle}>Confidence</span>
        <span style={confidenceStyle(claim.confidence)}>{claim.confidence}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--txd)', lineHeight: 1.45, marginBottom: 14 }}>
        {claim.confidenceExplanation}
      </p>

      {claim.contested && (
        <p style={{ fontSize: 12, color: '#ffb450', marginBottom: 14, lineHeight: 1.45 }}>
          Counter-evidence on file — review contradicting documents before relying on this claim.
        </p>
      )}

      <div style={provenanceBlockStyle}>
        <div style={fieldLabelStyle}>Provenance</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txd)', marginBottom: 4 }}>
          {claim.provenance.documentTitle}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txdd)', marginBottom: 8 }}>
          {claim.provenance.documentDate}
          <span aria-hidden="true"> · </span>
          {claim.provenance.evidenceClass}
        </div>
        <blockquote style={excerptStyle}>
          {claim.provenance.excerpt}
        </blockquote>
      </div>

      <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 12 }}>
        Taxonomy: {claim.taxonomyId}
        <span aria-hidden="true"> · </span>
        As of {claim.asOf}
      </div>
    </>
  )
}

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--txd)',
  marginBottom: 12,
}

const panelBodyStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txd)',
  lineHeight: 1.55,
  marginBottom: 12,
}

const panelHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txdd)',
  lineHeight: 1.45,
  fontStyle: 'italic',
}

const fieldBlockStyle: React.CSSProperties = {
  marginBottom: 8,
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: 'var(--txdd)',
  fontWeight: 700,
  marginBottom: 4,
}

const provenanceBlockStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: 12,
  marginTop: 4,
}

const excerptStyle: React.CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderLeft: '2px solid var(--teal)',
  background: 'var(--navy3)',
  borderRadius: '0 8px 8px 0',
  fontSize: 12,
  color: 'var(--txd)',
  lineHeight: 1.45,
  fontStyle: 'italic',
}
