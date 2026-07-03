'use client'

import { FormEvent, useState } from 'react'
import type { DashboardData } from './types'
import {
  CURATION_ACTIONS,
  CURATION_TARGET_TYPES,
  submitCurationAction,
} from './discovery-api'
import { Badge, EmptyPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(148,163,184,.35)',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'rgba(15,23,42,.65)',
  color: 'var(--tx)',
  fontSize: 13,
}

export function DiscoveryCurationPanel({
  data,
  loading,
  onSubmitted,
}: {
  data: DashboardData | null
  loading: boolean
  onSubmitted: () => void
}) {
  const [targetType, setTargetType] = useState<string>(CURATION_TARGET_TYPES[0])
  const [targetId, setTargetId] = useState('')
  const [action, setAction] = useState<string>(CURATION_ACTIONS[0])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="Open a discovery session to perform curation." />

  const runId = data.latestRun?.id
  const events = data.curationEvents ?? []

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!runId) {
      setError('A discovery run is required before recording curation actions.')
      return
    }
    if (!targetId.trim()) {
      setError('Target ID is required.')

      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await submitCurationAction({
        targetType,
        targetId: targetId.trim(),
        action,
        reason: reason.trim() || undefined,
        discoveryRunId: runId,
      })
      setMessage('Curation action recorded.')
      setTargetId('')
      setReason('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record curation action')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Curation"
        description="Record human curation decisions via the Discovery Curation API. Never writes to Evidence Core."
      />

      {!runId ? (
        <EmptyPanel message="No discovery run available for curation." hint="Run the pipeline to attach curation to a run." />
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} style={{ ...cardStyle, display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Target type
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={inputStyle}>
              {CURATION_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Target ID
            <input value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle} placeholder="candidate / entity / relationship id" />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Action
            <select value={action} onChange={(e) => setAction(e.target.value)} style={inputStyle}>
              {CURATION_ACTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Reason (optional)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {error ? <div style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div> : null}
          {message ? <div style={{ color: 'var(--green)', fontSize: 12 }}>{message}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              justifySelf: 'start',
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(59,130,246,.45)',
              background: 'rgba(59,130,246,.18)',
              color: 'var(--tx)',
              fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? 'Recording…' : 'Record curation action'}
          </button>
        </form>
      )}

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Recent curation events</h3>
        {events.length === 0 ? (
          <EmptyPanel message="No curation events recorded yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.slice(0, 20).map((event) => (
              <div key={event.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Badge label={event.action} tone="green" />
                  <Badge label={event.target_type} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx)' }}>{event.target_id}</div>
                {event.reason ? <div style={{ fontSize: 12, color: 'var(--txdd)', marginTop: 6 }}>{event.reason}</div> : null}
                <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 6 }}>
                  {new Date(event.created_at).toLocaleString()} · {event.actor_role}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

