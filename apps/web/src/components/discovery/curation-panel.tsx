'use client'

import { FormEvent, useState } from 'react'
import type { DashboardData, DiscoveryCandidate } from './types'
import {
  CURATION_ACTIONS,
  CURATION_ACTION_LABELS,
  CURATION_TARGET_TYPES,
  CURATION_TARGET_TYPE_LABELS,
  submitCurationAction,
} from './discovery-api'
import { candidateStateTone, excerpt, formatDiscoveryConfidence, labelize, parseEnrichmentPayload } from './lib'
import { Badge, EmptyPanel, FormMessage, inputStyle, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

export function DiscoveryCurationPanel({
  data,
  loading,
  onSubmitted,
  onAddNote,
}: {
  data: DashboardData | null
  loading: boolean
  onSubmitted: () => void
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="Open a discovery session to perform curation." />

  const runId = data.latestRun?.id
  const events = data.curationEvents ?? []
  const candidates = data.candidates ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Review & Improve Evidence"
        description="Record human curation decisions. Provisional discovery outputs stay in the discovery layer — never written to Evidence Core."
      />

      {!runId ? (
        <EmptyPanel message="No discovery run available for curation." hint="Run the pipeline to attach curation to a run." />
      ) : (
        <>
          <section>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>
              Claim candidate queue
            </h3>
            {candidates.length === 0 ? (
              <EmptyPanel
                message="No claim candidates awaiting curation."
                hint="Candidates appear here once the pipeline proposes them."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {candidates.slice(0, 30).map((candidate) => (
                  <CandidateCurationCard
                    key={candidate.id}
                    candidate={candidate}
                    runId={runId}
                    onSubmitted={onSubmitted}
                    onAddNote={onAddNote}
                  />
                ))}
              </div>
            )}
          </section>

          <ManualCurationForm runId={runId} onSubmitted={onSubmitted} />
        </>
      )}

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Recent curation events</h3>
        {events.length === 0 ? (
          <EmptyPanel message="No curation events recorded yet." hint="Curation actions appear here after you record them." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.slice(0, 20).map((event) => (
              <div key={event.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Badge
                    label={CURATION_ACTION_LABELS[event.action as keyof typeof CURATION_ACTION_LABELS] ?? event.action}
                    tone="green"
                  />
                  <Badge label={labelize(event.target_type)} />
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

function CandidateCurationCard({
  candidate,
  runId,
  onSubmitted,
  onAddNote,
}: {
  candidate: DiscoveryCandidate
  runId: string
  onSubmitted: () => void
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  const [reason, setReason] = useState('')
  const [enrichOpen, setEnrichOpen] = useState(false)
  const [enrichmentText, setEnrichmentText] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (action: string, enrichmentPayload?: Record<string, unknown>) => {
    setPendingAction(action)
    setError(null)
    setSuccess(null)
    try {
      await submitCurationAction({
        targetType: 'EVIDENCE_CANDIDATE',
        targetId: candidate.id,
        action,
        reason: reason.trim() || undefined,
        discoveryRunId: runId,
        enrichmentPayload,
      })
      setSuccess(`${CURATION_ACTION_LABELS[action as keyof typeof CURATION_ACTION_LABELS] ?? action} recorded.`)
      setReason('')
      setEnrichOpen(false)
      setEnrichmentText('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record curation action')
    } finally {
      setPendingAction(null)
    }
  }

  const handleAction = (action: string) => {
    if (action === 'ENRICH') {
      setEnrichOpen((open) => !open)
      return
    }
    void submit(action)
  }

  const handleEnrichSubmit = () => {
    const parsed = parseEnrichmentPayload(enrichmentText)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    void submit('ENRICH', parsed.value)
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Badge label={labelize(candidate.current_state)} tone={candidateStateTone(candidate.current_state)} />
        {candidate.proposed_evidence_class ? (
          <Badge label={labelize(candidate.proposed_evidence_class)} />
        ) : null}
        <span style={{ fontSize: 11, color: 'var(--txdd)', alignSelf: 'center' }}>
          Discovery confidence: {formatDiscoveryConfidence(candidate.discovery_confidence)}
        </span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.5 }}>{excerpt(candidate.content)}</div>
      <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 6 }}>
        {candidate.id} · {candidate.source} · {new Date(candidate.created_at).toLocaleString()}
      </div>

      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)', marginTop: 10 }}>
        Reason (optional)
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={inputStyle}
          placeholder="Why this decision?"
        />
      </label>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {CURATION_ACTIONS.map((action) => {
          const isPending = pendingAction === action
          return (
            <button
              key={action}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => handleAction(action)}
              aria-pressed={action === 'ENRICH' ? enrichOpen : undefined}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,.35)',
                background: action === 'ENRICH' && enrichOpen ? 'rgba(59,130,246,.25)' : 'rgba(59,130,246,.12)',
                color: 'var(--tx)',
                fontSize: 11,
                fontWeight: 600,
                cursor: pendingAction !== null ? 'wait' : 'pointer',
                opacity: pendingAction !== null && !isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Recording…' : CURATION_ACTION_LABELS[action]}
            </button>
          )
        })}
        {onAddNote ? (
          <button
            type="button"
            onClick={() => onAddNote('EVIDENCE_CANDIDATE', candidate.id)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,.35)',
              background: 'transparent',
              color: 'var(--txd)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add note
          </button>
        ) : null}
      </div>

      {enrichOpen ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Enrichment payload (JSON object)
            <textarea
              value={enrichmentText}
              onChange={(e) => setEnrichmentText(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace' }}
              placeholder='{"field": "value"}'
            />
          </label>
          <button
            type="button"
            disabled={pendingAction !== null}
            onClick={handleEnrichSubmit}
            style={{
              justifySelf: 'start',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(59,130,246,.45)',
              background: 'rgba(59,130,246,.18)',
              color: 'var(--tx)',
              fontSize: 12,
              fontWeight: 600,
              cursor: pendingAction !== null ? 'wait' : 'pointer',
            }}
          >
            {pendingAction === 'ENRICH' ? 'Recording…' : 'Submit enrichment'}
          </button>
        </div>
      ) : null}

      <FormMessage error={error} success={success} messageId={`curation-candidate-${candidate.id}-message`} />
    </div>
  )
}

function ManualCurationForm({ runId, onSubmitted }: { runId: string; onSubmitted: () => void }) {
  const [targetType, setTargetType] = useState<string>(CURATION_TARGET_TYPES[0])
  const [targetId, setTargetId] = useState('')
  const [action, setAction] = useState<string>(CURATION_ACTIONS[0])
  const [reason, setReason] = useState('')
  const [enrichmentText, setEnrichmentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!targetId.trim()) {
      setError('Target ID is required.')
      return
    }

    let enrichmentPayload: Record<string, unknown> | undefined
    if (action === 'ENRICH') {
      const parsed = parseEnrichmentPayload(enrichmentText)
      if (!parsed.ok) {
        setError(parsed.error)
        return
      }
      enrichmentPayload = parsed.value
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
        enrichmentPayload,
      })
      setMessage('Curation action recorded.')
      setTargetId('')
      setReason('')
      setEnrichmentText('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record curation action')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>
        Curate another target
      </h3>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ ...cardStyle, display: 'grid', gap: 12 }} aria-label="Record curation action">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Target type
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={inputStyle}>
              {CURATION_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CURATION_TARGET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Action
            <select value={action} onChange={(e) => setAction(e.target.value)} style={inputStyle}>
              {CURATION_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {CURATION_ACTION_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
          Target ID
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={inputStyle}
            placeholder="candidate / entity / relationship id"
            aria-invalid={Boolean(error && !targetId.trim())}
            aria-describedby="discovery-curation-form-message"
          />
        </label>

        {action === 'ENRICH' ? (
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Enrichment payload (JSON object)
            <textarea
              value={enrichmentText}
              onChange={(e) => setEnrichmentText(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace' }}
              placeholder='{"field": "value"}'
            />
          </label>
        ) : null}

        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
          Reason (optional)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <FormMessage error={error} success={message} messageId="discovery-curation-form-message" />

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
    </section>
  )
}
