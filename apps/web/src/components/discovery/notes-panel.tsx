'use client'

import { FormEvent, useState } from 'react'
import type { DashboardData } from './types'
import { submitValidationNote, VALIDATION_CATEGORIES } from './discovery-api'
import { labelize } from './lib'
import { Badge, EmptyPanel, FormMessage, inputStyle, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

export interface NotePrefill {
  targetType: string
  targetId: string
}

export function DiscoveryNotesPanel({
  data,
  loading,
  onSubmitted,
  prefill,
}: {
  data: DashboardData | null
  loading: boolean
  onSubmitted: () => void
  prefill?: NotePrefill | null
}) {
  const [category, setCategory] = useState<string>(VALIDATION_CATEGORIES[0])
  const [note, setNote] = useState('')
  // The panel remounts on tab activation, so the contextual prefill from a
  // candidate row is applied as initial state — no effect needed.
  const [targetType, setTargetType] = useState(prefill?.targetType ?? '')
  const [targetId, setTargetId] = useState(prefill?.targetId ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="Open a discovery session to record validation notes." />

  const notes = data.validationNotes ?? []

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!note.trim()) {
      setError('Note text is required.')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await submitValidationNote({
        discoverySessionId: data.session.id,
        discoveryRunId: data.latestRun?.id,
        category,
        note: note.trim(),
        targetType: targetType.trim() || undefined,
        targetId: targetId.trim() || undefined,
      })
      setMessage('Validation note recorded.')
      setNote('')
      setTargetType('')
      setTargetId('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record validation note')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Validation Notes"
        description="Capture reviewer feedback on reconstruction quality, misses, and surprises during institutional discovery."
      />

      <form onSubmit={(e) => void handleSubmit(e)} style={{ ...cardStyle, display: 'grid', gap: 12 }} aria-label="Record validation note">
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {VALIDATION_CATEGORIES.map((item) => (
              <option key={item} value={item}>{labelize(item)}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
            aria-invalid={Boolean(error && !note.trim())}
            aria-describedby="discovery-notes-form-message"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Target type (optional)
            <input value={targetType} onChange={(e) => setTargetType(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--txdd)' }}>
            Target ID (optional)
            <input value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle} />
          </label>
        </div>

        <FormMessage error={error} success={message} messageId="discovery-notes-form-message" />

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
          {submitting ? 'Saving…' : 'Record validation note'}
        </button>
      </form>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Recent notes</h3>
        {notes.length === 0 ? (
          <EmptyPanel message="No validation notes recorded yet." hint="Notes help Kadarn improve reconstruction quality over time." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.slice(0, 20).map((item) => (
              <div key={item.id} style={cardStyle}>
                <div style={{ marginBottom: 6 }}><Badge label={labelize(item.category)} /></div>
                <div style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.5 }}>{item.note}</div>
                {(item.target_type || item.target_id) ? (
                  <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 6 }}>
                    Target: {item.target_type ?? '—'} · {item.target_id ?? '—'}
                  </div>
                ) : null}
                <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 6 }}>
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
