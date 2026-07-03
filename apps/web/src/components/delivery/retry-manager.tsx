'use client'

import { useState } from 'react'
import type { QueueEntry, DLQEntry } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface RetryManagerProps {
  queue: QueueEntry[]
  dlq: DLQEntry[]
}

type ManagerTab = 'queue' | 'dlq'

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  overflow: 'hidden',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--tx)',
}

const innerTabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid var(--border)',
}

const innerTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  fontSize: 12,
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--teal)' : 'var(--txd)',
  borderBottom: active ? '2px solid var(--teal)' : '2px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
  marginBottom: -1,
})

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  padding: '12px 20px',
  borderBottom: '1px solid var(--border)',
}

const statStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
}

const statValueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--tx)',
  marginRight: 4,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--txd)',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--tx)',
}

const actionButtonStyle = (color: string): React.CSSProperties => ({
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  marginRight: 6,
})

const dotStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  marginRight: 6,
})

const emptyStateStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: 'var(--txd)',
  fontSize: 14,
}

const toastStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  margin: '8px 14px',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RetryManager({ queue, dlq: initialDlq }: RetryManagerProps) {
  const [activeInnerTab, setActiveInnerTab] = useState<ManagerTab>('queue')
  const [queueState, setQueueState] = useState<QueueEntry[]>(queue)
  const [dlqState, setDlqState] = useState<DLQEntry[]>(initialDlq)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Queue actions ──
  const handleForceRetry = (entryId: string) => {
    setQueueState(prev =>
      prev.map(e => e.id === entryId ? { ...e, status: 'pending' as const, attemptNumber: e.attemptNumber + 1, nextAttemptAt: new Date().toISOString() } : e),
    )
    showToast('Force retry queued', 'success')
  }

  const handleMoveToDlq = (entry: QueueEntry) => {
    setQueueState(prev => prev.filter(e => e.id !== entry.id))
    const dlqEntry: DLQEntry = {
      id: `dlq-${entry.id}` as DLQEntry['id'],
      artifactId: entry.artifactId,
      channelId: entry.channelId,
      recipientId: entry.recipientId,
      failureReason: entry.lastError ?? 'Manually moved to DLQ',
      failedAt: new Date().toISOString(),
      attemptNumber: entry.attemptNumber,
      movedToDLQAt: new Date().toISOString(),
      originalEntryId: entry.id,
    }
    setDlqState(prev => [...prev, dlqEntry])
    showToast('Moved to DLQ', 'success')
  }

  // ── DLQ actions ──
  const handleReplay = (entry: DLQEntry) => {
    setDlqState(prev => prev.filter(e => e.id !== entry.id))
    const replayed: QueueEntry = {
      id: `replay-${entry.id}` as QueueEntry['id'],
      artifactId: entry.artifactId,
      channelId: entry.channelId,
      recipientId: entry.recipientId,
      status: 'pending',
      attemptNumber: 0,
      lastAttemptAt: null,
      nextAttemptAt: new Date().toISOString(),
      lastError: null,
      createdAt: new Date().toISOString(),
    }
    setQueueState(prev => [...prev, replayed])
    showToast('Replayed to active queue', 'success')
  }

  const handleDismiss = (id: string) => {
    setDlqState(prev => prev.filter(e => e.id !== id))
    showToast('Dismissed from DLQ', 'success')
  }

  // ── Stats ──
  const pendingCount = queueState.filter(e => e.status === 'pending').length
  const processingCount = queueState.filter(e => e.status === 'processing').length
  const failedCount = queueState.filter(e => e.status === 'failed').length

  return (
    <section style={sectionStyle}>
      {/* Header */}
      <div style={sectionHeaderStyle}>
        <h3 style={sectionTitleStyle}>Queue Manager</h3>
      </div>

      {/* Inner tabs */}
      <div style={innerTabBarStyle}>
        <button style={innerTabStyle(activeInnerTab === 'queue')} onClick={() => setActiveInnerTab('queue')}>
          Active Queue
        </button>
        <button style={innerTabStyle(activeInnerTab === 'dlq')} onClick={() => setActiveInnerTab('dlq')}>
          Dead Letter Queue
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...toastStyle, color: toast.type === 'success' ? '#065F46' : '#991B1B', background: toast.type === 'success' ? '#D1FAE5' : '#FEE2E2' }}>
          {toast.message}
        </div>
      )}

      {/* ── Active Queue Tab ── */}
      {activeInnerTab === 'queue' && (
        <>
          <div style={statsRowStyle}>
            <span style={statStyle}><span style={{ ...statValueStyle, color: STATUS_COLORS.pending }}>{pendingCount}</span>Pending</span>
            <span style={statStyle}><span style={{ ...statValueStyle, color: STATUS_COLORS.processing }}>{processingCount}</span>Processing</span>
            <span style={statStyle}><span style={{ ...statValueStyle, color: STATUS_COLORS.failed }}>{failedCount}</span>Failed</span>
            <span style={statStyle}><span style={statValueStyle}>{queueState.length}</span>Total</span>
          </div>

          {queueState.length === 0 ? (
            <div style={emptyStateStyle}>All deliveries processed</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Artifact ID</th>
                    <th style={thStyle}>Channel</th>
                    <th style={thStyle}>Recipient</th>
                    <th style={thStyle}>Attempt #</th>
                    <th style={thStyle}>Next Attempt</th>
                    <th style={thStyle}>Last Error</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queueState.map(e => (
                    <tr key={e.id}>
                      <td style={tdStyle}>
                        <span style={dotStyle(STATUS_COLORS[e.status] ?? '#6B7280')} />
                        {e.status}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{e.artifactId.slice(0, 12)}...</td>
                      <td style={tdStyle}>{e.channelId.slice(0, 10)}...</td>
                      <td style={tdStyle}>{e.recipientId.slice(0, 10)}...</td>
                      <td style={tdStyle}>{e.attemptNumber}</td>
                      <td style={tdStyle}>{e.nextAttemptAt?.slice(11, 16) ?? '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: 'var(--txd)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.lastError ?? '—'}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleForceRetry(e.id)} style={actionButtonStyle('#3B82F6')}>Force Retry</button>
                        <button onClick={() => handleMoveToDlq(e)} style={actionButtonStyle('#EF4444')}>→ DLQ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Dead Letter Queue Tab ── */}
      {activeInnerTab === 'dlq' && (
        <>
          <div style={statsRowStyle}>
            <span style={statStyle}><span style={{ ...statValueStyle, color: '#DC2626' }}>{dlqState.length}</span>Total in DLQ</span>
          </div>

          {dlqState.length === 0 ? (
            <div style={emptyStateStyle}>No failed deliveries in DLQ</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Artifact ID</th>
                    <th style={thStyle}>Channel</th>
                    <th style={thStyle}>Recipient</th>
                    <th style={thStyle}>Failure Reason</th>
                    <th style={thStyle}>Failed At</th>
                    <th style={thStyle}>Attempts</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dlqState.map(e => (
                    <tr key={e.id}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{e.artifactId.slice(0, 12)}...</td>
                      <td style={tdStyle}>{e.channelId.slice(0, 10)}...</td>
                      <td style={tdStyle}>{e.recipientId.slice(0, 10)}...</td>
                      <td style={{ ...tdStyle, fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.failureReason}</td>
                      <td style={tdStyle}>{e.failedAt.slice(0, 16).replace('T', ' ')}</td>
                      <td style={tdStyle}>{e.attemptNumber}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleReplay(e)} style={actionButtonStyle('#10B981')}>Replay</button>
                        <button onClick={() => handleDismiss(e.id)} style={actionButtonStyle('#6B7280')}>Dismiss</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
