'use client'

import { useEffect, useState } from 'react'
import { fetchDiscoveryPipelineStatus } from './discovery-api'
import type { DashboardTab, PipelineStageView, PipelineStatusData } from './types'
import { Badge, EmptyPanel, ErrorPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

const STATUS_TONE: Record<string, 'default' | 'amber' | 'green' | 'red'> = {
  pending: 'amber',
  running: 'amber',
  completed: 'green',
  failed: 'red',
  skipped: 'default',
  not_available: 'default',
};

export function DiscoveryPipelinePanel({
  sessionId,
  loading: dashboardLoading,
  onNavigateTab,
}: {
  sessionId: string | null
  loading: boolean
  onNavigateTab?: (tab: DashboardTab) => void
}) {
  // Result slot keyed by request — loading is derived, setState happens only
  // inside async callbacks (avoids synchronous setState within effects).
  const [slot, setSlot] = useState<{ key: string; data: PipelineStatusData | null; error: string | null } | null>(null)
  const [nonce, setNonce] = useState(0)

  const requestKey = sessionId ? `${sessionId}:${nonce}` : null
  const current = slot && slot.key === requestKey ? slot : null
  const data = current?.data ?? null
  const error = current?.error ?? null
  const loading = Boolean(requestKey) && current === null

  useEffect(() => {
    if (!sessionId) return
    const key = `${sessionId}:${nonce}`
    let active = true
    fetchDiscoveryPipelineStatus(sessionId)
      .then((result) => {
        if (active) setSlot({ key, data: result, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setSlot({ key, data: null, error: err instanceof Error ? err.message : 'Failed to load pipeline status' })
        }
      })
    return () => {
      active = false
    }
  }, [sessionId, nonce])

  const retry = () => setNonce((n) => n + 1)

  if (dashboardLoading && !sessionId) return <PanelSkeleton rows={5} />
  if (!sessionId) return <EmptyPanel message="Open a discovery session to view pipeline status." />
  if (loading && !data) return <PanelSkeleton rows={6} />
  if (error) return <ErrorPanel message={error} onRetry={retry} />
  if (!data) return <EmptyPanel message="Pipeline status is not available for this session." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Discovery Pipeline"
        description="Read-only view of processing stages for debugging and validation. Partial reconstruction is normal."
      />

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--txd)' }}>
        <span>Run: {data.runId ? data.runId.slice(0, 8) : '—'}</span>
        <span>Run status: {data.runStatus ?? '—'}</span>
        <span>Pipeline: {data.pipelineVersion ?? '—'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.stages.map((stage, index) => (
          <PipelineStageRow
            key={stage.id}
            stage={stage}
            showConnector={index < data.stages.length - 1}
            onNavigateTab={onNavigateTab}
          />
        ))}
      </div>
    </div>
  )
}

function PipelineStageRow({
  stage,
  showConnector,
  onNavigateTab,
}: {
  stage: PipelineStageView
  showConnector: boolean
  onNavigateTab?: (tab: DashboardTab) => void
}) {
  const clickable = Boolean(stage.dashboardTab && onNavigateTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        disabled={!clickable}
        tabIndex={clickable ? 0 : -1}
        aria-disabled={!clickable}
        onClick={() => {
          if (stage.dashboardTab && onNavigateTab) onNavigateTab(stage.dashboardTab)
        }}
        style={{
          ...cardStyle,
          textAlign: 'left',
          cursor: clickable ? 'pointer' : 'default',
          borderColor: stage.status === 'failed'
            ? 'rgba(255,77,106,.35)'
            : stage.status === 'running' || stage.status === 'pending'
              ? 'rgba(245,166,35,.25)'
              : 'rgba(148,163,184,.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{stage.label}</div>
          <Badge label={stage.status.replace(/_/g, ' ')} tone={STATUS_TONE[stage.status] ?? 'default'} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--txdd)' }}>
          {stage.count != null ? <span>Count: {stage.count}</span> : null}
          {stage.latestAt ? <span>Latest: {new Date(stage.latestAt).toLocaleString()}</span> : null}
          {clickable ? <span style={{ color: 'var(--blue)' }}>View tab →</span> : null}
        </div>

        {stage.errors.length > 0 ? (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)' }}>
            {stage.errors.slice(0, 3).map((msg) => (
              <div key={msg}>{msg}</div>
            ))}
          </div>
        ) : null}

        {stage.warnings.length > 0 ? (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)' }}>
            {stage.warnings.slice(0, 3).map((msg) => (
              <div key={msg}>{msg}</div>
            ))}
          </div>
        ) : null}
      </button>

      {showConnector ? (
        <div style={{ alignSelf: 'center', color: 'var(--txdd)', fontSize: 12 }}>↓</div>
      ) : null}
    </div>
  )
}
