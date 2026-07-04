import type { PassportHistoryEvent } from '../passport-types'
import { cardStyle, cardTitleStyle } from '../passport-styles'

export function HistorySection({ history }: { history: PassportHistoryEvent[] }) {
  return (
    <section id="passport-history" style={cardStyle} aria-labelledby="passport-history-heading">
      <h2 id="passport-history-heading" style={cardTitleStyle}>History</h2>
      <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16, lineHeight: 1.45 }}>
        How this Passport has changed — evidence arrivals, confidence movements, and portfolio events.
      </p>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {history.map((event, index) => (
          <li
            key={event.id}
            style={{
              display: 'flex',
              gap: 14,
              padding: '12px 0',
              borderBottom: index < history.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <time
              dateTime={event.occurredAt}
              style={{
                fontSize: 11,
                color: 'var(--txdd)',
                minWidth: 100,
                flexShrink: 0,
              }}
            >
              {new Date(event.occurredAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
                {event.eventType}
              </div>
              <div style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.45 }}>
                {event.description}
              </div>
              {event.actor && (
                <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>
                  Actor: {event.actor}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
