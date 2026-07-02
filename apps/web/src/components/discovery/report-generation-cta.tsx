import { DISCOVERY_COPY } from './discovery-copy'
import { cardStyle } from './panel-primitives'

/**
 * Visible but disabled call-to-action. No report generation endpoint exists
 * yet — this button must never imply completed functionality.
 */
export function ReportGenerationCta() {
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        style={{
          alignSelf: 'start',
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,.35)',
          background: 'rgba(15,23,42,.35)',
          color: 'var(--txdd)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'not-allowed',
        }}
      >
        {DISCOVERY_COPY.reportCtaLabel}
      </button>
      <p style={{ fontSize: 11, color: 'var(--txdd)', margin: 0 }}>{DISCOVERY_COPY.reportCtaHelper}</p>
    </div>
  )
}
