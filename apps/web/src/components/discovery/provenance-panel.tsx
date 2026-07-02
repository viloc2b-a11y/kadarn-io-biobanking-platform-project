'use client'

import { useEffect, useState } from 'react'
import { fetchDiscoveryProvenance } from './discovery-api'
import type { ProvenanceData, ProvenanceSelection } from './types'
import {
  Badge,
  EmptyPanel,
  ErrorPanel,
  PanelHeader,
  PanelSkeleton,
  cardStyle,
} from './panel-primitives'

export function DiscoveryProvenancePanel({
  sessionId,
  selection,
  loading: dashboardLoading,
}: {
  sessionId: string | null
  selection: ProvenanceSelection | null
  loading: boolean
}) {
  // Result slot keyed by request — loading is derived, setState happens only
  // inside async callbacks (avoids synchronous setState within effects).
  const [slot, setSlot] = useState<{ key: string; data: ProvenanceData | null; error: string | null } | null>(null)
  const [nonce, setNonce] = useState(0)

  const requestKey =
    sessionId && selection ? `${sessionId}:${selection.targetType}:${selection.targetId}:${nonce}` : null
  const current = slot && slot.key === requestKey ? slot : null
  const data = current?.data ?? null
  const error = current?.error ?? null
  const loading = Boolean(requestKey) && current === null

  useEffect(() => {
    if (!sessionId || !selection) return
    const key = `${sessionId}:${selection.targetType}:${selection.targetId}:${nonce}`
    let active = true
    fetchDiscoveryProvenance({
      sessionId,
      targetType: selection.targetType,
      targetId: selection.targetId,
    })
      .then((result) => {
        if (active) setSlot({ key, data: result, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setSlot({ key, data: null, error: err instanceof Error ? err.message : 'Failed to load provenance chain' })
        }
      })
    return () => {
      active = false
    }
  }, [sessionId, selection, nonce])

  const retry = () => setNonce((n) => n + 1)

  if (dashboardLoading && !selection) return <PanelSkeleton />
  if (!sessionId) return <EmptyPanel message="Open a discovery session to inspect provenance." />
  if (!selection) {
    return (
      <EmptyPanel
        message="No item selected for provenance inspection."
        hint="Use View provenance on an entity, relationship, capability, or claim candidate."
      />
    )
  }

  if (loading && !data) return <PanelSkeleton rows={4} />
  if (error) return <ErrorPanel message={error} onRetry={retry} />
  if (!data) return <EmptyPanel message="Provenance chain not available for this item." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Source Trace"
        description="Read-only trace from a review item back through agent output, Layer 1 extraction, and Layer 0 source artifact."
      />

      <ProvenanceBreadcrumb chain={data.chain} />

      <section style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
          Selected item
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{data.itemSummary.label}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge label={data.targetType.replace(/_/g, ' ')} />
          <Badge label={data.itemSummary.type} />
        </div>
        {data.sourceSpan ? (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--txd)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--txdd)' }}>Source span: </span>
            {data.sourceSpan}
          </div>
        ) : null}
      </section>

      {data.agentOutput ? (
        <section style={cardStyle}>
          <h3 style={sectionHeading}>Agent output</h3>
          <dl className="discovery-provenance-dl">
            <dt>Agent</dt>
            <dd>{data.agentOutput.agent_name} v{data.agentOutput.agent_version}</dd>
            <dt>Pipeline</dt>
            <dd>{data.pipelineVersion ?? data.agentOutput.pipeline_version}</dd>
            <dt>Status</dt>
            <dd>{data.agentOutput.status}</dd>
            <dt>Recorded</dt>
            <dd>{new Date(data.agentOutput.created_at).toLocaleString()}</dd>
          </dl>
        </section>
      ) : null}

      {data.layer1 ? (
        <section style={cardStyle}>
          <h3 style={sectionHeading}>Layer 1 — extracted markdown</h3>
          <dl className="discovery-provenance-dl">
            <dt>Extractor</dt>
            <dd>{data.layer1.extractor} v{data.layer1.extractor_version}</dd>
            <dt>Status</dt>
            <dd>{data.layer1.status}</dd>
            <dt>Original hash</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{data.layer1.original_hash}</dd>
            <dt>Extracted</dt>
            <dd>{new Date(data.layer1.extracted_at).toLocaleString()}</dd>
          </dl>
          {data.layer1.markdown_preview ? (
            <pre style={previewStyle}>{data.layer1.markdown_preview}{data.layer1.markdown_preview.length >= 500 ? '…' : ''}</pre>
          ) : null}
        </section>
      ) : null}

      {data.layer0 ? (
        <section style={cardStyle}>
          <h3 style={sectionHeading}>Layer 0 — source artifact</h3>
          <dl className="discovery-provenance-dl">
            <dt>File</dt>
            <dd>{data.layer0.file_name}</dd>
            <dt>Type</dt>
            <dd>{data.layer0.artifact_type}</dd>
            <dt>Source</dt>
            <dd>{data.layer0.source}</dd>
            <dt>Storage ref</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{data.layer0.storage_ref}</dd>
            <dt>SHA-256</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{data.layer0.file_hash}</dd>
            <dt>Size</dt>
            <dd>{formatBytes(data.layer0.size_bytes)}</dd>
          </dl>
        </section>
      ) : (
        !data.layer1 && !data.agentOutput ? (
          <EmptyPanel message="Layer 0 and Layer 1 references are not yet linked for this item." />
        ) : null
      )}

      <RelatedSection title="Related entities" items={data.relatedEntities} />
      <RelatedSection title="Related relationships" items={data.relatedRelationships} />
      <RelatedSection title="Related capabilities" items={data.relatedCapabilities} />
      <RelatedSection title="Related claim candidates" items={data.relatedClaims} />

      <section style={cardStyle}>
        <h3 style={sectionHeading}>Curation history</h3>
        {data.curationHistory.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--txdd)' }}>No curation events recorded for this item.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.curationHistory.map((event) => (
              <div key={event.id} style={{ fontSize: 12, color: 'var(--txd)' }}>
                <Badge label={event.action} tone="green" />{' '}
                {event.reason ?? '—'} · {new Date(event.created_at).toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProvenanceBreadcrumb({ chain }: { chain: ProvenanceData['chain'] }) {
  if (chain.length === 0) {
    return (
      <div style={{ ...cardStyle, fontSize: 12, color: 'var(--txdd)' }}>
        Provenance chain incomplete — pipeline outputs may not be persisted yet.
      </div>
    )
  }

  return (
    <nav
      aria-label="Provenance chain"
      style={{
        ...cardStyle,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {chain.map((step, index) => (
        <span key={`${step.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {index > 0 ? <span style={{ color: 'var(--txdd)', fontSize: 12 }}>→</span> : null}
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,.25)',
              background: 'rgba(15,23,42,.55)',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--tx)' }}>{step.label}</div>
            <div style={{ color: 'var(--txdd)', marginTop: 2 }}>{step.detail}</div>
          </span>
        </span>
      ))}
    </nav>
  )
}

function RelatedSection({
  title,
  items,
}: {
  title: string
  items: ProvenanceData['relatedEntities']
}) {
  if (items.length === 0) return null
  return (
    <section style={cardStyle}>
      <h3 style={sectionHeading}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <Badge key={`${item.type}-${item.id}`} label={`${item.label} (${item.id.slice(0, 8)})`} />
        ))}
      </div>
    </section>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const sectionHeading: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 10,
}

const previewStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,.2)',
  background: 'rgba(2,6,23,.65)',
  fontSize: 11,
  fontFamily: 'ui-monospace, monospace',
  whiteSpace: 'pre-wrap',
  maxHeight: 200,
  overflow: 'auto',
  color: 'var(--tx)',
}
