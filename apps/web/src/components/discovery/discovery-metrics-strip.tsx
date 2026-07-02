import type { DiscoveryMetrics } from './types'
import { cardStyle, HelpTooltip } from './panel-primitives'

export const EMPTY_DISCOVERY_METRICS: DiscoveryMetrics = {
  artifactsProcessed: 0,
  documentsClassified: 0,
  entitiesDetected: 0,
  relationshipsDetected: 0,
  capabilitiesDetected: 0,
  claimCandidatesDetected: 0,
  evidenceGapsDetected: 0,
  unknownDocuments: 0,
  lowConfidenceItems: 0,
  curationEvents: 0,
  validationNotes: 0,
  nextBestActionPresent: false,
  ttfvMinutes: null,
  institutionReconstructionCoverage: null,
  evidenceLeverageScore: null,
}

import { DISCOVERY_COPY } from './discovery-copy'

const HELP_TEXT = DISCOVERY_COPY.metricsHelp

export function DiscoveryMetricsStrip({
  metrics,
  loading,
  refreshing = false,
}: {
  metrics: DiscoveryMetrics
  loading: boolean
  refreshing?: boolean
}) {
  return (
    <section style={{ ...cardStyle, padding: 14 }} aria-busy={refreshing} aria-label="Reconstruction summary metrics">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {DISCOVERY_COPY.metricsTitle}
            {refreshing ? (
              <span className="discovery-refresh-badge" style={{ marginLeft: 8 }}>Updating</span>
            ) : null}
          </div>
          <p style={{ fontSize: 11, color: 'var(--txdd)', margin: '4px 0 0', maxWidth: 640, lineHeight: 1.5 }}>
            {HELP_TEXT}
          </p>
        </div>
        <HelpTooltip label="Reconstruction summary" text={HELP_TEXT} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 10,
        }}
      >
        <MetricCell label="Artifacts" value={metrics.artifactsProcessed} loading={loading} />
        <MetricCell label="Classified" value={metrics.documentsClassified} loading={loading} />
        <MetricCell label="Entities" value={metrics.entitiesDetected} loading={loading} />
        <MetricCell label="Relationships" value={metrics.relationshipsDetected} loading={loading} />
        <MetricCell label="Possible capabilities" value={metrics.capabilitiesDetected} loading={loading} />
        <MetricCell label="Claim candidates" value={metrics.claimCandidatesDetected} loading={loading} />
        <MetricCell label="Evidence gaps" value={metrics.evidenceGapsDetected} loading={loading} />
        <MetricCell
          label="Unknown docs"
          value={metrics.unknownDocuments}
          loading={loading}
          warn={metrics.unknownDocuments > 0}
          title="Documents the classifier could not assign a type"
        />
        <MetricCell
          label="Needs review"
          value={metrics.lowConfidenceItems}
          loading={loading}
          warn={metrics.lowConfidenceItems > 0}
          title="Extractions flagged below discovery confidence threshold or needing human review"
        />
        <MetricCell label="Curation" value={metrics.curationEvents} loading={loading} />
        <MetricCell label="Validation notes" value={metrics.validationNotes} loading={loading} />
        <MetricCell
          label="Next action"
          value={metrics.nextBestActionPresent ? 'Yes' : 'No'}
          loading={loading}
          warn={!metrics.nextBestActionPresent && metrics.artifactsProcessed > 0}
          title="Whether the snapshot includes a recommended next review action"
        />
      </div>

      {(metrics.ttfvMinutes != null || metrics.institutionReconstructionCoverage != null || metrics.evidenceLeverageScore != null) ? (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(148,163,184,.18)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
          }}
        >
          {metrics.ttfvMinutes != null ? (
            <MetricCell label="TTFV" value={`${metrics.ttfvMinutes}m`} loading={loading} title="Time from session open to run completion" />
          ) : null}
          {metrics.institutionReconstructionCoverage != null ? (
            <MetricCell
              label="Reconstruction"
              value={`${metrics.institutionReconstructionCoverage}%`}
              loading={loading}
              title="Institution reconstruction coverage from snapshot or profile"
            />
          ) : null}
          {metrics.evidenceLeverageScore != null ? (
            <MetricCell
              label="Leverage score"
              value={metrics.evidenceLeverageScore}
              loading={loading}
              title="Discovery leverage opportunities from gaps and next actions — not a sponsor score"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function MetricCell({
  label,
  value,
  loading,
  warn = false,
  title,
}: {
  label: string
  value: string | number
  loading: boolean
  warn?: boolean
  title?: string
}) {
  const display = loading ? '—' : value
  const color = warn ? 'var(--amber)' : 'var(--tx)'

  return (
    <div
      title={title}
      style={{
        borderRadius: 10,
        border: warn ? '1px solid rgba(245,166,35,.35)' : '1px solid rgba(148,163,184,.2)',
        background: warn ? 'rgba(245,166,35,.08)' : 'rgba(15,23,42,.35)',
        padding: '8px 10px',
        minHeight: 52,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{display}</div>
    </div>
  )
}
